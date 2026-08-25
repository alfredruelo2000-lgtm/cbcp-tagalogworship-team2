export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function transposeChord(chord: string, semitones: number): string {
  if (!chord) return chord;
  
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match || !match[1]) return chord;
  
  const baseNote = match[1];
  const suffix = match[2] || '';
  
  const normalized = normalizeNote(baseNote);
  const index = KEYS.indexOf(normalized);
  
  if (index === -1) return chord;
  
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  const newNote = KEYS[newIndex];
  if (!newNote) return chord;
  
  return newNote + suffix;
}

function normalizeNote(note: string): string {
  switch (note) {
    case 'Bb': return 'A#';
    case 'Db': return 'C#';
    case 'Eb': return 'D#';
    case 'Gb': return 'F#';
    case 'Ab': return 'G#';
    default: return note;
  }
}

export function getSemitoneDifference(fromKey: string, toKey: string): number {
  const from = normalizeNote(fromKey.replace('m', ''));
  const to = normalizeNote(toKey.replace('m', ''));
  
  const fromIdx = KEYS.indexOf(from);
  const toIdx = KEYS.indexOf(to);
  
  if (fromIdx === -1 || toIdx === -1) return 0;
  
  return toIdx - fromIdx;
}

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/**
 * Converts a chord to number (Roman numeral) notation relative to the given key.
 * Degrees are diatonic: in C, F -> IV, Am -> vi, Bb -> bVII, G7 -> V7, G/B -> V/III.
 */
export function chordToNumber(chord: string, key: string): string {
  if (!chord) return chord;

  const [main, bass] = chord.split('/');
  const converted = convertSingle(main ?? '', key);
  if (converted === null) return chord;

  if (bass) {
    const bassDegree = convertSingle(bass, key);
    return `${converted}/${bassDegree ?? bass}`;
  }
  return converted;
}

function convertSingle(chord: string, key: string): string | null {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match || !match[1]) return null;

  const root = normalizeNote(match[1]);
  let suffix = match[2] || '';

  const isMinorKey = /m(in)?$/.test(key.trim());
  const keyRoot = normalizeNote(key.trim().replace(/m(in)?$/, ''));

  const rootIdx = KEYS.indexOf(root);
  const keyIdx = KEYS.indexOf(keyRoot);
  if (rootIdx === -1 || keyIdx === -1) return null;

  const interval = (rootIdx - keyIdx + 12) % 12;
  const scale = isMinorKey ? MINOR_SCALE : MAJOR_SCALE;

  let degree = scale.indexOf(interval);
  let accidental = '';
  if (degree === -1) {
    // Prefer flats (bIII, bVI, bVII) except the tritone, conventionally written #IV/#iv.
    const preferSharp = interval === 6 && !isMinorKey;
    const sharpDegree = scale.indexOf((interval + 11) % 12);
    const flatDegree = scale.indexOf((interval + 1) % 12);
    if (preferSharp && sharpDegree !== -1) {
      degree = sharpDegree;
      accidental = '#';
    } else if (flatDegree !== -1) {
      degree = flatDegree;
      accidental = 'b';
    } else {
      degree = sharpDegree;
      accidental = '#';
    }
  }
  if (degree === -1) return null;

  // Chord quality: case of the numeral carries major/minor, so drop the "m".
  const isMinorChord = /^(m(?!aj)|min|-)/.test(suffix) || /^(dim|°|o\b)/.test(suffix);
  if (isMinorChord) {
    suffix = suffix.replace(/^(m(?!aj)|min|-)/, '');
  }

  const numeral = isMinorChord ? ROMAN[degree]!.toLowerCase() : ROMAN[degree]!;
  return accidental + numeral + suffix;
}

