import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  TYPEFACE_LABELS,
  type ChordTypeface,
  type ViewerInstrument,
  type ViewerSettings,
} from '@/hooks/use-viewer-settings';
import {
  ALargeSmall, Guitar, Minus, Music2, Plus, RotateCcw, Settings2, Sparkles, Type,
} from 'lucide-react';

const CHORD_COLORS = [
  { name: 'Red', class: 'text-red-600', bg: 'bg-red-600' },
  { name: 'Gold', class: 'text-accent', bg: 'bg-accent' },
  { name: 'Navy', class: 'text-primary', bg: 'bg-primary' },
  { name: 'Blue', class: 'text-blue-600', bg: 'bg-blue-600' },
  { name: 'Ink', class: 'text-foreground', bg: 'bg-foreground' },
];

interface ToolbarProps {
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  currentKey: string;
  autoScroll: boolean;
  onAutoScroll: (next: boolean) => void;
  onTranspose: (direction: number) => void;
  onOpenMore: () => void;
  dimmed?: boolean;
}

/** Sticky performance toolbar: the six controls used during worship. */
export function PerformanceToolbar({
  settings, update, currentKey, autoScroll, onAutoScroll, onTranspose, onOpenMore, dimmed,
}: ToolbarProps) {
  return (
    <div
      className={`song-reader-ui fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur transition-opacity duration-500 print:hidden ${dimmed ? 'opacity-40 hover:opacity-100 focus-within:opacity-100' : 'opacity-100'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch justify-between gap-1 overflow-x-auto px-1.5 py-1.5 scrollbar-none">
        <Group label="Font">
          <IconButton label="Decrease text size" onClick={() => update({ fontSize: Math.max(11, settings.fontSize - 1) })}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <IconButton label="Increase text size" onClick={() => update({ fontSize: Math.min(26, settings.fontSize + 1) })}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </Group>

        <ToolButton
          label="Chords"
          active={settings.showChords}
          onClick={() => update({ showChords: !settings.showChords })}
          icon={<Music2 className="h-4 w-4" />}
        />
        <ToolButton
          label="Simplify"
          active={settings.simplify}
          onClick={() => update({ simplify: !settings.simplify })}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <ToolButton
          label={autoScroll ? `Scroll ${settings.scrollSpeed}` : 'Scroll'}
          active={autoScroll}
          onClick={() => onAutoScroll(!autoScroll)}
          icon={<ALargeSmall className="h-4 w-4" />}
        />

        <Group label={`Key ${currentKey}`}>
          <IconButton label="Transpose down" onClick={() => onTranspose(-1)}>
            <Minus className="h-4 w-4" />
          </IconButton>
          <IconButton label="Transpose up" onClick={() => onTranspose(1)}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </Group>

        <ToolButton label="More" active={false} onClick={onOpenMore} icon={<Settings2 className="h-4 w-4" />} />
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center">
      <div className="flex items-center">{children}</div>
      <span className="pointer-events-none -mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-9 place-items-center sm:w-11 rounded-none text-primary transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}

function ToolButton({
  label, active, onClick, icon,
}: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-11 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5 px-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${active ? 'bg-accent/20 text-primary' : 'text-primary hover:bg-muted'}`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

interface MoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  reset: () => void;
  currentKey: string;
  keys: string[];
  onKeyChange: (key: string) => void;
  extra?: React.ReactNode;
}

/** Everything that is not needed mid-song lives here. */
export function MoreSheet({
  open, onOpenChange, settings, update, reset, currentKey, keys, onKeyChange, extra,
}: MoreProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-lg border-border p-4 sm:max-w-xl sm:mx-auto">
        <SheetHeader className="mb-2 px-0 text-left">
          <SheetTitle className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Viewer settings</SheetTitle>
        </SheetHeader>

        <Block title="Appearance">
          <Row label="Dark mode"><Switch checked={settings.dark} onCheckedChange={(v) => update({ dark: v })} /></Row>
          <Row label="Split columns"><Switch checked={settings.split} onCheckedChange={(v) => update({ split: v })} /></Row>
          <Row label="Keep screen awake"><Switch checked={settings.keepAwake} onCheckedChange={(v) => update({ keepAwake: v })} /></Row>
          <Button variant="outline" size="sm" onClick={reset} className="mt-1 h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset settings
          </Button>
        </Block>

        <Block title="Chords">
          <Row label="Show chords"><Switch checked={settings.showChords} onCheckedChange={(v) => update({ showChords: v })} /></Row>
          <Row label="Show lyrics"><Switch checked={settings.showLyrics} onCheckedChange={(v) => update({ showLyrics: v })} /></Row>
          <Row label="Simplify chords"><Switch checked={settings.simplify} onCheckedChange={(v) => update({ simplify: v })} /></Row>
          <Row label="Use flats"><Switch checked={settings.useFlats} onCheckedChange={(v) => update({ useFlats: v })} /></Row>
          <Row label="Highlight chords"><Switch checked={settings.highlight} onCheckedChange={(v) => update({ highlight: v })} /></Row>
          <Row label="Number notation"><Switch checked={settings.numberNotation} onCheckedChange={(v) => update({ numberNotation: v })} /></Row>
          <Row label="Left-handed diagrams"><Switch checked={settings.leftHanded} onCheckedChange={(v) => update({ leftHanded: v })} /></Row>
          <div className="pt-1">
            <p className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chord colour</p>
            <div className="flex gap-2">
              {CHORD_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => update({ chordColor: color.class })}
                  aria-label={`${color.name} chords`}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${color.bg} ${settings.chordColor === color.class ? 'border-primary scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
        </Block>

        <Block title="Chords for…">
          <div className="grid grid-cols-3 gap-1.5">
            {(['guitar', 'ukulele', 'piano'] as ViewerInstrument[]).map((instrument) => (
              <button
                key={instrument}
                onClick={() => update({ instrument })}
                className={`flex min-h-11 items-center justify-center gap-1.5 border text-[10px] font-bold uppercase tracking-widest ${settings.instrument === instrument ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                <Guitar className="h-3.5 w-3.5" /> {instrument}
              </button>
            ))}
          </div>
        </Block>

        <Block title="Typography">
          <div className="flex items-center justify-between">
            <span className="text-sm">Font size</span>
            <div className="flex items-center gap-2">
              <IconButton label="Decrease text size" onClick={() => update({ fontSize: Math.max(11, settings.fontSize - 1) })}><Minus className="h-4 w-4" /></IconButton>
              <span className="w-12 text-center text-sm font-bold">{Math.round((settings.fontSize / 16) * 100)}%</span>
              <IconButton label="Increase text size" onClick={() => update({ fontSize: Math.min(26, settings.fontSize + 1) })}><Plus className="h-4 w-4" /></IconButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {(Object.keys(TYPEFACE_LABELS) as ChordTypeface[]).map((face) => (
              <button
                key={face}
                onClick={() => update({ typeface: face })}
                className={`flex min-h-11 items-center justify-center gap-1.5 border px-2 text-[10px] font-bold uppercase tracking-widest ${settings.typeface === face ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                <Type className="h-3.5 w-3.5" /> {TYPEFACE_LABELS[face]}
              </button>
            ))}
          </div>
        </Block>

        <Block title="Transpose">
          <div className="grid grid-cols-6 gap-1">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => onKeyChange(key)}
                className={`min-h-11 border text-[11px] font-bold ${currentKey.replace('m', '') === key ? 'border-accent bg-accent text-primary' : 'border-border bg-background text-muted-foreground hover:border-accent'}`}
              >
                {key}
              </button>
            ))}
          </div>
        </Block>

        <Block title="Auto-scroll speed">
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => update({ scrollSpeed: speed })}
                className={`min-h-11 border text-sm font-bold ${settings.scrollSpeed === speed ? 'border-accent bg-accent text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                {speed}
              </button>
            ))}
          </div>
        </Block>

        {extra}
      </SheetContent>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 space-y-2 border-b border-border pb-4 last:border-0">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      {children}
    </label>
  );
}
