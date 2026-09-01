import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  TUNER_PRESETS, detectPitch, hzToMidi, midiToHz, midiToName, nearestTarget, noteNameToMidi,
} from '@/lib/tuner';
import { Mic, MicOff } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  calibration: number;
  onCalibrationChange: (hz: number) => void;
}

interface Reading {
  note: string;
  target: string;
  hz: number;
  cents: number;
}

/** Chromatic / guitar / bass / ukulele tuner. Mic starts only on Start Tuner. */
export function TunerDialog({ open, onClose, calibration, onCalibrationChange }: Props) {
  const [presetId, setPresetId] = useState('guitar');
  const [manualString, setManualString] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const smoothed = useRef<number | null>(null);
  const settings = useRef({ presetId, manualString, calibration });
  settings.current = { presetId, manualString, calibration };

  const stop = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    smoothed.current = null;
    setListening(false);
    setReading(null);
  };

  // Never leave the microphone open once the tuner closes or unmounts.
  useEffect(() => {
    if (!open) stop();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      const audio: AudioContext = new Ctor();
      ctxRef.current = audio;
      const source = audio.createMediaStreamSource(stream);
      const analyser = audio.createAnalyser();
      analyser.fftSize = 4096;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      source.connect(filter);
      filter.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      setListening(true);

      const loop = () => {
        frameRef.current = requestAnimationFrame(loop);
        analyser.getFloatTimeDomainData(buffer);
        const detected = detectPitch(buffer, audio.sampleRate);
        if (!detected) return;
        const { presetId: pid, manualString: manual, calibration: cal } = settings.current;
        const midi = hzToMidi(detected.hz, cal);
        // Stable-note averaging: snap fast, settle smoothly.
        smoothed.current = smoothed.current === null || Math.abs(smoothed.current - midi) > 1
          ? midi
          : smoothed.current * 0.75 + midi * 0.25;
        const value = smoothed.current;
        const preset = TUNER_PRESETS.find((p) => p.id === pid) ?? TUNER_PRESETS[0]!;
        const target = manual
          ? { midi: noteNameToMidi(manual), name: manual }
          : nearestTarget(value, preset);
        setReading({
          note: midiToName(value),
          target: target.name,
          hz: midiToHz(value, cal),
          cents: (value - target.midi) * 100,
        });
      };
      loop();
    } catch {
      setError('Microphone permission is required for the tuner.');
    }
  };

  const preset = TUNER_PRESETS.find((p) => p.id === presetId) ?? TUNER_PRESETS[0]!;
  const cents = reading ? Math.max(-50, Math.min(50, reading.cents)) : 0;
  const inTune = reading ? Math.abs(reading.cents) <= 3 : false;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { stop(); onClose(); } }}>
      <DialogContent className="max-h-[92dvh] w-[min(94vw,26rem)] overflow-y-auto rounded-none border-border p-5" aria-describedby={undefined}>
        <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Tuner</DialogTitle>

        <div className="mt-3 border border-border bg-card p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {listening ? (reading ? `Target ${reading.target}` : 'Listening…') : 'Microphone off'}
          </p>
          <p className={`font-serif text-5xl font-bold ${inTune ? 'text-emerald-600' : 'text-primary'}`}>
            {reading ? reading.note : '—'}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {reading ? `${reading.hz.toFixed(1)} Hz · ${reading.cents > 0 ? '+' : ''}${reading.cents.toFixed(1)} cents` : `A4 = ${calibration} Hz`}
          </p>

          {/* −50 … 0 … +50 cent meter */}
          <div className="relative mt-3 h-9 border border-border bg-background">
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-accent" />
            <div
              className={`absolute top-1 h-7 w-1.5 rounded transition-[left] duration-100 ${inTune ? 'bg-emerald-600' : 'bg-red-600'}`}
              style={{ left: `calc(${50 + cents}% - 3px)`, opacity: reading ? 1 : 0.25 }}
            />
          </div>
          <div className="flex justify-between pt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Flat −50</span>
            <span className={inTune ? 'text-emerald-600' : ''}>{inTune ? 'In tune' : reading ? (reading.cents < 0 ? 'Flat' : 'Sharp') : '0'}</span>
            <span>+50 Sharp</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground" htmlFor="tuner-preset">
            Instrument / tuning
          </label>
          <select
            id="tuner-preset"
            value={presetId}
            onChange={(event) => { setPresetId(event.target.value); setManualString(null); }}
            className="h-11 w-full border border-border bg-background px-2 text-sm"
          >
            {TUNER_PRESETS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>

          {preset.strings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setManualString(null)}
                className={`min-h-11 border px-3 text-[10px] font-bold uppercase tracking-widest ${manualString === null ? 'border-accent bg-accent/20 text-primary' : 'border-border text-muted-foreground'}`}
              >
                Auto
              </button>
              {preset.strings.map((name) => (
                <button
                  key={name}
                  onClick={() => setManualString(name)}
                  className={`min-h-11 border px-3 text-[11px] font-bold ${manualString === name ? 'border-accent bg-accent/20 text-primary' : 'border-border text-muted-foreground'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">A4</span>
            <input
              type="range" min={430} max={450} step={1} value={calibration}
              onChange={(event) => onCalibrationChange(Number(event.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
              aria-label="Calibration"
            />
            <span className="w-14 text-right text-sm font-bold text-primary">{calibration} Hz</span>
          </div>
        </div>

        {error && <p className="pt-2 text-xs text-destructive">{error}</p>}

        <Button
          onClick={() => (listening ? stop() : void start())}
          className={`mt-4 h-12 w-full rounded-none ${listening ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'}`}
        >
          {listening ? <><MicOff className="mr-2 h-4 w-4" /> Stop tuner</> : <><Mic className="mr-2 h-4 w-4" /> Start tuner</>}
        </Button>
        <p className="pt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {listening ? 'Microphone active — audio stays on this device' : 'Microphone is requested only when you start'}
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default TunerDialog;
