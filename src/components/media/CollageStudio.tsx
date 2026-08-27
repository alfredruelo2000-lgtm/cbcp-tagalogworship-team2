import { useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadMediaFile } from '@/lib/media-upload';

type Fmt = { id: string; label: string; w: number; h: number };

const FORMATS: Fmt[] = [
  { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'banner', label: 'Banner 16:9', w: 1920, h: 1080 },
  { id: 'post', label: 'Portrait 4:5', w: 1080, h: 1350 },
];

const THEMES = [
  { id: 'ivory', label: 'Ivory', bg: '#f7f3ea', ink: '#1c2541', accent: '#b08d57' },
  { id: 'midnight', label: 'Midnight', bg: '#131a2b', ink: '#f7f3ea', accent: '#c9a227' },
  { id: 'sepia', label: 'Sepia', bg: '#2b2118', ink: '#f4e9d8', accent: '#d9a05b' },
];

export interface CollagePhoto {
  id: string;
  title: string;
  url: string;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/** Cell grid per photo count — keeps compositions balanced at any format. */
function cellsFor(count: number): Array<[number, number, number, number]> {
  if (count <= 1) return [[0, 0, 1, 1]];
  if (count === 2) return [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]];
  if (count === 3) return [[0, 0, 1, 0.56], [0, 0.56, 0.5, 0.44], [0.5, 0.56, 0.5, 0.44]];
  if (count === 4) return [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]];
  if (count === 5)
    return [[0, 0, 0.62, 0.6], [0.62, 0, 0.38, 0.3], [0.62, 0.3, 0.38, 0.3], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]];
  const cols = 3;
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => [
    (i % cols) / cols,
    Math.floor(i / cols) / rows,
    1 / cols,
    1 / rows,
  ]) as Array<[number, number, number, number]>;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function CollageStudio({
  photos,
  onPublished,
}: {
  photos: CollagePhoto[];
  onPublished: (item: { title: string; file_url: string; thumbnail_url: string; fileSize: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('Worship Highlights');
  const [subtitle, setSubtitle] = useState('CBCP Tagalog Worship Team');
  const [theme, setTheme] = useState(THEMES[0]!);
  const [previews, setPreviews] = useState<Array<{ fmt: Fmt; dataUrl: string }>>([]);
  const [approved, setApproved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const chosen = useMemo(
    () => selected.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as CollagePhoto[],
    [selected, photos],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 9 ? prev : [...prev, id]));

  const compose = async (fmt: Fmt, imgs: HTMLImageElement[]) => {
    const canvas = canvasRef.current ?? document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = fmt.w;
    canvas.height = fmt.h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, fmt.w, fmt.h);

    const pad = Math.round(Math.min(fmt.w, fmt.h) * 0.045);
    const gap = Math.round(pad * 0.5);
    const captionH = Math.round(fmt.h * 0.13);
    const gridX = pad;
    const gridY = pad;
    const gridW = fmt.w - pad * 2;
    const gridH = fmt.h - pad * 2 - captionH;

    cellsFor(imgs.length).forEach(([cx, cy, cw, ch], i) => {
      const x = gridX + cx * gridW + (cx > 0 ? gap / 2 : 0);
      const y = gridY + cy * gridH + (cy > 0 ? gap / 2 : 0);
      const w = cw * gridW - (cx > 0 ? gap / 2 : 0) - (cx + cw < 1 ? gap / 2 : 0);
      const h = ch * gridH - (cy > 0 ? gap / 2 : 0) - (cy + ch < 1 ? gap / 2 : 0);
      const img = imgs[i];
      if (img) drawCover(ctx, img, x, y, w, h);
    });

    // Caption band
    const capY = fmt.h - pad - captionH + gap;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(gridX, capY, Math.round(gridW * 0.18), Math.max(2, Math.round(fmt.h * 0.003)));
    ctx.fillStyle = theme.ink;
    const titleSize = Math.round(Math.min(fmt.w, fmt.h) * 0.062);
    ctx.font = `600 ${titleSize}px Georgia, 'Times New Roman', serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(title.slice(0, 34), gridX, capY + Math.round(captionH * 0.18));
    ctx.fillStyle = theme.accent;
    const subSize = Math.round(titleSize * 0.38);
    ctx.font = `700 ${subSize}px Helvetica, Arial, sans-serif`;
    ctx.fillText(subtitle.toUpperCase().slice(0, 48), gridX, capY + Math.round(captionH * 0.18) + titleSize * 1.25);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const generate = async () => {
    if (chosen.length === 0) return;
    setBusy(true);
    setApproved(null);
    try {
      const imgs = await Promise.all(chosen.map((p) => loadImage(p.url)));
      const out: Array<{ fmt: Fmt; dataUrl: string }> = [];
      for (const fmt of FORMATS) out.push({ fmt, dataUrl: await compose(fmt, imgs) });
      setPreviews(out);
      toast.success('Collage previews ready — approve one to publish');
    } catch (error: any) {
      toast.error(`Could not build collage: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    const pick = previews.find((p) => p.fmt.id === approved);
    if (!pick) return;
    setPublishing(true);
    try {
      const blob = await (await fetch(pick.dataUrl)).blob();
      const file = new File([blob], `${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${pick.fmt.id}.jpg`, {
        type: 'image/jpeg',
      });
      const uploaded = await uploadMediaFile(file);
      onPublished({
        title: `${title} (${pick.fmt.label})`,
        file_url: uploaded.url,
        thumbnail_url: uploaded.url,
        fileSize: uploaded.fileSize,
      });
      setPreviews([]);
      setApproved(null);
      setSelected([]);
    } catch (error: any) {
      toast.error(`Publish failed: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="border border-accent/10 bg-muted/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-6"
      >
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
          <Sparkles className="h-4 w-4" /> AI Collage &amp; Design Assistant
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{open ? 'Close' : 'Open'}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-accent/10 p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">
            Select up to 9 photos, generate collage previews in multiple formats, then publish only the layout you
            approve.
          </p>

          {/* Photo picker */}
          {photos.length === 0 ? (
            <p className="border border-dashed border-accent/10 p-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              Upload photos first to build a collage.
            </p>
          ) : (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-7">
              {photos.map((p) => {
                const idx = selected.indexOf(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`relative aspect-square overflow-hidden border ${
                      idx >= 0 ? 'border-accent' : 'border-accent/10'
                    }`}
                  >
                    <img src={p.url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                    {idx >= 0 && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center bg-accent text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Design controls */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Headline</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 rounded-none border-accent/10 bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Subline</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="h-9 rounded-none border-accent/10 bg-background text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t)}
                className={`border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                  theme.id === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
            <Button
              onClick={generate}
              disabled={chosen.length === 0 || busy}
              className="ml-auto h-9 rounded-none bg-accent text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate previews ({chosen.length})
            </Button>
          </div>

          {/* Previews + approval */}
          {previews.length > 0 && (
            <div className="space-y-3 border-t border-accent/10 pt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {previews.map((p) => (
                  <button
                    key={p.fmt.id}
                    onClick={() => setApproved(p.fmt.id === approved ? null : p.fmt.id)}
                    className={`space-y-1.5 border p-1.5 text-left ${
                      approved === p.fmt.id ? 'border-accent bg-accent/5' : 'border-accent/10'
                    }`}
                  >
                    <img src={p.dataUrl} alt={`${p.fmt.label} collage preview`} className="w-full object-contain" />
                    <span className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {p.fmt.label}
                      {approved === p.fmt.id && <Check className="h-3.5 w-3.5 text-accent" />}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={publish}
                  disabled={!approved || publishing}
                  className="h-9 rounded-none bg-accent text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90"
                >
                  {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Approve &amp; publish
                </Button>
                <Button
                  variant="outline"
                  onClick={generate}
                  disabled={busy}
                  className="h-9 rounded-none border-accent/20 text-[10px] font-bold uppercase tracking-widest"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviews([]);
                    setApproved(null);
                  }}
                  className="h-9 rounded-none text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" /> Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
