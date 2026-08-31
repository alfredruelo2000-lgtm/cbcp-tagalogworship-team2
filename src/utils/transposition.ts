export const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/** Keys conventionally written with flats. */
const FLAT_PREFERRING = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm']);

/**
 * Transpose one chord symbol. Handles slash/bass chords, double accidentals,
 * unicode accidentals and every extension (maj7, m7b5, sus4, add9, 6/9, °, Δ…),
 * and spells the result with sharps or flats to match the target key.
 */
export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  if (!chord) return chord;
  const trimmed = chord.trim();
  if (!trimmed) return chord;

  // Split on the LAST slash only when what follows is a bass note (C/G, G6/9 keeps 6/9).
  const bassMatch = trimmed.match(/^(.*)\/([A-G](?:#{1,2}|b{1,2}|♯|♭)?)$/);
  if (bassMatch && bassMatch[1]) {
    return `${transposeChord(bassMatch[1], semitones, targetKey)}/${transposeChord(bassMatch[2]!, semitones, targetKey)}`;
  }

  const match = trimmed.match(/^([A-G](?:#{1,2}|b{1,2}|♯|♭)?)(.*)$/);
  if (!match || !match[1]) return chord;

  const index = KEYS.indexOf(normalizeNote(match[1]));
  if (index === -1) return chord;

  let newIndex = (index + (semitones % 12)) % 12;
  if (newIndex < 0) newIndex += 12;

  const useFlats = targetKey ? FLAT_PREFERRING.has(normalizeKeyLabel(targetKey)) : /b|♭/.test(match[1]);
  const table = useFlats ? FLAT_KEYS : KEYS;
  const newNote = table[newIndex];
  if (!newNote) return chord;

  return newNote + (match[2] || '');
}

function normalizeKeyLabel(key: string): string {
  return key.trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/\s+/g, '');
}

function normalizeNote(note: string): string {
  const n = note.replace(/♯/g, '#').replace(/♭/g, 'b');
  const flats: Record<string, string> = { Bb: 'A#', Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Cb: 'B', Fb: 'E' };
  if (flats[n]) return flats[n]!;
  const doubles: Record<string, string> = { 'C##': 'D', 'D##': 'E', 'F##': 'G', 'G##': 'A', 'A##': 'B', Bbb: 'A', Ebb: 'D', Abb: 'G', Dbb: 'C', Gbb: 'F' };
  if (doubles[n]) return doubles[n]!;
  if (n === 'E#') return 'F';
  if (n === 'B#') return 'C';
  return n;
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

