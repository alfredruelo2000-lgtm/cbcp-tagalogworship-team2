/**
 * Tiny WebAudio reference-tone engine: no samples, no downloads, works offline.
 */

import { chordMidiNotes, parseChord } from './chords';
import { getFretShape, type Instrument } from './chord-shapes';

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  void ctx.resume();
  return ctx;
}

const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function pluck(audio: AudioContext, midi: number, at: number, instrument: Instrument, gain: number) {
  const osc = audio.createOscillator();
  const partial = audio.createOscillator();
  const env = audio.createGain();
  const tone = audio.createBiquadFilter();

  tone.type = 'lowpass';
  tone.frequency.value = instrument === 'piano' ? 3200 : 2400;

  osc.type = instrument === 'piano' ? 'triangle' : 'sawtooth';
  partial.type = 'sine';
  osc.frequency.value = midiToHz(midi);
  partial.frequency.value = midiToHz(midi + 12);

  const decay = instrument === 'piano' ? 1.8 : 1.4;
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  const partialGain = audio.createGain();
  partialGain.gain.value = gain * 0.22;

  osc.connect(env);
  partial.connect(partialGain);
  partialGain.connect(env);
  env.connect(tone);
  tone.connect(audio.destination);

  osc.start(at);
  partial.start(at);
  osc.stop(at + decay + 0.05);
  partial.stop(at + decay + 0.05);
}

/** Play a clean reference voicing of a chord on the chosen instrument. */
export function playChord(chordText: string, instrument: Instrument): void {
  const audio = context();
  if (!audio) return;
  const parsed = parseChord(chordText);
  if (!parsed) return;

  let notes: number[];
  if (instrument === 'piano') {
    notes = chordMidiNotes(parsed, 4);
  } else {
    const shape = getFretShape(chordText, instrument);
    notes = shape?.midi ?? chordMidiNotes(parsed, instrument === 'ukulele' ? 4 : 3);
  }

  const start = audio.currentTime + 0.03;
  const strum = instrument === 'piano' ? 0.012 : 0.035;
  notes.forEach((midi, index) => {
    pluck(audio, midi, start + index * strum, instrument, 0.16);
  });
}
