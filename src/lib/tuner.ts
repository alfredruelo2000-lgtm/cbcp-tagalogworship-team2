/**
 * Local pitch detection for the viewer tuner. Everything runs in the browser
 * (MPM/YIN-style autocorrelation over a mic buffer) — no network, no service.
 */

export interface TunerPreset {
  id: string;
  label: string;
  /** Target strings, lowest first, as scientific note names. */
  strings: string[];
}

export const TUNER_PRESETS: TunerPreset[] = [
  { id: 'chromatic', label: 'Chromatic', strings: [] },
  { id: 'guitar', label: 'Guitar — Standard', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'guitar-drop-d', label: 'Guitar — Drop D', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  { id: 'guitar-half', label: 'Guitar — Half Step Down', strings: ['D#2', 'G#2', 'C#3', 'F#3', 'A#3', 'D#4'] },
  { id: 'guitar-full', label: 'Guitar — Full Step Down', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
  { id: 'guitar-dadgad', label: 'Guitar — DADGAD', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
  { id: 'bass4', label: 'Bass — 4 String', strings: ['E1', 'A1', 'D2', 'G2'] },
  { id: 'bass5', label: 'Bass — 5 String', strings: ['B0', 'E1', 'A1', 'D2', 'G2'] },
  { id: 'ukulele', label: 'Ukulele — Standard', strings: ['G4', 'C4', 'E4', 'A4'] },
  { id: 'ukulele-low-g', label: 'Ukulele — Low G', strings: ['G3', 'C4', 'E4', 'A4'] },
];

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteNameToMidi(name: string): number {
  const match = name.match(/^([A-G](?:#|b)?)(-?\d)$/);
  if (!match) return 69;
  const flatToSharp: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const pitch = flatToSharp[match[1]!] ?? match[1]!;
  const pc = NAMES.indexOf(pitch);
  return 12 * (Number(match[2]) + 1) + (pc < 0 ? 9 : pc);
}

export function midiToName(midi: number): string {
  const rounded = Math.round(midi);
  return `${NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

export function hzToMidi(hz: number, calibration = 440): number {
  return 69 + 12 * Math.log2(hz / calibration);
}

export function midiToHz(midi: number, calibration = 440): number {
  return calibration * Math.pow(2, (midi - 69) / 12);
}

/**
 * McLeod Pitch Method: normalised square difference with parabolic refinement.
 * Returns null below the confidence threshold so the readout never jitters.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): { hz: number; clarity: number } | null {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i]! * buffer[i]!;
  rms = Math.sqrt(rms / size);
  if (rms < 0.008) return null; // noise gate

  const maxLag = Math.floor(sampleRate / 60); // down to ~60 Hz (low B on a 5-string is handled by octave check)
  const minLag = Math.floor(sampleRate / 1400);
  const nsdf = new Float32Array(maxLag);
  for (let lag = minLag; lag < maxLag; lag++) {
    let corr = 0;
    let energy = 0;
    for (let i = 0; i < size - lag; i++) {
      const a = buffer[i]!;
      const b = buffer[i + lag]!;
      corr += a * b;
      energy += a * a + b * b;
    }
    nsdf[lag] = energy > 0 ? (2 * corr) / energy : 0;
  }

  // First significant peak above threshold — avoids octave errors.
  let bestLag = -1;
  let bestValue = 0;
  let searching = false;
  for (let lag = minLag + 1; lag < maxLag - 1; lag++) {
    const value = nsdf[lag]!;
    if (!searching && value > 0.3) searching = true;
    if (!searching) continue;
    if (value > nsdf[lag - 1]! && value >= nsdf[lag + 1]!) {
      if (value > bestValue) {
        bestValue = value;
        bestLag = lag;
      }
      if (bestValue > 0.9) break;
    }
  }
  if (bestLag < 0 || bestValue < 0.55) return null;

  // Parabolic interpolation for sub-sample (sub-cent) accuracy.
  const y1 = nsdf[bestLag - 1]!;
  const y2 = nsdf[bestLag]!;
  const y3 = nsdf[bestLag + 1]!;
  const denominator = 2 * (2 * y2 - y1 - y3);
  const shift = denominator !== 0 ? (y3 - y1) / denominator : 0;
  const hz = sampleRate / (bestLag + shift);
  if (!Number.isFinite(hz) || hz < 55 || hz > 1400) return null;
  return { hz, clarity: bestValue };
}

/** Nearest target from a preset (or the nearest chromatic note). */
export function nearestTarget(midi: number, preset: TunerPreset): { midi: number; name: string } {
  if (!preset.strings.length) {
    const rounded = Math.round(midi);
    return { midi: rounded, name: midiToName(rounded) };
  }
  let best = preset.strings[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const name of preset.strings) {
    const distance = Math.abs(noteNameToMidi(name) - midi);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = name;
    }
  }
  return { midi: noteNameToMidi(best), name: best };
}
