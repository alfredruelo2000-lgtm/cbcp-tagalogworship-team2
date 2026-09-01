import { useCallback, useEffect, useState } from 'react';

export type ViewerInstrument = 'guitar' | 'ukulele' | 'piano';
export type ChordTypeface = 'mono' | 'courier' | 'system' | 'sans';
export type HighlightStyle = 'none' | 'text' | 'soft' | 'badge';
export type HighlightStrength = 'low' | 'medium' | 'strong';
export type PlaybackTone =
  | 'steel' | 'nylon' | 'electric' | 'ukulele' | 'grand' | 'soft' | 'pad';
export type PlaybackStyle = 'strum' | 'block' | 'arpeggio';

export interface ViewerSettings {
  showChords: boolean;
  showLyrics: boolean;
  simplify: boolean;
  useFlats: boolean;
  /** Legacy switch kept so old saved setups keep working; drives highlightStyle. */
  highlight: boolean;
  highlightStyle: HighlightStyle;
  highlightStrength: HighlightStrength;
  numberNotation: boolean;
  /** Legacy tailwind class (migrated to chordColorLight on first read). */
  chordColor: string;
  chordColorLight: string;
  chordColorDark: string;
  fontSize: number;
  typeface: ChordTypeface;
  instrument: ViewerInstrument;
  leftHanded: boolean;
  ukuleleTuning: 'standard' | 'low-g';
  pianoInversion: 0 | 1 | 2;
  tone: PlaybackTone;
  style: PlaybackStyle;
  volume: number;
  slowPlayback: boolean;
  dark: boolean;
  split: boolean;
  scrollSpeed: number;
  /** Seconds before auto-scroll resumes after a manual scroll. 0 = stay paused. */
  autoResume: 0 | 3 | 5;
  continueScrollBetweenSongs: boolean;
  keepAwake: boolean;
  tunerCalibration: number;
}

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  showChords: true,
  showLyrics: true,
  simplify: false,
  useFlats: false,
  highlight: false,
  highlightStyle: 'text',
  highlightStrength: 'medium',
  numberNotation: false,
  chordColor: 'text-red-600',
  chordColorLight: '#c81e1e',
  chordColorDark: '#fb7185',
  fontSize: 12, // 75% of the 16px base — the ministry default
  typeface: 'mono',
  instrument: 'guitar',
  leftHanded: false,
  ukuleleTuning: 'standard',
  pianoInversion: 0,
  tone: 'steel',
  style: 'strum',
  volume: 0.7,
  slowPlayback: false,
  dark: false,
  split: false,
  scrollSpeed: 3,
  autoResume: 0,
  continueScrollBetweenSongs: false,
  keepAwake: false,
  tunerCalibration: 440,
};

const STORAGE_KEY = 'song-viewer-settings';

/** Legacy tailwind chord colours mapped to their hex equivalent. */
const LEGACY_COLORS: Record<string, string> = {
  'text-red-600': '#c81e1e',
  'text-accent': '#c9a227',
  'text-primary': '#12224a',
  'text-blue-600': '#2563eb',
  'text-foreground': '#111827',
};

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

function migrate(parsed: Partial<ViewerSettings>): Partial<ViewerSettings> {
  const next = { ...parsed };
  if (!next.chordColorLight && next.chordColor && LEGACY_COLORS[next.chordColor]) {
    next.chordColorLight = LEGACY_COLORS[next.chordColor];
  }
  if (next.highlightStyle === undefined && next.highlight !== undefined) {
    next.highlightStyle = next.highlight ? 'soft' : 'text';
  }
  return next;
}

/** Device-wide chord-sheet preferences, persisted locally and available offline. */
export function useViewerSettings() {
  const [settings, setSettings] = useState<ViewerSettings>(DEFAULT_VIEWER_SETTINGS);

  // Read after hydration so server and client markup match.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Partial<ViewerSettings>) : readLegacy();
      setSettings({ ...DEFAULT_VIEWER_SETTINGS, ...migrate(parsed) });
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

export const CHORD_COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Deep Red', hex: '#7f1d1d' },
  { name: 'Gold', hex: '#c9a227' },
  { name: 'Navy', hex: '#12224a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Cyan', hex: '#0891b2' },
  { name: 'Green', hex: '#15803d' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#f8fafc' },
];

/** Relative luminance, used to warn about unreadable chord colours. */
export function colorLuminance(hex: string): number {
  const value = hex.replace('#', '');
  if (value.length !== 6) return 0.5;
  const channel = (part: string) => {
    const c = parseInt(part, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(value.slice(0, 2)) + 0.7152 * channel(value.slice(2, 4)) + 0.0722 * channel(value.slice(4, 6));
}

/** Rough contrast ratio against the reading surface (cream light / ink dark). */
export function chordContrast(hex: string, dark: boolean): number {
  const surface = dark ? 0.02 : 0.92;
  const text = colorLuminance(hex);
  const [light, shade] = text > surface ? [text, surface] : [surface, text];
  return (light + 0.05) / (shade + 0.05);
}

export const HIGHLIGHT_ALPHA: Record<HighlightStrength, number> = {
  low: 0.1,
  medium: 0.18,
  strong: 0.3,
};
