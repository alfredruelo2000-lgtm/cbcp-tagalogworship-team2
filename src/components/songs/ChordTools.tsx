import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChordDiagram, type DiagramInstrument } from '@/components/songs/ChordDiagram';
import { getFretShapes, type ShapeTuning } from '@/lib/chord-shapes';
import { chordNoteNames, parseChord } from '@/lib/chords';
import { playChord, stopChord } from '@/lib/chord-audio';
import type { ViewerSettings } from '@/hooks/use-viewer-settings';
import { ChevronLeft, ChevronRight, Play, Square } from 'lucide-react';

const VOICING_KEY = 'song-viewer-voicings';

function readVoicingPrefs(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(VOICING_KEY) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function saveVoicingPref(key: string, index: number) {
  try {
    localStorage.setItem(VOICING_KEY, JSON.stringify({ ...readVoicingPrefs(), [key]: index }));
  } catch {
    /* storage blocked */
  }
}

interface CardProps {
  chord: string;
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  useFlats: boolean;
  onClose: () => void;
}

/** Tap-a-chord card: name, notes, voicing navigation and true chord playback. */
export function ChordCardDialog({ chord, settings, update, useFlats, onClose }: CardProps) {
  const instrument: DiagramInstrument = settings.instrument;
  const tuning: ShapeTuning = settings.ukuleleTuning === 'low-g' ? 'low-g' : 'standard';
  const parsed = useMemo(() => parseChord(chord), [chord]);
  const shapes = useMemo(
    () => (instrument === 'piano' ? [] : getFretShapes(chord, instrument, tuning)),
    [chord, instrument, tuning],
  );

  const prefKey = `${instrument}:${tuning}:${chord}`;
  const [voicing, setVoicing] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Remember the voicing this player prefers for this chord.
  useEffect(() => {
    const stored = readVoicingPrefs()[prefKey];
    setVoicing(typeof stored === 'number' && stored < Math.max(1, shapes.length) ? stored : 0);
  }, [prefKey, shapes.length]);

  useEffect(() => () => stopChord(), []);

  const total = instrument === 'piano' ? 3 : shapes.length;
  const shape = instrument === 'piano' ? null : shapes[voicing] ?? null;
  const inversion = (instrument === 'piano' ? (voicing % 3) as 0 | 1 | 2 : 0);

  const step = (direction: number) => {
    if (total < 2) return;
    const next = (voicing + direction + total) % total;
    setVoicing(next);
    saveVoicingPref(prefKey, next);
    if (instrument === 'piano') update({ pianoInversion: (next % 3) as 0 | 1 | 2 });
  };

  const label = instrument === 'piano'
    ? ['Root position', '1st inversion', '2nd inversion'][inversion]
    : shape?.label ?? 'Unavailable';

  const play = () => {
    setPlaying(true);
    playChord(chord, {
      instrument,
      tone: settings.tone,
      style: settings.style,
      volume: settings.volume,
      slow: settings.slowPlayback,
      ukuleleTuning: tuning,
      inversion,
      ...(shape ? { midi: shape.midi } : {}),
    });
    window.setTimeout(() => setPlaying(false), 2000);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { stopChord(); onClose(); } }}>
      <DialogContent className="max-h-[90dvh] w-[min(94vw,24rem)] overflow-y-auto rounded-none border-border p-5" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{chord} chord</DialogTitle>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {instrument}{instrument === 'ukulele' && tuning === 'low-g' ? ' · low G' : ''}
            </p>
            <p className="font-serif text-3xl font-bold text-primary">{chord}</p>
            {parsed && (
              <p className="pt-0.5 text-[11px] font-bold uppercase tracking-widest text-accent">
                {chordNoteNames(parsed, useFlats).join(' — ')}
              </p>
            )}
          </div>
        </div>

        <div className="my-3 grid place-items-center overflow-x-auto py-2">
          <ChordDiagram
            chord={chord}
            instrument={instrument}
            leftHanded={settings.leftHanded}
            size="lg"
            shape={shape}
            tuning={tuning}
            inversion={inversion}
            useFlats={useFlats}
          />
        </div>

        <p className="pb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}{total > 1 ? ` · ${voicing + 1} of ${total}` : ''}
        </p>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-none px-3"
            disabled={total < 2}
            onClick={() => step(-1)}
            aria-label="Previous voicing"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-11 flex-1 rounded-none bg-primary text-primary-foreground"
            onClick={() => (playing ? (stopChord(), setPlaying(false)) : play())}
          >
            {playing
              ? <><Square className="mr-1.5 h-4 w-4" /> Stop</>
              : <><Play className="mr-1.5 h-4 w-4" /> Play</>}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-none px-3"
            disabled={total < 2}
            onClick={() => step(1)}
            aria-label="Next voicing"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PanelProps {
  chords: string[];
  instrument: DiagramInstrument;
  leftHanded: boolean;
  tuning?: ShapeTuning;
  useFlats?: boolean;
  onSelect: (chord: string) => void;
}

/** Every unique chord in the current chart, diagrams generated on the fly. */
export function ChordsPanel({ chords, instrument, leftHanded, tuning = 'standard', useFlats = false, onSelect }: PanelProps) {
  if (!chords.length) return null;
  return (
    <section className="border-b border-border bg-card/60 print:hidden" aria-label="Chords used in this song">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-2 py-2 scrollbar-none">
        <span className="shrink-0 pr-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Chords
        </span>
        {chords.map((chord) => (
          <button
            key={chord}
            onClick={() => onSelect(chord)}
            className="shrink-0 border border-border bg-background px-2 py-1 text-center transition-colors hover:border-accent"
            aria-label={`Show ${chord} chord`}
          >
            <span className="block text-[11px] font-bold text-primary">{chord}</span>
            <ChordDiagram
              chord={chord}
              instrument={instrument}
              leftHanded={leftHanded}
              tuning={tuning}
              useFlats={useFlats}
              size="sm"
              showFingers={false}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
