/**
 * One chord brain for the whole viewer: parsing, spelling (sharps/flats),
 * simplification, transposition-safe re-rendering, diagrams and playback all
 * read from this module so they can never disagree.
 */

export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const ENHARMONIC: Record<string, number> = {
  C: 0, 'B#': 0, 'Dbb': 0,
  'C#': 1, Db: 1,
  D: 2, 'C##': 2, Ebb: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4, 'D##': 4,
  F: 5, 'E#': 5, Gbb: 5,
  'F#': 6, Gb: 6,
  G: 7, 'F##': 7, Abb: 7,
  'G#': 8, Ab: 8,
  A: 9, 'G##': 9, Bbb: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11, 'A##': 11,
};

/** Keys conventionally written with flats. */
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

export function normalizeAccidentals(text: string): string {
  return text.replace(/♯/g, '#').replace(/♭/g, 'b');
}

export function noteToPc(note: string): number | null {
  const value = ENHARMONIC[normalizeAccidentals(note.trim())];
  return value === undefined ? null : value;
}

export function pcToNote(pc: number, useFlats: boolean): string {
  const index = ((pc % 12) + 12) % 12;
  return (useFlats ? FLAT_NAMES : SHARP_NAMES)[index]!;
}

/** True when the key signature is normally written with flats. */
export function keyPrefersFlats(key: string | undefined | null): boolean {
  if (!key) return false;
  return FLAT_KEYS.has(normalizeAccidentals(key).replace(/\s+/g, ''));
}

export interface ParsedChord {
  /** Original text as written in the chart. */
  input: string;
  rootPc: number;
  /** Suffix after the root, e.g. "m7", "maj7", "sus4", "add9". */
  suffix: string;
  bassPc: number | null;
  /** Semitone offsets from the root, lowest first. */
  intervals: number[];
  quality: 'major' | 'minor' | 'dim' | 'aug' | 'sus' | 'power';
}

const ROOT_RE = /^([A-G](?:#{1,2}|b{1,2})?)(.*)$/;

function intervalsFor(suffix: string): { intervals: number[]; quality: ParsedChord['quality'] } {
  const s = suffix.replace(/\s+/g, '');
  const lower = s.toLowerCase();
  const has = (re: RegExp) => re.test(s);

  const isMinor = /^(m(?!aj)|min|-)/.test(s);
  const isDim = /^(dim|°|o7|ø)/i.test(s) || /^m7b5/i.test(s) || /^ø/.test(s);
  const isHalfDim = /^(m7b5|ø)/i.test(s);
  const isAug = /^(aug|\+)/.test(s) && !/^\+?add/.test(s);
  const isSus2 = /sus2/i.test(s);
  const isSus4 = /sus4/i.test(s) || (/sus(?!\d)/i.test(s) && !isSus2);
  const isPower = /^5$/.test(s);
  const maj7 = /(maj7|maj9|maj11|maj13|M7|Δ)/.test(s);

  let intervals: number[];
  let quality: ParsedChord['quality'] = 'major';

  if (isPower) {
    return { intervals: [0, 7], quality: 'power' };
  }
  if (isHalfDim) {
    return { intervals: [0, 3, 6, 10], quality: 'dim' };
  }
  if (isDim) {
    quality = 'dim';
    intervals = /7/.test(s) ? [0, 3, 6, 9] : [0, 3, 6];
    return { intervals, quality };
  }
  if (isAug) {
    quality = 'aug';
    intervals = [0, 4, 8];
    if (/7/.test(s)) intervals.push(10);
    return { intervals, quality };
  }
  if (isSus2) {
    quality = 'sus';
    intervals = [0, 2, 7];
  } else if (isSus4) {
    quality = 'sus';
    intervals = [0, 5, 7];
  } else if (isMinor) {
    quality = 'minor';
    intervals = [0, 3, 7];
  } else {
    quality = 'major';
    intervals = [0, 4, 7];
  }

  // Sevenths / extensions
  if (maj7) intervals.push(11);
  else if (/(^|[^a-z])(7|9|11|13)/.test(lower.replace(/add\d+/g, '').replace(/sus\d?/g, '').replace(/6/g, ''))) {
    intervals.push(quality === 'minor' ? 10 : 10);
  }
  if (/6(?!\/?\d?9)/.test(s) && !/13/.test(s)) intervals.push(9);
  if (/6\/9|69/.test(s)) intervals.push(9, 14 % 12 === 2 ? 2 : 2);
  if (/(add9|9)/.test(s) && !/add11|add13/.test(s)) intervals.push(2);
  if (/(add11|11)/.test(s)) intervals.push(5);
  if (/13/.test(s)) intervals.push(9);
  if (has(/b5/)) intervals = intervals.map((i) => (i === 7 ? 6 : i));
  if (has(/#5/)) intervals = intervals.map((i) => (i === 7 ? 8 : i));
  if (has(/#11/)) intervals.push(6);
  if (has(/b9/)) intervals.push(1);
  if (has(/#9/)) intervals.push(3);

  const unique = Array.from(new Set(intervals.map((i) => ((i % 12) + 12) % 12))).sort((a, b) => a - b);
  return { intervals: unique, quality };
}

/** Parse a chord symbol. Returns null when the token is not a chord. */
export function parseChord(input: string): ParsedChord | null {
  if (!input) return null;
  const text = normalizeAccidentals(input.trim());
  if (!text) return null;

  let body = text;
  let bassPc: number | null = null;
  const slash = text.match(/^(.*)\/([A-G](?:#{1,2}|b{1,2})?)$/);
  if (slash && slash[1]) {
    body = slash[1];
    bassPc = noteToPc(slash[2]!);
  }

  const match = body.match(ROOT_RE);
  if (!match || !match[1]) return null;
  const rootPc = noteToPc(match[1]);
  if (rootPc === null) return null;

  const suffix = match[2] ?? '';
  const { intervals, quality } = intervalsFor(suffix);
  return { input: text, rootPc, suffix, bassPc, intervals, quality };
}

/** Render a parsed chord back to text, transposed and spelled for the target key. */
export function formatChord(
  chord: ParsedChord,
  options: { semitones?: number; useFlats?: boolean; simplify?: boolean } = {},
): string {
  const semitones = options.semitones ?? 0;
  const useFlats = options.useFlats ?? false;
  const suffix = options.simplify ? simplifySuffix(chord.suffix) : chord.suffix;
  const root = pcToNote(chord.rootPc + semitones, useFlats);
  const bass = chord.bassPc === null ? '' : `/${pcToNote(chord.bassPc + semitones, useFlats)}`;
  return `${root}${suffix}${bass}`;
}

/**
 * View-only simplification: keeps the chord's identity (major / minor / dominant)
 * and drops colour tones that are hard to grab quickly.
 * Cmaj7 → C, Dsus4 → D, Gadd9 → G, F#m7 → F#m, G7 → G7.
 */
export function simplifySuffix(suffix: string): string {
  const s = normalizeAccidentals(suffix);
  if (!s) return '';
  if (/^(m7b5|dim|°|ø)/i.test(s)) return 'dim';
  if (/^(aug|\+)/.test(s)) return 'aug';
  const minor = /^(m(?!aj)|min|-)/.test(s);
  // Plain dominant sevenths stay: they carry the harmonic function.
  const dominant = /(^|[^a-z0-9])7(?!.*maj)/.test(s) && !/maj7|M7|Δ/.test(s) && !/(9|11|13|add|sus|6)/.test(s);
  if (minor) return dominant ? 'm7' : 'm';
  return dominant ? '7' : '';
}

/** Transpose + respell a single chord token. */
export function renderChordToken(
  token: string,
  options: { semitones?: number; useFlats?: boolean; simplify?: boolean },
): string {
  const parsed = parseChord(token);
  if (!parsed) return token;
  return formatChord(parsed, options);
}

/** Absolute MIDI notes for a chord voicing, used by playback and the piano diagram. */
export function chordMidiNotes(chord: ParsedChord, octave = 4): number[] {
  const base = 12 * (octave + 1) + (((chord.rootPc % 12) + 12) % 12);
  const notes = chord.intervals.map((i) => base + i);
  if (chord.bassPc !== null) {
    let bass = 12 * octave + (((chord.bassPc % 12) + 12) % 12);
    while (bass >= base) bass -= 12;
    notes.unshift(bass);
  }
  return notes;
}

/** Unique chords used in a chart, in first-appearance order. */
export function extractChords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text || '')) !== null) {
    const token = (match[1] ?? '').trim();
    if (!token || !parseChord(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

/** Note names of a chord's tones (root first), spelled for the current view. */
export function chordNoteNames(chord: ParsedChord, useFlats = false): string[] {
  const names = chord.intervals.map((i) => pcToNote(chord.rootPc + i, useFlats));
  if (chord.bassPc !== null) {
    const bass = pcToNote(chord.bassPc, useFlats);
    return [bass, ...names.filter((n) => n !== bass)];
  }
  return names;
}

export type Inversion = 0 | 1 | 2;

/**
 * Piano voicing. Inversions rotate the lowest chord tones up an octave; a
 * slash chord always keeps its written bass note underneath.
 */
export function chordPianoVoicing(chord: ParsedChord, inversion: Inversion = 0, octave = 4): number[] {
  const base = 12 * (octave + 1) + (((chord.rootPc % 12) + 12) % 12);
  let notes = chord.intervals.map((i) => base + i);
  const rotations = Math.min(inversion, Math.max(0, notes.length - 1));
  for (let r = 0; r < rotations; r++) {
    const lowest = notes.shift()!;
    notes.push(lowest + 12);
  }
  notes = notes.sort((a, b) => a - b);
  if (chord.bassPc !== null) {
    let bass = 12 * octave + (((chord.bassPc % 12) + 12) % 12);
    while (bass >= notes[0]!) bass -= 12;
    notes.unshift(bass);
  }
  return notes;
}
