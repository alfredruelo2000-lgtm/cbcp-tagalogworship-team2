import { useCallback, useEffect, useState } from 'react';

export type ViewerInstrument = 'guitar' | 'ukulele' | 'piano';
export type ChordTypeface = 'mono' | 'courier' | 'system' | 'sans';

export interface ViewerSettings {
  showChords: boolean;
  showLyrics: boolean;
  simplify: boolean;
  useFlats: boolean;
  highlight: boolean;
  numberNotation: boolean;
  chordColor: string;
  fontSize: number;
  typeface: ChordTypeface;
  instrument: ViewerInstrument;
  leftHanded: boolean;
  dark: boolean;
  split: boolean;
  scrollSpeed: number;
  keepAwake: boolean;
}

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  showChords: true,
  showLyrics: true,
  simplify: false,
  useFlats: false,
  highlight: false,
  numberNotation: false,
  chordColor: 'text-red-600',
  fontSize: 12, // 75% of the 16px base — the ministry default
  typeface: 'mono',
  instrument: 'guitar',
  leftHanded: false,
  dark: false,
  split: false,
  scrollSpeed: 3,
  keepAwake: false,
};

const STORAGE_KEY = 'song-viewer-settings';

/** Legacy per-device keys written by the previous viewer, so nobody loses their setup. */
function readLegacy(): Partial<ViewerSettings> {
  const out: Partial<ViewerSettings> = {};
  const bool = (key: string) => {
    const raw = localStorage.getItem(`song-pref-${key}`);
    return raw === null ? undefined : raw === 'true';
  };
  const showChords = bool('showChords');
  if (showChords !== undefined) out.showChords = showChords;
  const showLyrics = bool('showLyrics');
  if (showLyrics !== undefined) out.showLyrics = showLyrics;
  const split = bool('isSplit');
  if (split !== undefined) out.split = split;
  const color = localStorage.getItem('song-pref-chordColor');
  if (color) out.chordColor = color;
  const font = Number(localStorage.getItem('song-pref-fontSize'));
  if (Number.isFinite(font) && font > 0) out.fontSize = font;
  const speed = Number(localStorage.getItem('song-pref-scrollSpeed'));
  if (Number.isFinite(speed) && speed > 0) out.scrollSpeed = speed;
  return out;
}

/** Device-wide chord-sheet preferences, persisted locally and available offline. */
export function useViewerSettings() {
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);

  // Read after hydration so server and client markup match.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Partial<ViewerSettings>) : readLegacy();
      setSettings({ ...DEFAULT_VIEWER_SETTINGS, ...parsed });
    } catch {
      /* keep defaults */
    }
  }, []);

  const update = useCallback((patch: Partial<ViewerSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage blocked — session-only */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULT_VIEWER_SETTINGS);
  }, []);

  return { settings, update, reset };
}

export const TYPEFACE_STACKS: Record<ChordTypeface, string> = {
  mono: "'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  courier: "'Courier New', Courier, monospace",
  system: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
};

export const TYPEFACE_LABELS: Record<ChordTypeface, string> = {
  mono: 'Roboto Mono',
  courier: 'Courier New',
  system: 'System Mono',
  sans: 'Inter Sans',
};
