/**
 * Tiny WebAudio chord engine: no samples, no downloads, works offline.
 * It voices chords from the SAME parsed chord object the diagrams use, so what
 * you see is always what you hear.
 */

import { chordPianoVoicing, parseChord } from './chords';
import { getFretShape, type ShapeTuning } from './chord-shapes';
import type { PlaybackStyle, PlaybackTone, ViewerInstrument } from '@/hooks/use-viewer-settings';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let voices: { stop: (at: number) => void }[] = [];

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  void ctx.resume();
  return ctx;
}

const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

interface ToneProfile {
  wave: OscillatorType;
  partial: OscillatorType;
  partialGain: number;
  cutoff: number;
  decay: number;
  attack: number;
}

const TONES: Record<PlaybackTone, ToneProfile> = {
  steel: { wave: 'sawtooth', partial: 'sine', partialGain: 0.3, cutoff: 2600, decay: 1.6, attack: 0.008 },
  nylon: { wave: 'triangle', partial: 'sine', partialGain: 0.2, cutoff: 1800, decay: 1.5, attack: 0.012 },
  electric: { wave: 'square', partial: 'sine', partialGain: 0.16, cutoff: 2200, decay: 1.3, attack: 0.006 },
  ukulele: { wave: 'triangle', partial: 'sawtooth', partialGain: 0.18, cutoff: 3000, decay: 1.0, attack: 0.006 },
  grand: { wave: 'triangle', partial: 'sine', partialGain: 0.28, cutoff: 3400, decay: 2.2, attack: 0.006 },
  soft: { wave: 'sine', partial: 'triangle', partialGain: 0.22, cutoff: 1600, decay: 2.6, attack: 0.03 },
  pad: { wave: 'sine', partial: 'triangle', partialGain: 0.5, cutoff: 1400, decay: 4.5, attack: 0.35 },
};

export const TONE_LABELS: Record<PlaybackTone, string> = {
  steel: 'Acoustic Steel',
  nylon: 'Nylon',
  electric: 'Clean Electric',
  ukulele: 'Natural Ukulele',
  grand: 'Grand Piano',
  soft: 'Soft Piano',
  pad: 'Worship Pad',
};

/** Default tone for the chosen chord instrument. */
export function defaultTone(instrument: ViewerInstrument): PlaybackTone {
  if (instrument === 'ukulele') return 'ukulele';
  if (instrument === 'piano') return 'grand';
  return 'steel';
}

function pluck(audio: AudioContext, midi: number, at: number, profile: ToneProfile, gain: number) {
  const osc = audio.createOscillator();
  const partial = audio.createOscillator();
  const env = audio.createGain();
  const tone = audio.createBiquadFilter();

  tone.type = 'lowpass';
  tone.frequency.value = profile.cutoff;

  osc.type = profile.wave;
  partial.type = profile.partial;
  osc.frequency.value = midiToHz(midi);
  partial.frequency.value = midiToHz(midi + 12);

  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + profile.attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + profile.decay);

  const partialGain = audio.createGain();
  partialGain.gain.value = gain * profile.partialGain;

  osc.connect(env);
  partial.connect(partialGain);
  partialGain.connect(env);
  env.connect(tone);
  tone.connect(master ?? audio.destination);

  osc.start(at);
  partial.start(at);
  const end = at + profile.decay + 0.05;
  osc.stop(end);
  partial.stop(end);

  voices.push({
    stop: (when) => {
      try {
        env.gain.cancelScheduledValues(when);
        env.gain.setTargetAtTime(0.0001, when, 0.03);
        osc.stop(when + 0.15);
        partial.stop(when + 0.15);
      } catch { /* already stopped */ }
    },
  });
}

export interface PlayOptions {
  /** Which instrument's voicing to use. */
  instrument: ViewerInstrument;
  tone?: PlaybackTone;
  style?: PlaybackStyle;
  volume?: number;
  slow?: boolean;
  ukuleleTuning?: ShapeTuning;
  inversion?: 0 | 1 | 2;
  /** Force these MIDI notes (e.g. the exact voicing on screen). */
  midi?: number[];
}

/** Stop anything currently sounding. */
export function stopChord(): void {
  const audio = ctx;
  if (!audio) return;
  const now = audio.currentTime;
  voices.forEach((voice) => voice.stop(now));
  voices = [];
}

/** Play the chord exactly as it is shown on screen. */
export function playChord(chordText: string, options: PlayOptions): void {
  const audio = context();
  if (!audio) return;
  const parsed = parseChord(chordText);
  if (!parsed) return;

  stopChord();

  const instrument = options.instrument;
  let notes = options.midi;
  if (!notes || !notes.length) {
    if (instrument === 'piano') {
      notes = chordPianoVoicing(parsed, options.inversion ?? 0, 4);
    } else {
      const shape = getFretShape(chordText, instrument, options.ukuleleTuning ?? 'standard');
      notes = shape?.midi ?? chordPianoVoicing(parsed, 0, instrument === 'ukulele' ? 4 : 3);
    }
  }

  const tone = TONES[options.tone ?? defaultTone(instrument)]!;
  const style = options.style ?? 'strum';
  if (master) master.gain.value = Math.min(1, Math.max(0, options.volume ?? 0.7));

  const slow = options.slow ? 2 : 1;
  const spacing =
    style === 'block' ? 0 : style === 'arpeggio' ? 0.22 * slow : (instrument === 'piano' ? 0.02 : 0.045) * slow;

  const start = audio.currentTime + 0.04;
  notes.forEach((midi, index) => {
    pluck(audio, midi, start + index * spacing, tone, 0.16);
  });
}
