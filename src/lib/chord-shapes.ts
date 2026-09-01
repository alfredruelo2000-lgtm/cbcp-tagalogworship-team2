/**
 * Fretboard voicing engine. One search generates *validated* playable shapes for
 * any chord the parser understands, so no per-song diagram data is ever needed.
 *
 * Everything that shows or sounds a chord (diagrams, chord card, playback)
 * reads from this module, so they can never disagree.
 */

import { parseChord, type ParsedChord } from './chords';

export type Instrument = 'guitar' | 'ukulele' | 'piano';
export type FretInstrument = 'guitar' | 'ukulele';
/** Selectable tunings (guitar presets are for the tuner; diagrams use standard). */
export type ShapeTuning = 'standard' | 'low-g';

/** Open-string MIDI notes, lowest string first. */
export const TUNINGS: Record<'guitar' | 'ukulele', number[]> = {
  guitar: [40, 45, 50, 55, 59, 64], // E2 A2 D3 G3 B3 E4
  ukulele: [67, 60, 64, 69], // G4 C4 E4 A4 (re-entrant)
};

/** Ukulele with a low G string. */
export const UKULELE_LOW_G = [55, 60, 64, 69];

export function tuningFor(instrument: FretInstrument, tuning: ShapeTuning = 'standard'): number[] {
  if (instrument === 'ukulele' && tuning === 'low-g') return UKULELE_LOW_G;
  return TUNINGS[instrument];
}

export interface FretShape {
  /** One entry per string, lowest first. null = muted. */
  frets: (number | null)[];
  /** Suggested finger per string: 1 index … 4 pinky, 'T' thumb, null = open/muted. */
  fingers: (number | 'T' | null)[];
  /** Lowest fretted fret, 0 when the shape is open. */
  baseFret: number;
  /** True when a single finger bars the base fret across several strings. */
  barre: boolean;
  /** MIDI notes actually sounding, lowest first. */
  midi: number[];
  /** How hard the shape is to hold (lower is easier). */
  difficulty: number;
  /** Human label: Recommended / Easy / Alternative. */
  label: string;
}

const shapeCache = new Map<string, FretShape[]>();

function pcSet(chord: ParsedChord): Set<number> {
  const set = new Set(chord.intervals.map((i) => (chord.rootPc + i + 1200) % 12));
  if (chord.bassPc !== null) set.add(((chord.bassPc % 12) + 12) % 12);
  return set;
}

/** All validated voicings for a chord, best first (max 5). */
export function getFretShapes(
  chordText: string,
  instrument: FretInstrument,
  tuning: ShapeTuning = 'standard',
): FretShape[] {
  const key = `${instrument}:${tuning}:${chordText}`;
  const hit = shapeCache.get(key);
  if (hit) return hit;
  const shapes = searchShapes(chordText, instrument, tuningFor(instrument, tuning));
  shapeCache.set(key, shapes);
  return shapes;
}

/** Best playable voicing for a chord on a fretted instrument, or null. */
export function getFretShape(
  chordText: string,
  instrument: FretInstrument,
  tuning: ShapeTuning = 'standard',
): FretShape | null {
  return getFretShapes(chordText, instrument, tuning)[0] ?? null;
}

function searchShapes(chordText: string, instrument: FretInstrument, tuning: number[]): FretShape[] {
  const chord = parseChord(chordText);
  if (!chord) return [];
  const tones = pcSet(chord);
  const rootPc = ((chord.rootPc % 12) + 12) % 12;
  const requiredBass = chord.bassPc === null ? rootPc : ((chord.bassPc % 12) + 12) % 12;

  const found: { shape: FretShape; score: number }[] = [];
  const seen = new Set<string>();

  for (let base = 0; base <= 12; base++) {
    // Candidate frets per string: open, or inside the 4-fret window, or muted.
    const options: (number | null)[][] = tuning.map((open) => {
      const list: (number | null)[] = [];
      for (let fret = base === 0 ? 0 : base; fret <= base + 3; fret++) {
        if (fret > 15) break;
        if (tones.has((open + fret) % 12)) list.push(fret);
      }
      if (base > 0 && tones.has(open % 12)) list.push(0);
      list.push(null);
      return list;
    });

    const frets: (number | null)[] = new Array(tuning.length).fill(null);
    const walk = (index: number) => {
      if (index === tuning.length) {
        const evaluated = evaluate(frets, tuning, tones, rootPc, requiredBass, chord, instrument);
        if (evaluated) {
          const signature = evaluated.shape.frets.map((f) => (f === null ? 'x' : f)).join('-');
          if (!seen.has(signature)) {
            seen.add(signature);
            found.push(evaluated);
          }
        }
        return;
      }
      for (const option of options[index]!) {
        frets[index] = option;
        walk(index + 1);
      }
      frets[index] = null;
    };
    walk(0);
  }

  if (!found.length) return [];

  found.sort((a, b) => b.score - a.score);
  const picked: FretShape[] = [];
  for (const entry of found) {
    // Keep voicings musically distinct: one per hand position (base fret band).
    if (picked.some((s) => s.baseFret === entry.shape.baseFret && sameShape(s, entry.shape))) continue;
    if (picked.some((s) => s.baseFret === entry.shape.baseFret)) continue;
    picked.push(entry.shape);
    if (picked.length === 5) break;
  }

  const easiest = picked.reduce((a, b) => (b.difficulty < a.difficulty ? b : a), picked[0]!);
  picked.forEach((shape, index) => {
    shape.label = index === 0 ? 'Recommended' : shape === easiest ? 'Easy' : 'Alternative';
  });
  // Beginners first: if a clearly easier shape exists, offer it right after Recommended.
  if (easiest !== picked[0]) {
    const rest = picked.filter((s) => s !== picked[0] && s !== easiest);
    return [picked[0]!, easiest, ...rest];
  }
  return picked;
}

function sameShape(a: FretShape, b: FretShape) {
  return a.frets.every((f, i) => f === b.frets[i]);
}

/** Assign a realistic left-hand fingering to a validated shape. */
function assignFingers(
  frets: (number | null)[],
  baseFret: number,
  barre: boolean,
): (number | 'T' | null)[] {
  const fingers: (number | 'T' | null)[] = frets.map(() => null);
  const fretted = frets
    .map((fret, index) => ({ fret, index }))
    .filter((entry): entry is { fret: number; index: number } => typeof entry.fret === 'number' && entry.fret > 0)
    .sort((a, b) => a.fret - b.fret || a.index - b.index);

  let next = 1;
  // fret -> { finger, index } of the last note fingered on that fret
  const byFret = new Map<number, { finger: number; index: number }>();
  for (const entry of fretted) {
    if (barre && entry.fret === baseFret) {
      fingers[entry.index] = 1;
      byFret.set(entry.fret, { finger: 1, index: entry.index });
      continue;
    }
    if (barre && next < 2) next = 2;
    const existing = byFret.get(entry.fret);
    // One finger only covers two notes on the same fret when the strings touch
    // (a real partial barre); otherwise the hand needs a separate finger.
    if (existing && existing.finger < 4 && Math.abs(existing.index - entry.index) === 1) {
      fingers[entry.index] = existing.finger;
      continue;
    }
    const finger = Math.min(4, next);
    fingers[entry.index] = finger;
    byFret.set(entry.fret, { finger, index: entry.index });
    next = finger + 1;
  }
  return fingers;
}

function evaluate(
  frets: (number | null)[],
  tuning: number[],
  tones: Set<number>,
  rootPc: number,
  requiredBass: number,
  chord: ParsedChord,
  instrument: FretInstrument,
): { shape: FretShape; score: number } | null {
  const sounding: { index: number; fret: number; midi: number }[] = [];
  frets.forEach((fret, index) => {
    if (fret === null) return;
    sounding.push({ index, fret, midi: tuning[index]! + fret });
  });
  if (sounding.length < 3) return null;

  // Muted strings may only sit below the lowest sounding string (or the very top).
  const first = sounding[0]!.index;
  const last = sounding[sounding.length - 1]!.index;
  for (let i = first; i <= last; i++) if (frets[i] === null) return null;

  const pcs = new Set(sounding.map((s) => s.midi % 12));
  // Validation: every essential chord tone present, and nothing foreign sounding.
  const essential = chord.intervals.slice(0, 4).map((i) => (chord.rootPc + i + 1200) % 12);
  for (const pc of essential) if (!pcs.has(pc)) return null;
  for (const pc of pcs) if (!tones.has(pc)) return null;

  const lowestPc = sounding[0]!.midi % 12;
  // Re-entrant ukulele tuning has no true bass string, so only the guitar
  // enforces the slash-chord / root bass note on the lowest string.
  if (instrument === 'guitar' ? lowestPc !== requiredBass : !pcs.has(requiredBass)) return null;

  const fretted = sounding.filter((s) => s.fret > 0);
  const baseFret = fretted.length ? Math.min(...fretted.map((s) => s.fret)) : 0;
  const maxFret = fretted.length ? Math.max(...fretted.map((s) => s.fret)) : 0;
  if (maxFret - baseFret > 3) return null;

  const atBase = fretted.filter((s) => s.fret === baseFret).length;
  const barre = baseFret > 0 && atBase >= 3;
  const distinctFingers = new Set(fretted.filter((s) => s.fret !== baseFret || !barre).map((s) => s.index)).size;
  if (!barre && fretted.length > 4) return null;
  if (distinctFingers > 4) return null;

  const fingers = assignFingers(frets, baseFret, barre);
  // Reject impossible fingerings: a lower finger number must never sit on a
  // higher fret than a bigger finger on another string.
  const placed = fingers
    .map((finger, index) => ({ finger, fret: frets[index] }))
    .filter((entry): entry is { finger: number; fret: number } => typeof entry.finger === 'number' && typeof entry.fret === 'number' && entry.fret > 0);
  for (const a of placed) {
    for (const b of placed) {
      if (a.finger < b.finger && a.fret > b.fret) return null;
    }
  }

  const fretSum = fretted.reduce((total, s) => total + s.fret, 0);
  const difficulty =
    fretted.length + (maxFret - baseFret) * 1.5 + (barre ? 2 : 0) + baseFret * 0.4 +
    (sounding.length < tuning.length ? 0.5 : 0);

  let score = 0;
  score += sounding.length * 3; // fuller voicings sound better
  score += pcs.size * 3; // include the chord's colour tones
  score -= fretSum; // easy, low shapes win
  score -= maxFret; // stay near the nut
  if (maxFret <= 3) score += 4; // open shapes are the ones players know
  if (rootPc === lowestPc) score += 4;
  if (barre) score += 1;
  // A ukulele is strummed across all four strings, so muted strings are a last resort.
  if (instrument === 'ukulele') score -= (tuning.length - sounding.length) * 5;

  return {
    shape: {
      frets: [...frets],
      fingers,
      baseFret,
      barre,
      midi: sounding.map((s) => s.midi),
      difficulty,
      label: 'Recommended',
    },
    score,
  };
}
