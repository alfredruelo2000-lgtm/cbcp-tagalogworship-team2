import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { getSetlist, type SetlistItem } from '@/lib/db-setlists.functions';
import { cacheSongsOffline } from '@/lib/offline';

/**
 * Reads the `?setlist=` context of a song chart and exposes the ordered
 * sequence so the reader can move song-to-song without leaving the setlist.
 */
export function useSetlistSequence(songId: string) {
  const searchStr = useLocation({ select: (l) => l.searchStr });
  const navigate = useNavigate();

  const setlistId = useMemo(() => new URLSearchParams(searchStr).get('setlist') || null, [searchStr]);

  const { data: setlist } = useQuery({
    queryKey: ['setlist', setlistId],
    queryFn: () => getSetlist(setlistId as string),
    enabled: Boolean(setlistId),
  });

  const items = useMemo<SetlistItem[]>(
    () => (setlist?.service_items ?? []).filter((item) => Boolean(item.song_id)),
    [setlist],
  );

  const index = items.findIndex((item) => item.song_id === songId);
  const current = index >= 0 ? items[index] : undefined;
  const previous = index > 0 ? items[index - 1] : undefined;
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : undefined;

  const goTo = useCallback(
    (item?: SetlistItem) => {
      if (!item?.song_id || !setlistId) return;
      navigate({
        to: '/songs/$id',
        params: { id: item.song_id },
        search: { key: getLocalSetlistKey(setlistId, item.id) || item.selected_key || undefined, setlist: setlistId } as never,

      });
    },
    [navigate, setlistId],
  );

  return { setlistId, setlist, items, index, current, previous, next, goTo };
}

/**
 * Warms the neighbouring songs of the setlist: their routes are preloaded and their
 * full chart bodies are written to IndexedDB, so swiping is instant and works offline.
 */
export function useSetlistNeighborPrefetch(
  songs: any[],
  sequence: { setlistId: string | null; items: SetlistItem[]; index: number; previous?: SetlistItem | undefined; next?: SetlistItem | undefined },
) {
  const router = useRouter();
  const { setlistId, previous, next, index } = sequence;

  useEffect(() => {
    if (!setlistId || index < 0) return;
    const neighbours = [previous, next].filter(Boolean) as SetlistItem[];
    if (neighbours.length === 0) return;

    const byId = new Map((songs ?? []).map((song: any) => [song.id, song]));
    const idle = window.setTimeout(() => {
      void cacheSongsOffline(neighbours.map((item) => byId.get(item.song_id as string)).filter(Boolean));
      neighbours.forEach((item) => {
        void router
          .preloadRoute({
            to: '/songs/$id',
            params: { id: item.song_id as string },
            search: { key: item.selected_key || undefined, setlist: setlistId } as never,
          })
          .catch(() => undefined);
      });
    }, 150);

    return () => window.clearTimeout(idle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlistId, index, previous?.song_id, next?.song_id, songs?.length]);
}

/** Swipe left/right + arrow keys to move through the setlist. */
export function useSetlistSwipe(enabled: boolean, onPrevious: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number; t: number; scrollY: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      // Two-finger gestures (pinch/zoom) and non-primary touches never navigate.
      if (event.touches.length !== 1) { start.current = null; return; }
      const touch = event.touches[0];
      start.current = touch
        ? { x: touch.clientX, y: touch.clientY, t: Date.now(), scrollY: window.scrollY }
        : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const origin = start.current;
      const touch = event.touches[0];
      if (!origin || !touch) return;
      // As soon as the gesture reads as vertical, abandon it for good.
      const dy = Math.abs(touch.clientY - origin.y);
      const dx = Math.abs(touch.clientX - origin.x);
      if (dy > 18 && dy > dx) start.current = null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const origin = start.current;
      const touch = event.changedTouches[0];
      start.current = null;
      if (!origin || !touch) return;

      const target = event.target as HTMLElement | null;
      // Never hijack gestures inside controls, inputs or horizontally scrollable strips.
      if (target?.closest('input,textarea,select,button,a,[role="slider"],[data-no-swipe]')) return;

      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      const elapsed = Date.now() - origin.t;
      const scrolled = Math.abs(window.scrollY - origin.scrollY) > 6;

      if (scrolled) return;                                  // the page moved: it was a scroll
      if (elapsed > 700) return;                             // slow drag, not a flick
      if (Math.abs(dx) < 80) return;                         // needs real horizontal travel
      if (Math.abs(dy) > 45) return;                         // too much vertical drift
      if (Math.abs(dx) < Math.abs(dy) * 2.5) return;         // clearly horizontal intent

      if (dx < 0) onNext();
      else onPrevious();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrevious();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, onPrevious, onNext]);
}

export function SetlistSongNav({
  setlistId,
  setlistTitle,
  index,
  total,
  previousTitle,
  nextTitle,
  onPrevious,
  onNext,
}: {
  setlistId: string;
  setlistTitle?: string | undefined;
  index: number;
  total: number;
  previousTitle?: string | undefined;
  nextTitle?: string | undefined;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-accent/10 bg-muted/30 px-2 py-1.5 print:hidden">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!previousTitle}
        aria-label={previousTitle ? `Previous song: ${previousTitle}` : 'No previous song'}
        className="flex h-9 min-w-0 max-w-[35%] items-center gap-1 px-1 text-[11px] text-muted-foreground disabled:opacity-30"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" />
        <span className="truncate">{previousTitle ?? '—'}</span>
      </button>

      <Link
        to="/setlists/$id"
        params={{ id: setlistId }}
        className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-accent"
      >
        <ListMusic className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{setlistTitle ?? 'Setlist'}</span>
        <span className="shrink-0 text-muted-foreground">{index + 1}/{total}</span>
      </Link>

      <button
        type="button"
        onClick={onNext}
        disabled={!nextTitle}
        aria-label={nextTitle ? `Next song: ${nextTitle}` : 'No next song'}
        className="flex h-9 min-w-0 max-w-[35%] items-center justify-end gap-1 px-1 text-[11px] text-muted-foreground disabled:opacity-30"
      >
        <span className="truncate">{nextTitle ?? '—'}</span>
        <ChevronRight className="h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}
