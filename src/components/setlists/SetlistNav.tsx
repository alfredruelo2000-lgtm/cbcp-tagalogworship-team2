import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { getSetlist, type SetlistItem } from '@/lib/db-setlists.functions';

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
        search: { key: item.selected_key || undefined, setlist: setlistId } as never,
      });
    },
    [navigate, setlistId],
  );

  return { setlistId, setlist, items, index, current, previous, next, goTo };
}

/** Swipe left/right + arrow keys to move through the setlist. */
export function useSetlistSwipe(enabled: boolean, onPrevious: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const origin = start.current;
      const touch = event.changedTouches[0];
      start.current = null;
      if (!origin || !touch) return;
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      // Horizontal intent only — never fight vertical scrolling or auto-scroll.
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
      if (dx < 0) onNext();
      else onPrevious();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrevious();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
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
