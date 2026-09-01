import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSongPublicById, getSongsPublic } from '@/lib/db-public.functions';
import { songKeys } from '@/lib/song-data';
import { Button } from '@/components/ui/button';
import {
  Printer, Share2, Maximize2, Minimize2, ArrowLeft, Play, Pause, Volume2, RefreshCw, ListMusic,
} from 'lucide-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { KEYS, getSemitoneDifference, chordToNumber } from '@/utils/transposition';
import { splitSongSections, shortSectionLabel, looksLikeChordLine, isChordToken } from '@/lib/song-format';
import { extractChords, keyPrefersFlats, renderChordToken } from '@/lib/chords';
import { ChordCardDialog, ChordsPanel } from '@/components/songs/ChordTools';
import { MoreSheet, PerformanceToolbar } from '@/components/songs/ViewerControls';
import { HIGHLIGHT_ALPHA, TYPEFACE_STACKS, useViewerSettings } from '@/hooks/use-viewer-settings';
import { useAutoScroll } from '@/hooks/use-auto-scroll';

const TunerDialog = lazy(() =>
  import('@/components/songs/Tuner').then((module) => ({ default: module.TunerDialog })),
);

import { WorshipSong } from '@/types/songs';
import { toast } from 'sonner';
import { AddToSetlistButton } from '@/components/setlists/AddToSetlistDialog';
import { SetlistSongNav, useSetlistSequence, useSetlistSwipe, useSetlistNeighborPrefetch } from '@/components/setlists/SetlistNav';
import { useSetlistAbilities } from '@/components/setlists/setlist-hooks';
import { updateSetlistItem } from '@/lib/db-setlists.functions';
import { getLocalSetlistKey, setLocalSetlistKey } from '@/lib/setlist-key-prefs';

import { useOnlineStatus, cacheSongsOffline, getCachedSongChart, type CachedChart } from '@/lib/offline';

export const Route = createFileRoute('/_public/songs/$id')({
  head: () => ({
    meta: [
      { title: "Song Chords, Lyrics & Keys | CBCP Tagalog Worship Team" },
      { name: "description", content: "Practice-ready worship chart: transpose keys, tap any chord for guitar, ukulele or piano diagrams, simplify chords, and auto-scroll hands-free." },
      { property: "og:title", content: "Worship Song Chart | CBCP Tagalog Worship Team" },
      { property: "og:description", content: "Transpose, tap chords for diagrams and reference tones, and practice with auto-scroll." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Worship Song Chart | CBCP Tagalog Worship Team" },
      { name: "twitter:description", content: "Transpose, tap chords for diagrams and reference tones, and practice with auto-scroll." },
    ],
  }),

  component: SongDetailPage,
});

function SongDetailPage() {
  const online = useOnlineStatus();
  const { data: songs = [] } = useQuery({
    queryKey: songKeys.publicList,
    queryFn: getSongsPublic,
  });

  const { id } = Route.useParams();
  const { data: rawSong, isPending: isSongPending, isFetching: isSongFetching } = useQuery({
    queryKey: songKeys.publicDetail(id as string),
    queryFn: () => getSongPublicById(id as string),
    retry: 1,
  });

  // Offline fallback: the full chart body kept in IndexedDB by prefetch / "Save offline".
  const [cachedChart, setCachedChart] = useState<CachedChart | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  useEffect(() => {
    if (rawSong) { void cacheSongsOffline([rawSong]); return; }
    let active = true;
    setCacheChecked(false);
    void getCachedSongChart(id as string)
      .then((chart) => { if (active && chart) setCachedChart(chart); })
      .finally(() => { if (active) setCacheChecked(true); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rawSong]);

  const song = useMemo(
    () => (rawSong ?? cachedChart) as unknown as WorshipSong,
    [rawSong, cachedChart],
  );

  // Never flash "Song not found" while the chart is still resolving (network or IndexedDB).
  const isResolving = isSongPending || isSongFetching || !cacheChecked;

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

  const { settings, update, reset } = useViewerSettings();
  const [currentKey, setCurrentKey] = useState(searchParams.get('key') || song?.defaultKey || 'C');

  // ----- Setlist context: sequence navigation + per-setlist key persistence -----
  const sequence = useSetlistSequence(id as string);
  const { canEdit } = useSetlistAbilities();
  const setlistId = sequence.setlist?.id ?? null;
  const canSaveSetlistKey = Boolean(sequence.current) && canEdit(sequence.setlist ?? null);
  const setlistItemKey = sequence.current?.selected_key ?? null;

  // Opening (or swiping to) a setlist song adopts that song's setlist key — never the library
  // default. Outside a setlist the song's own key wins, including when it arrives after the
  // first render (the chart is fetched, so the initial state cannot know it yet).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('key');
    const local = setlistId && sequence.current ? getLocalSetlistKey(setlistId, sequence.current.id) : null;
    const nextKey = local || setlistItemKey || fromUrl || song?.defaultKey;
    if (nextKey) setCurrentKey(nextKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setlistItemKey, setlistId, sequence.current?.id, song?.defaultKey]);

  // Any later key change sticks to this setlist item (device-local instantly, server when allowed).
  const savedSetlistKey = useRef<string | null>(null);
  useEffect(() => {
    const item = sequence.current;
    if (!item || !setlistId || !currentKey) return;
    if (savedSetlistKey.current === currentKey) return;
    const local = getLocalSetlistKey(setlistId, item.id);
    if (currentKey === (local || setlistItemKey)) { savedSetlistKey.current = currentKey; return; }
    savedSetlistKey.current = currentKey;
    setLocalSetlistKey(setlistId, item.id, currentKey);
    if (!canSaveSetlistKey) return;
    const itemId = item.id;
    const timer = setTimeout(() => {
      void updateSetlistItem(itemId, { selected_key: currentKey })
        .then(() => toast.success(online ? `Key saved to setlist (${currentKey})` : `Key saved on this device (${currentKey})`))
        .catch(() => toast.error('Could not save the key to this setlist'));
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, canSaveSetlistKey, setlistItemKey, setlistId, sequence.current?.id]);

  const goPrevious = useCallback(() => sequence.goTo(sequence.previous), [sequence]);
  const goNext = useCallback(() => sequence.goTo(sequence.next), [sequence]);
  useSetlistSwipe(sequence.index >= 0 && sequence.items.length > 1, goPrevious, goNext);
  useSetlistNeighborPrefetch(songs as any[], sequence);

  // ----- Viewer chrome state -----
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [tunerOpen, setTunerOpen] = useState(false);
  const [chordPanelOpen, setChordPanelOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showSectionStrip, setShowSectionStrip] = useState(true);
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [fullView, setFullView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const fromUrl = new URLSearchParams(window.location.search).get('full');
    if (fromUrl !== null) return fromUrl === 'true';
    return localStorage.getItem('song-pref-fullView') === 'true';
  });

  // ----- Metronome (secondary tool, lives inside More) -----
  const [metronomePlaying, setMetronomePlaying] = useState(false);
  const [bpm, setBpm] = useState(song?.bpm || 72);
  const [metronomeVolume, setMetronomeVolume] = useState(song?.externalResources?.metronomeDefaultVolume ?? 0.5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextTickTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => { if (song?.bpm) setBpm(song.bpm); }, [song?.bpm]);

  const playClick = useCallback((time: number, accent = false) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audio = audioCtxRef.current;
    const osc = audio.createOscillator();
    const envelope = audio.createGain();
    osc.frequency.value = accent ? 880 : 440;
    envelope.gain.setValueAtTime(Math.max(0.001, metronomeVolume), time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    osc.connect(envelope);
    envelope.connect(audio.destination);
    osc.start(time);
    osc.stop(time + 0.03);
  }, [metronomeVolume]);

  useEffect(() => {
    if (!metronomePlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    nextTickTimeRef.current = audioCtxRef.current.currentTime;
    beatCountRef.current = 0;
    timerRef.current = setInterval(() => {
      const audio = audioCtxRef.current;
      if (!audio) return;
      while (nextTickTimeRef.current < audio.currentTime + 0.1) {
        playClick(nextTickTimeRef.current, beatCountRef.current === 0);
        beatCountRef.current = (beatCountRef.current + 1) % 4;
        nextTickTimeRef.current += 60 / bpm;
      }
    }, 25);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [metronomePlaying, bpm, playClick]);

  // ----- Full View (performance mode) -----
  useEffect(() => {
    localStorage.setItem('song-pref-fullView', String(fullView));
    document.documentElement.classList.toggle('reader-full-view', fullView);
    return () => document.documentElement.classList.remove('reader-full-view');
  }, [fullView]);

  // Dark reading mode is scoped to the viewer and cleaned up on exit.
  useEffect(() => {
    if (!settings.dark) return;
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, [settings.dark]);

  // Gently dim Full View controls while reading; any tap/keypress restores them.
  useEffect(() => {
    if (!fullView || moreOpen) { setControlsMinimized(false); return; }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      setControlsMinimized(false);
      timer = setTimeout(() => setControlsMinimized(true), 4000);
    };
    schedule();
    window.addEventListener('pointerdown', schedule);
    window.addEventListener('keydown', schedule);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', schedule);
      window.removeEventListener('keydown', schedule);
    };
  }, [fullView, moreOpen]);

  // Optional Wake Lock — fails silently where unsupported.
  useEffect(() => {
    let cancelled = false;
    const release = () => {
      try { wakeLockRef.current?.release?.(); } catch { /* ignore */ }
      wakeLockRef.current = null;
    };
    if (settings.keepAwake && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen')
        .then((lock: any) => { if (cancelled) lock.release?.(); else wakeLockRef.current = lock; })
        .catch(() => update({ keepAwake: false }));
    } else {
      release();
    }
    return () => { cancelled = true; release(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.keepAwake]);

  const { paused: scrollPaused, resume: resumeScroll } = useAutoScroll(
    autoScroll,
    settings.scrollSpeed,
    settings.autoResume,
  );

  // Moving to another song in the setlist only keeps scrolling when asked to.
  useEffect(() => {
    if (!settings.continueScrollBetweenSongs) setAutoScroll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      switch (event.key.toLowerCase()) {
        case 'c': update({ showChords: !settings.showChords }); break;
        case 'l': update({ showLyrics: !settings.showLyrics }); break;
        case 's': update({ simplify: !settings.simplify }); break;
        case 'a': setAutoScroll((previous) => !previous); break;
        case 'escape': if (fullView) setFullView(false); break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.showChords, settings.showLyrics, settings.simplify, fullView, update]);

  // Sections are detected from the song text itself.
  const sections = useMemo(() => splitSongSections(song?.lyrics || ''), [song?.lyrics]);
  const sectionLabels = useMemo(() => {
    const counters: Record<string, number> = {};
    return sections.map((section, index) => {
      let name = section.header?.label ?? '';
      if (!name) {
        const kind = index === 0 ? 'Verse' : 'Part';
        counters[kind] = (counters[kind] || 0) + 1;
        name = `${kind} ${counters[kind]}`;
      }
      return { name, short: shortSectionLabel(name) };
    });
  }, [sections]);

  const jumpToSection = (index: number) => {
    setCurrentSection(index);
    document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const onScroll = () => {
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;
      sections.forEach((_, index) => {
        const element = document.getElementById(`section-${index}`);
        if (!element) return;
        const value = Math.abs(element.getBoundingClientRect().top - 120);
        if (value < distance) { distance = value; nearest = index; }
      });
      setCurrentSection(nearest);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  const semitones = song ? getSemitoneDifference(song.defaultKey || 'C', currentKey) : 0;
  const useFlats = settings.useFlats || keyPrefersFlats(currentKey);

  const renderOptions = useMemo(
    () => ({ semitones, useFlats, simplify: settings.simplify }),
    [semitones, useFlats, settings.simplify],
  );

  /** Chord as it should read right now (transposed, respelled, optionally simplified). */
  const displayChord = useCallback(
    (raw: string) => renderChordToken(raw, renderOptions),
    [renderOptions],
  );

  // Every unique chord actually used in this chart, in the current key.
  const songChords = useMemo(() => {
    const source = song?.lyrics || '';
    const tokens = extractChords(source);
    const rendered = tokens.map((token) => displayChord(token));
    return Array.from(new Set(rendered));
  }, [song?.lyrics, displayChord]);

  if (!song) {
    if (isResolving) {
      return (
        <div className="container mx-auto animate-pulse space-y-6 px-6 py-16">
          <div className="h-4 w-28 bg-muted/40" />
          <div className="h-10 w-2/3 max-w-md bg-muted/30" />
          <div className="space-y-3 pt-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted/20" style={{ width: `${90 - (i % 4) * 12}%` }} />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="font-serif text-3xl">Song not found</h2>
        <Button asChild className="mt-8 rounded-none tracking-widest uppercase bg-accent text-primary">
          <Link to="/songs">Back to Library</Link>
        </Button>
      </div>
    );
  }

  const handleKeyChange = (direction: number) => {
    const isMinor = currentKey.endsWith('m');
    const noteOnly = currentKey.replace('m', '');
    const index = KEYS.indexOf(noteOnly.replace('b', '#') === noteOnly ? noteOnly : noteOnly);
    const fallback = KEYS.indexOf(song.defaultKey?.replace('m', '') || 'C');
    const start = index === -1 ? fallback : index;
    if (start === -1) return;
    let next = (start + direction) % 12;
    if (next < 0) next += 12;
    setCurrentKey(KEYS[next] + (isMinor ? 'm' : ''));
  };

  const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Chord colour + highlight style are per-mode preferences applied inline so any
  // hex (including a custom picker value) works in light and dark reading modes.
  const chordHex = settings.dark ? settings.chordColorDark : settings.chordColorLight;
  const alpha = HIGHLIGHT_ALPHA[settings.highlightStrength];
  const rgba = (() => {
    const value = chordHex.replace('#', '');
    if (value.length !== 6) return `rgba(200,30,30,${alpha})`;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${alpha})`;
  })();
  const chordClass = settings.highlightStyle === 'badge'
    ? 'font-bold rounded px-1 py-0.5'
    : settings.highlightStyle === 'soft'
      ? 'font-bold rounded-sm px-0.5'
      : 'font-bold';
  const chordStyle =
    settings.highlightStyle === 'none'
      ? ''
      : settings.highlightStyle === 'text'
        ? `color:${chordHex}`
        : `color:${chordHex};background-color:${rgba}`;

  const processLine = (content: string) => {
    if (!content) return '';

    // Bracket chords on the fly for charts saved before auto-format existed.
    const source = content.includes('[') && content.includes(']')
      ? content
      : looksLikeChordLine(content)
        ? content.replace(/\S+/g, (token) => (isChordToken(token) ? `[${token}]` : token))
        : content;

    if (source.includes('[') && source.includes(']')) {
      const hasLyricText = source.replace(/\[[^\]]*\]/g, '').trim().length > 0;
      let html = '';
      let cursor = 0;
      const regex = /\[([^\]]+)\]/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(source)) !== null) {
        const between = source.slice(cursor, match.index);
        if (between && (settings.showLyrics || !hasLyricText)) html += escapeHtml(between);
        const rendered = displayChord(match[1] ?? '');
        const label = settings.numberNotation ? chordToNumber(rendered, currentKey) : rendered;
        if (settings.showChords) {
          html += `<button type="button" data-chord="${escapeHtml(rendered)}" style="${chordStyle}" class="${chordClass} cursor-pointer align-baseline">${escapeHtml(label)}</button>`;
        }
        cursor = match.index + match[0].length;
      }
      const tail = source.slice(cursor);
      if (tail && (settings.showLyrics || !hasLyricText)) html += escapeHtml(tail);
      return html;
    }

    return settings.showLyrics ? escapeHtml(source) : '';
  };

  const onSheetClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest('[data-chord]');
    if (!target) return;
    const chord = target.getAttribute('data-chord');
    if (chord) setSelectedChord(chord);
  };

  const handleShare = () => {
    const params = new URLSearchParams({ key: currentKey, full: String(fullView) });
    void navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?${params}`);
    toast.success('Practice link copied to clipboard!');
  };

  return (
    <div className="song-reader min-h-dvh bg-background text-foreground pb-24">
      {sequence.setlistId && sequence.index >= 0 && (
        <SetlistSongNav
          setlistId={sequence.setlistId}
          setlistTitle={sequence.setlist?.title}
          index={sequence.index}
          total={sequence.items.length}
          previousTitle={sequence.previous?.title}
          nextTitle={sequence.next?.title}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      )}

      {/* Compact reader header — hidden in Performance (Full) View */}
      {!fullView && (
        <header className="song-reader-ui sticky top-0 z-40 border-b border-border bg-card print:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:px-6">
            <Button variant="ghost" size="sm" asChild className="h-11 shrink-0 px-1 hover:bg-transparent">
              <Link to="/songs" className="flex items-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Library
              </Link>
            </Button>
            <h1 className="min-w-0 flex-1 truncate font-serif text-lg font-bold text-primary sm:text-2xl">{song.title}</h1>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setChordPanelOpen(!chordPanelOpen)} className={`h-11 rounded-none px-2.5 sm:px-3 ${chordPanelOpen ? 'bg-accent/20' : ''}`} aria-label="Toggle chord diagrams">
                <ListMusic className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Chords</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden h-11 rounded-none px-3 sm:inline-flex" aria-label="Print chart">
                <Printer className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="hidden h-11 rounded-none px-3 sm:inline-flex" aria-label="Share practice link">
                <Share2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Share</span>
              </Button>
              <AddToSetlistButton song={{ id: song.id, title: song.title, defaultKey: currentKey }} label="Setlist" className="h-11 rounded-none px-2.5 sm:px-3" />
              <Button size="sm" onClick={() => setFullView(true)} className="h-11 rounded-none bg-primary px-2.5 text-primary-foreground sm:px-3" aria-label="Enter performance mode">
                <Maximize2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Performance</span>
              </Button>
            </div>
          </div>
        </header>
      )}

      {chordPanelOpen && (
        <ChordsPanel
          chords={songChords}
          instrument={settings.instrument}
          leftHanded={settings.leftHanded}
          tuning={settings.ukuleleTuning === 'low-g' ? 'low-g' : 'standard'}
          useFlats={useFlats}
          onSelect={setSelectedChord}
        />
      )}

      <div className={`container mx-auto max-w-6xl px-1.5 sm:px-6 ${fullView ? 'py-1.5' : 'py-3 sm:py-6'}`}>
        {/* Section jump strip */}
        <div className="song-reader-ui mb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none print:hidden">
          <button
            onClick={() => setShowSectionStrip(!showSectionStrip)}
            className="h-11 shrink-0 px-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Sections {showSectionStrip ? '▾' : '▸'}
          </button>
          {showSectionStrip && sectionLabels.map((label, index) => (
            <button
              key={label.name + index}
              onClick={() => jumpToSection(index)}
              title={label.name}
              className={`h-11 shrink-0 px-2 text-[10px] font-bold uppercase tracking-widest ${currentSection === index ? 'bg-accent/25 text-primary' : 'text-muted-foreground'}`}
            >
              <span className="sm:hidden">{label.short}</span>
              <span className="hidden sm:inline">{label.name}</span>
            </button>
          ))}
        </div>

        {fullView && (
          <div className="song-reader-ui mb-2 flex items-center justify-between gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setFullView(false)} className="h-11 rounded-none px-3 text-[10px] font-bold uppercase tracking-widest">
              <Minimize2 className="mr-1.5 h-4 w-4" /> Exit performance
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChordPanelOpen(!chordPanelOpen)} className="h-11 rounded-none px-3 text-[10px] font-bold uppercase tracking-widest">
              <ListMusic className="mr-1.5 h-4 w-4" /> Chords
            </Button>
          </div>
        )}

        {/* Chord sheet */}
        <div
          className={`song-reader-content border border-border bg-card px-2.5 py-3 shadow-sm sm:px-8 ${settings.split ? 'columns-1 gap-6 min-[560px]:columns-2 sm:gap-10' : ''}`}
          onClick={onSheetClick}
        >
          {!fullView && (
            <div className="mb-3 break-inside-avoid border-b border-border pb-3">
              <h2 className="mb-1 font-serif text-2xl font-bold text-primary sm:text-4xl">{song.title}</h2>
              <p className="text-xs font-medium uppercase tracking-widest text-accent">{song.artist}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Key: <span className="text-primary">{currentKey}</span></span>
                {song.defaultKey && song.defaultKey !== currentKey && <span>Original: <span className="text-primary">{song.defaultKey}</span></span>}
                {song.bpm && <span>BPM: <span className="text-primary">{song.bpm}</span></span>}
                {song.timeSignature && <span>Time: <span className="text-primary">{song.timeSignature}</span></span>}
              </div>
            </div>
          )}
          <h2 className="hidden font-serif text-2xl text-black print:block">{song.title}</h2>

          <div
            className="space-y-3 sm:space-y-4"
            style={{ fontSize: `${settings.fontSize}px`, fontFamily: TYPEFACE_STACKS[settings.typeface] }}
          >
            {sections.map((section, sIdx) => (
              <div key={sIdx} id={`section-${sIdx}`} className="break-inside-avoid-column space-y-1 p-1">
                {section.header && (
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="inline-block rounded-sm bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                      {section.header.label}{section.header.note ? ` (${section.header.note})` : ''}
                    </span>
                    {section.header.repeat && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{section.header.repeat}</span>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {section.lines.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className="whitespace-pre-wrap leading-tight"
                      dangerouslySetInnerHTML={{ __html: processLine(line) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 break-inside-avoid border-t border-border pt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
            <p>© {song.copyrightYear || new Date().getFullYear()} {song.copyrightOwner || 'CBCP Tagalog Worship Team'}</p>
            {song.ccliNumber && <p>CCLI: {song.ccliNumber}</p>}
          </div>
        </div>
      </div>

      <PerformanceToolbar
        settings={settings}
        update={update}
        currentKey={currentKey}
        autoScroll={autoScroll}
        scrollPaused={scrollPaused}
        onAutoScroll={setAutoScroll}
        onResumeScroll={resumeScroll}
        onTranspose={handleKeyChange}
        onOpenMore={() => setMoreOpen(true)}
        dimmed={fullView && controlsMinimized && !moreOpen}
      />

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        settings={settings}
        update={update}
        reset={reset}
        currentKey={currentKey}
        keys={KEYS}
        onKeyChange={setCurrentKey}
        autoScroll={autoScroll}
        onAutoScroll={setAutoScroll}
        onOpenTuner={() => { setMoreOpen(false); setTunerOpen(true); }}
        extra={(
          <>
            <section className="mb-4 space-y-3 border-b border-border pb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Metronome</h3>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BPM</p>
                  <p className="font-serif text-2xl font-bold text-primary">{bpm}</p>
                </div>
                <Button
                  onClick={() => setMetronomePlaying(!metronomePlaying)}
                  className={`h-12 w-12 rounded-full p-0 ${metronomePlaying ? 'bg-destructive' : 'bg-accent'} text-primary`}
                  aria-label={metronomePlaying ? 'Stop metronome' : 'Start metronome'}
                >
                  {metronomePlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </Button>
              </div>
              <input
                type="range" min={40} max={220} value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
                aria-label="Tempo"
              />
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="range" min={0} max={1} step={0.05} value={metronomeVolume}
                  onChange={(event) => setMetronomeVolume(Number(event.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
                  aria-label="Metronome volume"
                />
                <Button variant="ghost" size="sm" onClick={() => setBpm(song.bpm || 72)} className="h-11 px-2 text-[10px] font-bold uppercase tracking-widest">
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reset
                </Button>
              </div>
            </section>
            <section className="mb-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setMoreOpen(false); setFullView(!fullView); }} className="h-11 flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest">
                {fullView ? <><Minimize2 className="mr-1.5 h-4 w-4" /> Exit performance</> : <><Maximize2 className="mr-1.5 h-4 w-4" /> Performance mode</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="h-11 rounded-none px-3 text-[10px] font-bold uppercase tracking-widest">
                <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
              </Button>
            </section>
          </>
        )}
      />

      {selectedChord !== null && (
        <ChordCardDialog
          chord={selectedChord}
          settings={settings}
          update={update}
          useFlats={useFlats}
          onClose={() => setSelectedChord(null)}
        />
      )}

      {tunerOpen && (
        <Suspense fallback={null}>
          <TunerDialog
            open={tunerOpen}
            onClose={() => setTunerOpen(false)}
            calibration={settings.tunerCalibration}
            onCalibrationChange={(hz) => update({ tunerCalibration: hz })}
          />
        </Suspense>
      )}
    </div>
  );
}
