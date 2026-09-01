import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  CHORD_COLOR_PRESETS,
  TYPEFACE_LABELS,
  chordContrast,
  type ChordTypeface,
  type HighlightStrength,
  type HighlightStyle,
  type PlaybackStyle,
  type PlaybackTone,
  type ViewerInstrument,
  type ViewerSettings,
} from '@/hooks/use-viewer-settings';
import { TONE_LABELS } from '@/lib/chord-audio';
import {
  Gauge, Guitar, Minus, Music2, Plus, RotateCcw, Settings2, Sparkles, Type, AudioLines,
} from 'lucide-react';

interface ToolbarProps {
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  currentKey: string;
  autoScroll: boolean;
  scrollPaused: boolean;
  onAutoScroll: (next: boolean) => void;
  onResumeScroll: () => void;
  onTranspose: (direction: number) => void;
  onOpenMore: () => void;
  dimmed?: boolean;
}

/** Sticky performance toolbar: the six controls used during worship. */
export function PerformanceToolbar({
  settings, update, currentKey, autoScroll, scrollPaused, onAutoScroll, onResumeScroll,
  onTranspose, onOpenMore, dimmed,
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
          label={autoScroll ? (scrollPaused ? 'Resume' : `Scroll ${settings.scrollSpeed}`) : 'Scroll'}
          active={autoScroll && !scrollPaused}
          onClick={() => {
            if (!autoScroll) onAutoScroll(true);
            else if (scrollPaused) onResumeScroll();
            else onAutoScroll(false);
          }}
          icon={<Gauge className="h-4 w-4" />}
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

const HIGHLIGHT_LABELS: Record<HighlightStyle, string> = {
  none: 'None',
  text: 'Text only',
  soft: 'Soft bg',
  badge: 'Badge',
};

interface MoreProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ViewerSettings;
  update: (patch: Partial<ViewerSettings>) => void;
  reset: () => void;
  currentKey: string;
  keys: string[];
  onKeyChange: (key: string) => void;
  autoScroll: boolean;
  onAutoScroll: (next: boolean) => void;
  onOpenTuner: () => void;
  extra?: React.ReactNode;
}

/** Everything that is not needed mid-song lives here, grouped by job. */
export function MoreSheet({
  open, onOpenChange, settings, update, reset, currentKey, keys, onKeyChange,
  autoScroll, onAutoScroll, onOpenTuner, extra,
}: MoreProps) {
  const chordColor = settings.dark ? settings.chordColorDark : settings.chordColorLight;
  const contrast = chordContrast(chordColor, settings.dark);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-lg border-border p-4 sm:max-w-xl sm:mx-auto">
        <SheetHeader className="mb-2 px-0 text-left">
          <SheetTitle className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Viewer settings</SheetTitle>
        </SheetHeader>

        <Block title="Display">
          <Row label="Dark mode"><Switch checked={settings.dark} onCheckedChange={(v) => update({ dark: v })} /></Row>
          <Row label="Split columns"><Switch checked={settings.split} onCheckedChange={(v) => update({ split: v })} /></Row>
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

          <div className="pt-2">
            <p className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Chord colour · {settings.dark ? 'dark mode' : 'light mode'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CHORD_COLOR_PRESETS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => update(settings.dark ? { chordColorDark: color.hex } : { chordColorLight: color.hex })}
                  aria-label={`${color.name} chords`}
                  title={color.name}
                  style={{ backgroundColor: color.hex }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${chordColor.toLowerCase() === color.hex.toLowerCase() ? 'border-primary scale-110' : 'border-border'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="color"
                value={chordColor}
                onChange={(event) => update(settings.dark ? { chordColorDark: event.target.value } : { chordColorLight: event.target.value })}
                className="h-9 w-12 cursor-pointer border border-border bg-background"
                aria-label="Custom chord colour"
              />
              <input
                type="text"
                value={chordColor}
                onChange={(event) => {
                  const value = event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`;
                  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                    update(settings.dark ? { chordColorDark: value } : { chordColorLight: value });
                  }
                }}
                className="h-9 w-28 border border-border bg-background px-2 font-mono text-xs"
                aria-label="Chord colour hex"
              />
            </div>
            {contrast < 3 && (
              <p className="pt-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
                Low contrast on this background — pick a darker or lighter colour.
              </p>
            )}
          </div>

          <div className="pt-2">
            <p className="pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chord highlight</p>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(HIGHLIGHT_LABELS) as HighlightStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => update({ highlightStyle: style, highlight: style !== 'none' && style !== 'text' })}
                  className={`min-h-11 border px-1 text-[10px] font-bold uppercase tracking-widest ${settings.highlightStyle === style ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  {HIGHLIGHT_LABELS[style]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1.5">
              {(['low', 'medium', 'strong'] as HighlightStrength[]).map((level) => (
                <button
                  key={level}
                  onClick={() => update({ highlightStrength: level })}
                  disabled={settings.highlightStyle === 'none' || settings.highlightStyle === 'text'}
                  className={`min-h-11 border text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 ${settings.highlightStrength === level ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={reset} className="mt-2 h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset settings
          </Button>
        </Block>

        <Block title="Chords">
          <Row label="Show chords"><Switch checked={settings.showChords} onCheckedChange={(v) => update({ showChords: v })} /></Row>
          <Row label="Show lyrics"><Switch checked={settings.showLyrics} onCheckedChange={(v) => update({ showLyrics: v })} /></Row>
          <Row label="Simplify chords"><Switch checked={settings.simplify} onCheckedChange={(v) => update({ simplify: v })} /></Row>
          <Row label="Use flats"><Switch checked={settings.useFlats} onCheckedChange={(v) => update({ useFlats: v })} /></Row>
          <Row label="Number notation"><Switch checked={settings.numberNotation} onCheckedChange={(v) => update({ numberNotation: v })} /></Row>
          <Row label="Left-handed diagrams"><Switch checked={settings.leftHanded} onCheckedChange={(v) => update({ leftHanded: v })} /></Row>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
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
          {settings.instrument === 'ukulele' && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {(['standard', 'low-g'] as const).map((tuning) => (
                <button
                  key={tuning}
                  onClick={() => update({ ukuleleTuning: tuning })}
                  className={`min-h-11 border text-[10px] font-bold uppercase tracking-widest ${settings.ukuleleTuning === tuning ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                >
                  {tuning === 'standard' ? 'High G (gCEA)' : 'Low G (GCEA)'}
                </button>
              ))}
            </div>
          )}
          <p className="pt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Tap any chord in the sheet for voicings, fingering and playback.
          </p>
        </Block>

        <Block title="Playback">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(TONE_LABELS) as PlaybackTone[]).map((tone) => (
              <button
                key={tone}
                onClick={() => update({ tone })}
                className={`flex min-h-11 items-center justify-center gap-1.5 border px-1 text-[10px] font-bold uppercase tracking-widest ${settings.tone === tone ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                <AudioLines className="h-3.5 w-3.5" /> {TONE_LABELS[tone]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['strum', 'block', 'arpeggio'] as PlaybackStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => update({ style })}
                className={`min-h-11 border text-[10px] font-bold uppercase tracking-widest ${settings.style === style ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                {style}
              </button>
            ))}
          </div>
          <Row label="Slower playback"><Switch checked={settings.slowPlayback} onCheckedChange={(v) => update({ slowPlayback: v })} /></Row>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume</span>
            <input
              type="range" min={0} max={1} step={0.05} value={settings.volume}
              onChange={(event) => update({ volume: Number(event.target.value) })}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-accent"
              aria-label="Chord playback volume"
            />
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

        <Block title="Performance">
          <Row label="Auto-scroll"><Switch checked={autoScroll} onCheckedChange={onAutoScroll} /></Row>
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
          <p className="pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            After manual scroll
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {([0, 3, 5] as const).map((seconds) => (
              <button
                key={seconds}
                onClick={() => update({ autoResume: seconds })}
                className={`min-h-11 border text-[10px] font-bold uppercase tracking-widest ${settings.autoResume === seconds ? 'border-accent bg-accent/20 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                {seconds === 0 ? 'Stay paused' : `Resume ${seconds}s`}
              </button>
            ))}
          </div>
          <Row label="Continue auto-scroll between songs">
            <Switch checked={settings.continueScrollBetweenSongs} onCheckedChange={(v) => update({ continueScrollBetweenSongs: v })} />
          </Row>
          <Row label="Keep screen awake"><Switch checked={settings.keepAwake} onCheckedChange={(v) => update({ keepAwake: v })} /></Row>
        </Block>

        <Block title="Tools">
          <Button variant="outline" size="sm" onClick={onOpenTuner} className="h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest">
            <AudioLines className="mr-1.5 h-4 w-4" /> Tuner
          </Button>
          {extra}
        </Block>
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
