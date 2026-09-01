/**
 * Fretboard voicing engine. One search generates playable shapes for any chord
 * the parser understands, so no per-song diagram data is ever needed.
 */

import { parseChord, type ParsedChord } from './chords';

export type Instrument = 'guitar' | 'ukulele' | 'piano';

/** Open-string MIDI notes, lowest string first. */
export const TUNINGS: Record<'guitar' | 'ukulele', number[]> = {
  guitar: [40, 45, 50, 55, 59, 64], // E2 A2 D3 G3 B3 E4
  ukulele: [67, 60, 64, 69], // G4 C4 E4 A4 (re-entrant)
};

export interface FretShape {
  /** One entry per string, lowest first. null = muted. */
  frets: (number | null)[];
  /** Lowest fretted fret, 0 when the shape is open. */
  baseFret: number;
  /** True when a single finger bars the base fret across several strings. */
  barre: boolean;
  /** MIDI notes actually sounding, lowest first. */
  midi: number[];
}

const cache = new Map<string, FretShape | null>();

function pcSet(chord: ParsedChord): Set<number> {
  const set = new Set(chord.intervals.map((i) => (chord.rootPc + i + 1200) % 12));
  if (chord.bassPc !== null) set.add(((chord.bassPc % 12) + 12) % 12);
  return set;
}

/** Best playable voicing for a chord on a fretted instrument, or null. */
export function getFretShape(chordText: string, instrument: 'guitar' | 'ukulele'): FretShape | null {
  const key = `${instrument}:${chordText}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const shape = searchShape(chordText, instrument);
  cache.set(key, shape);
  return shape;
}

function searchShape(chordText: string, instrument: 'guitar' | 'ukulele'): FretShape | null {
  const chord = parseChord(chordText);
  if (!chord) return null;
  const tuning = TUNINGS[instrument];
  const tones = pcSet(chord);
  const rootPc = ((chord.rootPc % 12) + 12) % 12;
  const requiredBass = chord.bassPc === null ? rootPc : ((chord.bassPc % 12) + 12) % 12;

  let best: { shape: FretShape; score: number } | null = null;

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
        if (evaluated && (!best || evaluated.score > best.score)) {
          best = { shape: evaluated.shape, score: evaluated.score };
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

  return best ? (best as { shape: FretShape }).shape : null;
}

function evaluate(
  frets: (number | null)[],
  tuning: number[],
  tones: Set<number>,
  rootPc: number,
  requiredBass: number,
  chord: ParsedChord,
  instrument: 'guitar' | 'ukulele',
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
  // Every chord tone the parser found (up to the essential four) must be present.
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

  const fretSum = fretted.reduce((total, s) => total + s.fret, 0);
  let score = 0;
  score += sounding.length * 3; // fuller voicings sound better
  score += pcs.size * 3; // include the chord's colour tones
  score -= fretSum; // easy, low shapes win
  score -= baseFret * 2; // stay near the nut
  if (baseFret === 0) score += 4; // open shapes are the ones players know
  if (rootPc === lowestPc) score += 4;
  if (barre) score += 1;

  return {
    shape: { frets: [...frets], baseFret, barre, midi: sounding.map((s) => s.midi) },
    score,
  };
}
