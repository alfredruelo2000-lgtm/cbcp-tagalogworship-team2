import { useMemo, useRef, useState } from 'react';
import { Sparkles, Loader2, Check, X, RefreshCw, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { uploadMediaFile } from '@/lib/media-upload';
import logoAsset from '@/assets/cbcp-logo.png.asset.json';

type Fmt = { id: string; label: string; w: number; h: number };
type Cell = [number, number, number, number];

const FORMATS: Fmt[] = [
  { id: 'square', label: 'Square 1:1', w: 1080, h: 1080 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'banner', label: 'Banner 16:9', w: 1920, h: 1080 },
  { id: 'post', label: 'Portrait 4:5', w: 1080, h: 1350 },
];

/** Export presets — each is a multiplier on the base format size. */
const EXPORTS = [
  { id: 'web', label: 'Web 1x', scale: 1, hint: 'Social feeds' },
  { id: 'hd', label: 'HD 2x', scale: 2, hint: 'Slides / projection' },
  { id: 'uhd', label: '4K UHD', scale: 0, hint: 'Print & large screens' }, // scale computed to hit 3840px max edge
];

const THEMES = [
  { id: 'ivory', label: 'Ivory', bg: '#f7f3ea', ink: '#1c2541', accent: '#b08d57', frame: '#ffffff' },
  { id: 'midnight', label: 'Midnight', bg: '#131a2b', ink: '#f7f3ea', accent: '#c9a227', frame: '#1e2740' },
  { id: 'sepia', label: 'Sepia', bg: '#2b2118', ink: '#f4e9d8', accent: '#d9a05b', frame: '#3a2c20' },
  { id: 'linen', label: 'Linen', bg: '#eae4d8', ink: '#2f2a24', accent: '#8c6f4b', frame: '#fbf8f2' },
  { id: 'sage', label: 'Sage', bg: '#e6ebe4', ink: '#22312a', accent: '#5d7a63', frame: '#ffffff' },
  { id: 'noir', label: 'Noir Gold', bg: '#0d0d0f', ink: '#f6f1e6', accent: '#d4af37', frame: '#17171a' },
];

/** Typography presets for headline / subline styling. */
const FONTS = [
  { id: 'serif', label: 'Editorial', title: `Georgia, 'Times New Roman', serif`, sub: 'Helvetica, Arial, sans-serif' },
  { id: 'sans', label: 'Modern', title: `Helvetica, Arial, sans-serif`, sub: 'Helvetica, Arial, sans-serif' },
  { id: 'mono', label: 'Technical', title: `'Courier New', monospace`, sub: `'Courier New', monospace` },
  { id: 'mixed', label: 'Contrast', title: `Georgia, serif`, sub: `'Courier New', monospace` },
] as const;
type FontId = (typeof FONTS)[number]['id'];

const ALIGNS = [
  { id: 'left', label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right', label: 'Right' },
] as const;
type AlignId = (typeof ALIGNS)[number]['id'];

const WATERMARK_MODES = [
  { id: 'off', label: 'No watermark' },
  { id: 'logo', label: 'Logo' },
  { id: 'text', label: 'Text' },
  { id: 'both', label: 'Logo + Text' },
] as const;
type WatermarkMode = (typeof WATERMARK_MODES)[number]['id'];

const WM_POSITIONS = [
  { id: 'tl', label: 'Top left' },
  { id: 'tr', label: 'Top right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'br', label: 'Bottom right' },
  { id: 'center', label: 'Center' },
] as const;
type WmPosition = (typeof WM_POSITIONS)[number]['id'];

const TEMPLATES = [
  { id: 'mosaic', label: 'Mosaic' },
  { id: 'hero', label: 'Hero Split' },
  { id: 'filmstrip', label: 'Filmstrip' },
  { id: 'magazine', label: 'Magazine' },
  { id: 'framed', label: 'Framed Gallery' },
  { id: 'spotlight', label: 'Spotlight' },
] as const;
type TemplateId = (typeof TEMPLATES)[number]['id'];

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

function gridCells(count: number, cols = 3): Cell[] {
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => [
    (i % cols) / cols,
    Math.floor(i / cols) / rows,
    1 / cols,
    1 / rows,
  ]) as Cell[];
}

/** Balanced mosaic that adapts to photo count. */
function mosaicCells(count: number): Cell[] {
  if (count <= 1) return [[0, 0, 1, 1]];
  if (count === 2) return [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]];
  if (count === 3) return [[0, 0, 1, 0.56], [0, 0.56, 0.5, 0.44], [0.5, 0.56, 0.5, 0.44]];
  if (count === 4) return [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]];
  if (count === 5)
    return [[0, 0, 0.62, 0.6], [0.62, 0, 0.38, 0.3], [0.62, 0.3, 0.38, 0.3], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]];
  return gridCells(count);
}

function heroCells(count: number): Cell[] {
  if (count <= 1) return [[0, 0, 1, 1]];
  const rest = count - 1;
  const stripH = 0.28;
  const strip: Cell[] = Array.from({ length: rest }, (_, i) => [i / rest, 1 - stripH, 1 / rest, stripH]);
  return [[0, 0, 1, 1 - stripH], ...strip];
}

function filmstripCells(count: number): Cell[] {
  if (count <= 1) return [[0, 0, 1, 1]];
  const rows = Math.min(count, 4);
  const perRow = Math.ceil(count / rows);
  return Array.from({ length: count }, (_, i) => [
    (i % perRow) / perRow,
    Math.floor(i / perRow) / rows,
    1 / perRow,
    1 / rows,
  ]) as Cell[];
}

function magazineCells(count: number): Cell[] {
  if (count <= 1) return [[0, 0, 1, 1]];
  if (count === 2) return [[0, 0, 0.58, 1], [0.58, 0, 0.42, 1]];
  if (count === 3) return [[0, 0, 0.58, 1], [0.58, 0, 0.42, 0.5], [0.58, 0.5, 0.42, 0.5]];
  const right = count - 1;
  return [
    [0, 0, 0.58, 1],
    ...(Array.from({ length: right }, (_, i) => [0.58, i / right, 0.42, 1 / right]) as Cell[]),
  ];
}

function spotlightCells(count: number): Cell[] {
  if (count <= 1) return [[0, 0, 1, 1]];
  const side = Math.min(count - 1, 4);
  const cells: Cell[] = [[0.12, 0.06, 0.76, 0.62]];
  for (let i = 0; i < side; i++) cells.push([i / side, 0.7, 1 / side, 0.3]);
  for (let i = side; i < count - 1; i++) cells.push([0, 0.7, 1 / side, 0.3]);
  return cells.slice(0, count);
}

function cellsFor(template: TemplateId, count: number): Cell[] {
  switch (template) {
    case 'hero':
      return heroCells(count);
    case 'filmstrip':
      return filmstripCells(count);
    case 'magazine':
      return magazineCells(count);
    case 'framed':
      return gridCells(count, count <= 4 ? 2 : 3);
    case 'spotlight':
      return spotlightCells(count);
    default:
      return mosaicCells(count);
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  enhance: boolean,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (enhance) ctx.filter = 'contrast(1.07) saturate(1.1) brightness(1.02)';
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  if (enhance) {
    // Light unsharp pass: a blurred copy blended back at low opacity lifts micro-contrast.
    ctx.filter = 'blur(1.2px)';
    ctx.globalAlpha = 0.22;
    ctx.globalCompositeOperation = 'overlay';
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
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
  const [template, setTemplate] = useState<TemplateId>('mosaic');
  const [enhance, setEnhance] = useState(true);
  const [font, setFont] = useState<FontId>('serif');
  const [align, setAlign] = useState<AlignId>('left');
  const [titleScale, setTitleScale] = useState(1);
  const [uppercaseTitle, setUppercaseTitle] = useState(false);
  const [wmMode, setWmMode] = useState<WatermarkMode>('off');
  const [wmText, setWmText] = useState('@cbcptagalogworship');
  const [wmPos, setWmPos] = useState<WmPosition>('br');
  const [wmOpacity, setWmOpacity] = useState(0.55);
  const [wmScale, setWmScale] = useState(1);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [previews, setPreviews] = useState<Array<{ fmt: Fmt; dataUrl: string }>>([]);
  const [approved, setApproved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const chosen = useMemo(
    () => selected.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as CollagePhoto[],
    [selected, photos],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= 12 ? prev : [...prev, id]));

  const compose = async (fmt: Fmt, imgs: HTMLImageElement[], scale = 1, quality = 0.9) => {
    const W = Math.round(fmt.w * scale);
    const H = Math.round(fmt.h * scale);
    const canvas = canvasRef.current ?? document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    const pad = Math.round(Math.min(W, H) * 0.045);
    const gap = Math.round(pad * (template === 'framed' ? 0.85 : 0.5));
    const captionH = Math.round(H * 0.13);
    const gridX = pad;
    const gridY = pad;
    const gridW = W - pad * 2;
    const gridH = H - pad * 2 - captionH;

    cellsFor(template, imgs.length).forEach(([cx, cy, cw, ch], i) => {
      let x = gridX + cx * gridW + (cx > 0 ? gap / 2 : 0);
      let y = gridY + cy * gridH + (cy > 0 ? gap / 2 : 0);
      let w = cw * gridW - (cx > 0 ? gap / 2 : 0) - (cx + cw < 1 ? gap / 2 : 0);
      let h = ch * gridH - (cy > 0 ? gap / 2 : 0) - (cy + ch < 1 ? gap / 2 : 0);
      const img = imgs[i];
      if (!img) return;

      if (template === 'framed') {
        const inset = Math.round(Math.min(w, h) * 0.06);
        ctx.fillStyle = theme.frame;
        ctx.fillRect(x, y, w, h);
        ctx.save();
        ctx.strokeStyle = `${theme.accent}55`;
        ctx.lineWidth = Math.max(1, Math.round(scale));
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.restore();
        x += inset;
        y += inset;
        w -= inset * 2;
        h -= inset * 2;
      }

      drawCover(ctx, img, x, y, w, h, enhance);

      if (template === 'spotlight' && i === 0) {
        ctx.save();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }
    });

    // Caption band — typography follows the selected preset, alignment and scale.
    const fontPreset = FONTS.find((f) => f.id === font) ?? FONTS[0];
    const capY = H - pad - captionH + gap;
    const anchorX = align === 'left' ? gridX : align === 'right' ? gridX + gridW : gridX + gridW / 2;
    const ruleW = Math.round(gridW * 0.18);
    const ruleX = align === 'left' ? gridX : align === 'right' ? gridX + gridW - ruleW : gridX + (gridW - ruleW) / 2;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(ruleX, capY, ruleW, Math.max(2, Math.round(H * 0.003)));
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = theme.ink;
    const titleSize = Math.round(Math.min(W, H) * 0.062 * titleScale);
    ctx.font = `600 ${titleSize}px ${fontPreset.title}`;
    const headline = uppercaseTitle ? title.toUpperCase() : title;
    ctx.fillText(headline.slice(0, 34), anchorX, capY + Math.round(captionH * 0.18));
    ctx.fillStyle = theme.accent;
    const subSize = Math.round(titleSize * 0.38);
    ctx.font = `700 ${subSize}px ${fontPreset.sub}`;
    ctx.fillText(subtitle.toUpperCase().slice(0, 48), anchorX, capY + Math.round(captionH * 0.18) + titleSize * 1.25);
    ctx.textAlign = 'left';

    // Optional branding watermark over the artwork area.
    if (wmMode !== 'off') {
      const showLogo = wmMode === 'logo' || wmMode === 'both';
      const showText = wmMode === 'text' || wmMode === 'both';
      if (showLogo && !logoRef.current) {
        try {
          logoRef.current = await loadImage(logoAsset.url);
        } catch {
          logoRef.current = null;
        }
      }
      const logo = showLogo ? logoRef.current : null;
      const unit = Math.min(W, H);
      const logoW = logo ? Math.round(unit * 0.14 * wmScale) : 0;
      const logoH = logo ? Math.round(logoW * (logo.height / logo.width)) : 0;
      const wmFontSize = Math.round(unit * 0.026 * wmScale);
      ctx.save();
      ctx.globalAlpha = wmOpacity;
      ctx.font = `700 ${wmFontSize}px ${fontPreset.sub}`;
      const blockW = Math.max(logoW, showText ? ctx.measureText(wmText).width : 0);
      const blockH = logoH + (showText ? wmFontSize * (logo ? 1.6 : 1) : 0);
      const margin = Math.round(pad * 1.1);
      const bx =
        wmPos === 'tl' || wmPos === 'bl'
          ? gridX + margin
          : wmPos === 'center'
            ? gridX + (gridW - blockW) / 2
            : gridX + gridW - margin - blockW;
      const by =
        wmPos === 'tl' || wmPos === 'tr'
          ? gridY + margin
          : wmPos === 'center'
            ? gridY + (gridH - blockH) / 2
            : gridY + gridH - margin - blockH;
      if (logo) ctx.drawImage(logo, bx + (blockW - logoW) / 2, by, logoW, logoH);
      if (showText) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = Math.max(2, Math.round(unit * 0.004));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(wmText.slice(0, 40), bx + blockW / 2, by + logoH + (logo ? wmFontSize * 0.4 : 0));
      }
      ctx.restore();
      ctx.textAlign = 'left';
    }

    return canvas.toDataURL('image/jpeg', quality);
  };

  const generate = async () => {
    if (chosen.length === 0) return;
    setBusy(true);
    setApproved(null);
    try {
      const imgs = await Promise.all(chosen.map((p) => loadImage(p.url)));
      imagesRef.current = imgs;
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

  const scaleFor = (fmt: Fmt, presetScale: number) =>
    presetScale > 0 ? presetScale : Math.max(1, 3840 / Math.max(fmt.w, fmt.h));

  const download = async (fmt: Fmt, preset: (typeof EXPORTS)[number]) => {
    const imgs = imagesRef.current;
    if (imgs.length === 0) return;
    const key = `${fmt.id}-${preset.id}`;
    setExporting(key);
    try {
      const scale = scaleFor(fmt, preset.scale);
      const dataUrl = await compose(fmt, imgs, scale, preset.id === 'web' ? 0.9 : 0.95);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${fmt.id}-${preset.id}.jpg`;
      a.click();
      // Restore the on-screen preview resolution for this format.
      const refreshed = await compose(fmt, imgs);
      setPreviews((prev) => prev.map((p) => (p.fmt.id === fmt.id ? { ...p, dataUrl: refreshed } : p)));
      toast.success(`Downloaded ${preset.label} (${Math.round(fmt.w * scale)}×${Math.round(fmt.h * scale)})`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(null);
    }
  };

  const publish = async () => {
    const pick = previews.find((p) => p.fmt.id === approved);
    if (!pick) return;
    setPublishing(true);
    try {
      // Publish the enhanced 2x render so the public banner stays crisp on retina screens.
      const highRes = imagesRef.current.length ? await compose(pick.fmt, imagesRef.current, 2, 0.94) : pick.dataUrl;
      const blob = await (await fetch(highRes)).blob();
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
            Select up to 12 photos, pick a design template and palette, generate previews in 4 formats, export at
            web/HD/4K resolutions, and publish only the layout you approve.
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

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Design template</Label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                    template === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">Palette</Label>
            <div className="flex flex-wrap items-center gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                    theme.id === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
                  }`}
                >
                  <span className="h-3 w-3 border border-black/10" style={{ background: t.bg }} />
                  <span className="h-3 w-3 border border-black/10" style={{ background: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setEnhance((v) => !v)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest ${
                enhance ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" /> Enhance clarity {enhance ? 'on' : 'off'}
            </button>
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
                  <div
                    key={p.fmt.id}
                    className={`space-y-1.5 border p-1.5 ${
                      approved === p.fmt.id ? 'border-accent bg-accent/5' : 'border-accent/10'
                    }`}
                  >
                    <button
                      onClick={() => setApproved(p.fmt.id === approved ? null : p.fmt.id)}
                      className="block w-full text-left"
                    >
                      <img src={p.dataUrl} alt={`${p.fmt.label} collage preview`} className="w-full object-contain" />
                      <span className="mt-1.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {p.fmt.label}
                        {approved === p.fmt.id && <Check className="h-3.5 w-3.5 text-accent" />}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {EXPORTS.map((preset) => {
                        const scale = scaleFor(p.fmt, preset.scale);
                        const key = `${p.fmt.id}-${preset.id}`;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => download(p.fmt, preset)}
                            disabled={exporting !== null}
                            title={`${preset.hint} — ${Math.round(p.fmt.w * scale)}×${Math.round(p.fmt.h * scale)}`}
                            className="flex items-center gap-1 border border-accent/15 px-1.5 py-1 text-[8px] font-bold uppercase tracking-widest text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-40"
                          >
                            {exporting === key ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={publish}
                  disabled={!approved || publishing}
                  className="h-9 rounded-none bg-accent text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90"
                >
                  {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Approve &amp; feature publicly
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
