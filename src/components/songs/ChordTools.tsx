import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChordDiagram, type DiagramInstrument } from '@/components/songs/ChordDiagram';
import { playChord } from '@/lib/chord-audio';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';

interface CardProps {
  chords: string[];
  index: number;
  instrument: DiagramInstrument;
  leftHanded: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Tap-a-chord card: name, diagram, previous/next and a reference tone. */
export function ChordCardDialog({ chords, index, instrument, leftHanded, onIndexChange, onClose }: CardProps) {
  const chord = chords[index];
  if (!chord) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[min(92vw,22rem)] rounded-none border-border p-5" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{chord} chord</DialogTitle>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {instrument}
            </p>
            <p className="font-serif text-3xl font-bold text-primary">{chord}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0" aria-label="Close chord">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="my-3 grid place-items-center overflow-x-auto py-2">
          <ChordDiagram chord={chord} instrument={instrument} leftHanded={leftHanded} />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-none px-3"
            disabled={chords.length < 2}
            onClick={() => onIndexChange((index - 1 + chords.length) % chords.length)}
            aria-label="Previous chord"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-11 flex-1 rounded-none bg-primary text-primary-foreground"
            onClick={() => playChord(chord, instrument)}
          >
            <Play className="mr-1.5 h-4 w-4" /> Play
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-none px-3"
            disabled={chords.length < 2}
            onClick={() => onIndexChange((index + 1) % chords.length)}
            aria-label="Next chord"
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
  onSelect: (index: number) => void;
}

/** Every unique chord in the current chart, diagrams generated on the fly. */
export function ChordsPanel({ chords, instrument, leftHanded, onSelect }: PanelProps) {
  if (!chords.length) return null;
  return (
    <section className="border-b border-border bg-card/60 print:hidden" aria-label="Chords used in this song">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-2 py-2 scrollbar-none">
        <span className="shrink-0 pr-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Chords
        </span>
        {chords.map((chord, index) => (
          <button
            key={chord}
            onClick={() => onSelect(index)}
            className="shrink-0 border border-border bg-background px-2 py-1 text-center transition-colors hover:border-accent"
            aria-label={`Show ${chord} chord`}
          >
            <span className="block text-[11px] font-bold text-primary">{chord}</span>
            <ChordDiagram chord={chord} instrument={instrument} leftHanded={leftHanded} size="sm" />
          </button>
        ))}
      </div>
    </section>
  );
}
