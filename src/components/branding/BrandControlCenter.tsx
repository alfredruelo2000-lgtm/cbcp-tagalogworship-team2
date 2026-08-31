import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Download, Image as ImageIcon, Loader2, Monitor, Moon, RotateCcw, Smartphone, Sparkles,
  Sun, Tablet, Trash2, Upload, Wand2, History, Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getSettingByKey, updateSetting } from '@/lib/db-settings.functions';
import { useAuth } from '@/hooks/use-auth';
import {
  BRAND_SLOTS, BRANDING_DRAFT_KEY, BRANDING_KEY, BRANDING_VERSIONS_KEY, DEFAULT_BRANDING,
  brandingQueryKey, mergeBranding, pickLogo,
  type BrandSlot, type BrandVersion, type BrandingConfig,
} from '@/lib/branding';
import {
  BRAND_ACCEPT, backgroundVariant, enhance, fitSquare, loadImage, removeFlatBackground,
  toPngBlob, trimAndCenter, uploadBrandAsset,
} from '@/lib/brand-image';
import { generateBrandConcepts, reviewBrandLogo } from '@/lib/brand-ai.functions';

type SaveState = 'idle' | 'saving' | 'saved' | 'publishing' | 'published' | 'error';

const MOTION_PRESETS = [
  { value: 'none', label: 'No motion' },
  { value: 'gentle-fade', label: 'Gentle Fade' },
  { value: 'soft-reveal', label: 'Soft Reveal' },
  { value: 'subtle-glow', label: 'Subtle Glow' },
  { value: 'mark-to-name', label: 'Mark → Full Name' },
  { value: 'elegant-scale', label: 'Elegant Scale In' },
  { value: 'light-reveal', label: 'Light Reveal' },
] as const;

const AI_STYLES = ['Classic Church', 'Premium', 'Minimal', 'Worship', 'Modern Ministry', 'Elegant', 'Contemporary'];

const PALETTE_FIELDS: Array<{ key: keyof BrandingConfig['palette']; label: string }> = [
  { key: 'navy', label: 'Primary Navy' },
  { key: 'gold', label: 'Gold Accent' },
  { key: 'cream', label: 'Cream / Background' },
  { key: 'text', label: 'Primary Text' },
  { key: 'muted', label: 'Secondary Text' },
];

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={id} className="border border-accent/10 bg-background">
      <AccordionTrigger className="min-h-[56px] px-4 text-left hover:no-underline sm:px-6">
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">{title}</span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">{description}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-6 sm:px-6">{children}</AccordionContent>
    </AccordionItem>
  );
}

export default function BrandControlCenter() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const published = useQuery({ queryKey: ['branding-published'], queryFn: () => getSettingByKey(BRANDING_KEY) });
  const draftStored = useQuery({ queryKey: ['branding-draft'], queryFn: () => getSettingByKey(BRANDING_DRAFT_KEY) });
  const versionsStored = useQuery({ queryKey: ['branding-versions'], queryFn: () => getSettingByKey(BRANDING_VERSIONS_KEY) });

  const publishedConfig = useMemo(() => mergeBranding(published.data?.value), [published.data]);
  const versions: BrandVersion[] = Array.isArray(versionsStored.data?.value) ? (versionsStored.data?.value as unknown as BrandVersion[]) : [];

  const [draft, setDraft] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<SaveState>('idle');
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [surfaceDark, setSurfaceDark] = useState(true);
  const [motionKey, setMotionKey] = useState(0);
  const [review, setReview] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<string[]>([]);
  const [aiForm, setAiForm] = useState({ name: '', tagline: '', style: AI_STYLES[0]!, symbols: '', colors: '' });
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (hydrated || published.isLoading || draftStored.isLoading) return;
    const base = draftStored.data?.value ? mergeBranding(draftStored.data.value) : mergeBranding(published.data?.value);
    setDraft(base);
    setAiForm((f) => ({ ...f, name: f.name || base.name, tagline: f.tagline || base.tagline }));
    setHydrated(true);
  }, [hydrated, published.isLoading, draftStored.isLoading, published.data, draftStored.data]);

  const patch = (partial: Partial<BrandingConfig>) => setDraft((prev) => ({ ...prev, ...partial }));
  const patchLogos = (partial: Partial<Record<BrandSlot, string | undefined>>) =>
    setDraft((prev) => {
      const logos = { ...prev.logos, ...partial };
      for (const [key, value] of Object.entries(partial)) if (!value) delete logos[key as BrandSlot];
      return { ...prev, logos };
    });

  const saveDraftMutation = useMutation({
    mutationFn: (config: BrandingConfig) => updateSetting({ key: BRANDING_DRAFT_KEY, value: config }),
    onMutate: () => setState('saving'),
    onSuccess: () => {
      setState('saved');
      toast.success('Draft saved — public site unchanged');
      void queryClient.invalidateQueries({ queryKey: ['branding-draft'] });
    },
    onError: (error) => { setState('error'); toast.error(`Could not save draft: ${(error as Error).message}`); },
  });

  const publishMutation = useMutation({
    mutationFn: async (config: BrandingConfig) => {
      // Snapshot the live branding first so a publish can always be rolled back.
      const history: BrandVersion[] = [
        { at: new Date().toISOString(), by: user?.email ?? 'admin', label: 'Replaced on publish', config: publishedConfig },
        ...versions,
      ].slice(0, 12);
      await updateSetting({ key: BRANDING_VERSIONS_KEY, value: history });
      const next = { ...config, updatedAt: new Date().toISOString(), updatedBy: user?.email ?? 'admin' };
      await updateSetting({ key: BRANDING_KEY, value: next });
      await updateSetting({ key: BRANDING_DRAFT_KEY, value: next });
      return next;
    },
    onMutate: () => setState('publishing'),
    onSuccess: () => {
      setState('published');
      toast.success('Branding published everywhere');
      void queryClient.invalidateQueries({ queryKey: brandingQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['branding-published'] });
      void queryClient.invalidateQueries({ queryKey: ['branding-versions'] });
    },
    onError: (error) => { setState('error'); toast.error(`Publish failed: ${(error as Error).message}`); },
  });

  const busy = saveDraftMutation.isPending || publishMutation.isPending || busySlot !== null;

  async function withSlot<T>(slot: string, run: () => Promise<T>) {
    if (busySlot) return;
    setBusySlot(slot);
    try { await run(); } catch (error) { toast.error((error as Error).message || 'Something went wrong'); }
    finally { setBusySlot(null); }
  }

  async function handleFile(slot: BrandSlot, file: File) {
    await withSlot(slot, async () => {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const url = await uploadBrandAsset(file, slot, ext);
      // Keep an untouched backup of the first upload so originals can always be restored.
      patchLogos(draft.logos.original ? { [slot]: url } : { [slot]: url, original: url });
      toast.success('Uploaded to draft — publish to go live');
    });
  }

  async function derive(slot: BrandSlot, label: string, make: (img: HTMLImageElement) => HTMLCanvasElement | Promise<HTMLCanvasElement>) {
    await withSlot(slot, async () => {
      const source = pickLogo(draft, 'primary');
      const img = await loadImage(source);
      const canvas = await make(img);
      const blob = await toPngBlob(canvas);
      const url = await uploadBrandAsset(blob, slot);
      patchLogos({ [slot]: url });
      toast.success(`${label} created in draft`);
    });
  }

  async function generatePwaAssets() {
    await withSlot('pwa', async () => {
      const img = await loadImage(pickLogo(draft, 'mark'));
      const [i192, i512, fav] = await Promise.all([
        toPngBlob(fitSquare(img, 192, 0.1, draft.palette.navy)),
        toPngBlob(fitSquare(img, 512, 0.1, draft.palette.navy)),
        toPngBlob(trimAndCenter(img, 96)),
      ]);
      const [u192, u512, uFav] = await Promise.all([
        uploadBrandAsset(i192, 'pwa192'), uploadBrandAsset(i512, 'pwa512'), uploadBrandAsset(fav, 'favicon'),
      ]);
      patchLogos({ pwa192: u192, pwa512: u512, favicon: uFav });
      toast.success('PWA icons + favicon prepared in draft');
    });
  }

  const conceptMutation = useMutation({
    mutationFn: () => generateBrandConcepts({
      data: {
        name: aiForm.name || draft.name,
        tagline: aiForm.tagline || undefined,
        style: aiForm.style,
        symbols: aiForm.symbols || undefined,
        colors: aiForm.colors || undefined,
        count: 2,
      },
    }),
    onSuccess: (result) => {
      const urls = (result.concepts ?? [])
        .map((c) => c.url || (c.base64 ? `data:image/png;base64,${c.base64}` : ''))
        .filter(Boolean);
      setConcepts(urls);
      toast.success('Concepts ready — nothing published yet');
    },
    onError: (error) => toast.error((error as Error).message),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const img = await loadImage(pickLogo(draft, 'primary'));
      const canvas = fitSquare(img, 512, 0.04, '#ffffff');
      const base64 = canvas.toDataURL('image/png').split(',')[1] ?? '';
      return reviewBrandLogo({ data: { imageBase64: base64, mimeType: 'image/png', name: draft.name } });
    },
    onSuccess: (result) => setReview(result.review),
    onError: (error) => toast.error((error as Error).message),
  });

  async function useConcept(url: string) {
    await withSlot('concept', async () => {
      const img = await loadImage(url);
      const blob = await toPngBlob(fitSquare(img, 1024, 0.04, '#ffffff'));
      const uploaded = await uploadBrandAsset(blob, 'primary');
      patchLogos({ primary: uploaded });
      toast.success('Concept saved to draft primary logo');
    });
  }

  const previewWidth = device === 'desktop' ? '100%' : device === 'tablet' ? '768px' : '390px';
  const logoForSurface = pickLogo(draft, surfaceDark ? 'light' : 'dark');
  const markForSurface = pickLogo(draft, 'mark');
  const displayed = draft.display.iconOnly ? markForSurface : logoForSurface;
  const motionClass = draft.motion.preset === 'none' ? '' : `brand-motion brand-motion--${draft.motion.preset}`;

  if (!hydrated) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status / actions */}
      <div className="sticky top-0 z-20 -mx-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-accent/10 bg-background/95 px-4 py-3 backdrop-blur sm:flex sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Brand Control Center</p>
          <p className="truncate text-xs text-muted-foreground">
            {state === 'saving' && 'Saving…'}
            {state === 'saved' && 'Draft saved'}
            {state === 'publishing' && 'Publishing…'}
            {state === 'published' && 'Published'}
            {state === 'error' && 'Something failed — try again'}
            {state === 'idle' && (publishedConfig.updatedAt ? `Live since ${new Date(publishedConfig.updatedAt).toLocaleString()}` : 'Using default branding')}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" className="h-11 rounded-none text-[10px] font-bold uppercase tracking-widest"
            disabled={busy} onClick={() => saveDraftMutation.mutate(draft)}>
            {saveDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Draft
          </Button>
          <Button className="h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest"
            disabled={busy} onClick={() => publishMutation.mutate(draft)}>
            {publishMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Publish Branding
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['assets', 'preview']} className="space-y-4">
        {/* 1. BRAND ASSETS */}
        <Section id="assets" title="Brand Assets" description="Upload, replace, download or reset each logo slot. Live logos stay untouched until you publish.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {BRAND_SLOTS.map((slot) => {
              const url = draft.logos[slot.key];
              const isDark = slot.key === 'light' || slot.key === 'pwa192' || slot.key === 'pwa512';
              return (
                <div key={slot.key} className="flex flex-col gap-3 border border-accent/10 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-foreground">{slot.label}</p>
                    <p className="text-xs text-muted-foreground">{slot.hint}</p>
                  </div>
                  <div className={`flex h-28 items-center justify-center border border-dashed border-accent/20 ${isDark ? 'bg-primary' : 'bg-muted/30'}`}>
                    {url ? (
                      <img src={url} alt={slot.label} className="max-h-24 max-w-[80%] object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={(el) => { fileInputs.current[slot.key] = el; }}
                    type="file" accept={BRAND_ACCEPT} className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void handleFile(slot.key, file);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                      onClick={() => fileInputs.current[slot.key]?.click()}>
                      {busySlot === slot.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest">{url ? 'Replace' : 'Upload'}</span>
                    </Button>
                    {url ? (
                      <Button asChild variant="outline" size="sm" className="h-11 rounded-none">
                        <a href={url} download target="_blank" rel="noreferrer" aria-label={`Download ${slot.label}`}><Download className="h-4 w-4" /></a>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                      aria-label={`Reset ${slot.label}`}
                      onClick={() => patchLogos({ [slot.key]: DEFAULT_BRANDING.logos[slot.key] })}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-11 rounded-none text-destructive" disabled={busy}
                      aria-label={`Remove ${slot.label} from draft`}
                      onClick={() => patchLogos({ [slot.key]: undefined })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brand name</Label>
              <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} className="h-11 rounded-none border-accent/10" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tagline</Label>
              <Input value={draft.tagline} onChange={(e) => patch({ tagline: e.target.value })} className="h-11 rounded-none border-accent/10" />
            </div>
          </div>
        </Section>

        {/* 2. LIVE PREVIEW */}
        <Section id="preview" title="Live Preview" description="See the draft logo on every surface, on light and dark backgrounds.">
          <div className="flex flex-wrap items-center gap-2">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([key, Icon]) => (
              <Button key={key} size="sm" variant={device === key ? 'default' : 'outline'}
                className="h-11 rounded-none text-[10px] font-bold uppercase tracking-widest" onClick={() => setDevice(key)}>
                <Icon className="mr-2 h-4 w-4" />{key}
              </Button>
            ))}
            <Button size="sm" variant="outline" className="h-11 rounded-none text-[10px] font-bold uppercase tracking-widest"
              onClick={() => setSurfaceDark((v) => !v)}>
              {surfaceDark ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              {surfaceDark ? 'Dark background' : 'Light background'}
            </Button>
          </div>

          <div className="mx-auto mt-5 space-y-4 overflow-hidden" style={{ maxWidth: previewWidth }}>
            {/* public header */}
            <div className={`flex items-center justify-between gap-4 border border-accent/10 px-4 py-3 ${surfaceDark ? 'bg-primary' : 'bg-muted/20'}`}>
              <div className="flex min-w-0 items-center gap-3" style={{ justifyContent: draft.display.align === 'center' ? 'center' : 'flex-start', padding: draft.display.padding }}>
                <img src={displayed} alt="Header logo preview"
                  style={{ height: draft.display.size, maxWidth: draft.display.maxWidth, objectFit: 'contain' }} />
                {!draft.display.iconOnly && (
                  <span className={`truncate font-serif text-sm ${surfaceDark ? 'text-primary-foreground' : 'text-foreground'}`}>{draft.name}</span>
                )}
              </div>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Public header</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* sidebar */}
              <div className="flex items-center gap-3 border border-accent/10 bg-primary p-4">
                <img src={markForSurface} alt="Sidebar logo preview" className="h-10 w-10 object-contain" />
                <div className="min-w-0"><p className="truncate font-serif text-sm text-accent">{draft.name}</p>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">Dashboard sidebar</p></div>
              </div>
              {/* login */}
              <div className="flex flex-col items-center gap-2 border border-accent/10 bg-muted/20 p-4">
                <img src={pickLogo(draft, 'dark')} alt="Login logo preview" className="h-12 object-contain" />
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Login page</p>
              </div>
              {/* splash */}
              <div className="flex flex-col items-center gap-2 border border-accent/10 bg-primary p-6">
                <img key={motionKey} src={pickLogo(draft, 'splash')} alt="Splash logo preview"
                  className={`h-16 object-contain ${motionClass}`} style={{ animationDuration: `${draft.motion.durationMs}ms` }} />
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Splash screen</p>
              </div>
              {/* icons */}
              <div className="flex items-center justify-around border border-accent/10 bg-muted/20 p-4">
                {[16, 32, 64].map((size) => (
                  <img key={size} src={pickLogo(draft, 'favicon')} alt={`Icon ${size}px`} style={{ width: size, height: size, objectFit: 'contain' }} />
                ))}
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Browser / PWA</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logo height — {draft.display.size}px</Label>
              <Slider value={[draft.display.size]} min={24} max={96} step={2}
                onValueChange={([v]) => patch({ display: { ...draft.display, size: v ?? 48 } })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max width — {draft.display.maxWidth}px</Label>
              <Slider value={[draft.display.maxWidth]} min={80} max={420} step={10}
                onValueChange={([v]) => patch({ display: { ...draft.display, maxWidth: v ?? 220 } })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Padding — {draft.display.padding}px</Label>
              <Slider value={[draft.display.padding]} min={0} max={24} step={1}
                onValueChange={([v]) => patch({ display: { ...draft.display, padding: v ?? 0 } })} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex min-h-[44px] items-center gap-3 text-xs text-muted-foreground">
                <Switch checked={draft.display.align === 'center'}
                  onCheckedChange={(checked) => patch({ display: { ...draft.display, align: checked ? 'center' : 'left' } })} />
                Center alignment
              </label>
              <label className="flex min-h-[44px] items-center gap-3 text-xs text-muted-foreground">
                <Switch checked={draft.display.iconOnly}
                  onCheckedChange={(checked) => patch({ display: { ...draft.display, iconOnly: checked } })} />
                Icon only
              </label>
            </div>
          </div>
        </Section>

        {/* 4. BRAND COLORS */}
        <Section id="palette" title="Brand Palette" description="Reference colors for the ministry. Nothing recolors until you enable and publish.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PALETTE_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3 border border-accent/10 p-3">
                <input type="color" aria-label={field.label} value={String(draft.palette[field.key])}
                  onChange={(e) => patch({ palette: { ...draft.palette, [field.key]: e.target.value } })}
                  className="h-11 w-11 shrink-0 cursor-pointer border border-accent/10 bg-transparent" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{field.label}</p>
                  <Input value={String(draft.palette[field.key])}
                    onChange={(e) => patch({ palette: { ...draft.palette, [field.key]: e.target.value } })}
                    className="mt-1 h-9 rounded-none border-accent/10 font-mono text-xs uppercase" />
                </div>
              </div>
            ))}
          </div>
          <label className="mt-4 flex min-h-[44px] items-center gap-3 text-xs text-muted-foreground">
            <Switch checked={draft.palette.applyToSite}
              onCheckedChange={(checked) => patch({ palette: { ...draft.palette, applyToSite: checked } })} />
            Apply this palette to the site when published
          </label>
        </Section>

        {/* 5 + 6. AI STUDIO & ENHANCEMENT */}
        <Section id="ai" title="AI Brand Studio" description="Review the current logo, generate concepts, and derive variants. Nothing goes live automatically.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Smart enhancement</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                  onClick={() => derive('primary', 'Enhanced logo', (img) => enhance(img, 2, 0.55))}>
                  <Wand2 className="mr-2 h-4 w-4" />Enhance / Sharpen
                </Button>
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                  onClick={() => derive('primary', 'Transparent logo', (img) => removeFlatBackground(img))}>
                  Transparent background
                </Button>
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                  onClick={() => derive('mark', 'Icon version', (img) => trimAndCenter(img, 512))}>
                  Create icon version
                </Button>
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                  onClick={() => derive('light', 'Light logo', (img) => backgroundVariant(img, draft.palette.navy))}>
                  Create dark-background version
                </Button>
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                  onClick={() => derive('dark', 'Dark logo', (img) => backgroundVariant(img, draft.palette.cream))}>
                  Create light-background version
                </Button>
                <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy} onClick={() => void generatePwaAssets()}>
                  Create PWA assets
                </Button>
                {draft.logos.original ? (
                  <Button variant="outline" size="sm" className="h-11 rounded-none" disabled={busy}
                    onClick={() => patchLogos({ primary: draft.logos.original })}>
                    <RotateCcw className="mr-2 h-4 w-4" />Restore original upload
                  </Button>
                ) : null}
              </div>

              <Button variant="outline" className="h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest"
                disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
                {reviewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Analyze current logo
              </Button>
              {review ? (
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap border border-accent/10 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                  {review}
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Generate logo concept</p>
              <Input placeholder="Ministry / brand name" value={aiForm.name}
                onChange={(e) => setAiForm({ ...aiForm, name: e.target.value })} className="h-11 rounded-none border-accent/10" />
              <Input placeholder="Optional tagline" value={aiForm.tagline}
                onChange={(e) => setAiForm({ ...aiForm, tagline: e.target.value })} className="h-11 rounded-none border-accent/10" />
              <div className="flex flex-wrap gap-2">
                {AI_STYLES.map((style) => (
                  <button key={style} type="button" onClick={() => setAiForm({ ...aiForm, style })}
                    className={`min-h-[36px] border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      aiForm.style === style ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'}`}>
                    {style}
                  </button>
                ))}
              </div>
              <Textarea placeholder="Symbols or themes (dove, cross, light, waves…)" value={aiForm.symbols}
                onChange={(e) => setAiForm({ ...aiForm, symbols: e.target.value })} className="min-h-[80px] rounded-none border-accent/10" />
              <Input placeholder="Preferred colors (navy, gold, cream)" value={aiForm.colors}
                onChange={(e) => setAiForm({ ...aiForm, colors: e.target.value })} className="h-11 rounded-none border-accent/10" />
              <Button className="h-11 w-full rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest"
                disabled={conceptMutation.isPending} onClick={() => conceptMutation.mutate()}>
                {conceptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate concepts
              </Button>
              {concepts.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {concepts.map((url, index) => (
                    <div key={url.slice(-24) + index} className="space-y-2 border border-accent/10 p-2">
                      <img src={url} alt={`Concept ${index + 1}`} className="aspect-square w-full object-contain" />
                      <Button variant="outline" size="sm" className="h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest"
                        disabled={busy} onClick={() => void useConcept(url)}>
                        Save to draft
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Section>

        {/* 7. MOTION */}
        <Section id="motion" title="Motion Logo" description="Subtle entrance animation for splash, login and home. Always respects Reduce Motion.">
          <div className="flex flex-wrap gap-2">
            {MOTION_PRESETS.map((preset) => (
              <button key={preset.value} type="button"
                onClick={() => { patch({ motion: { ...draft.motion, preset: preset.value } }); setMotionKey((k) => k + 1); }}
                className={`min-h-[44px] border px-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  draft.motion.preset === preset.value ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'}`}>
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Duration — {draft.motion.durationMs}ms</Label>
              <Slider value={[draft.motion.durationMs]} min={400} max={2600} step={100}
                onValueChange={([v]) => { patch({ motion: { ...draft.motion, durationMs: v ?? 1400 } }); setMotionKey((k) => k + 1); }} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex min-h-[44px] items-center gap-3 text-xs text-muted-foreground">
                <Switch checked={draft.motion.autoplay}
                  onCheckedChange={(checked) => patch({ motion: { ...draft.motion, autoplay: checked } })} />
                Autoplay on entrance
              </label>
              <Button variant="outline" size="sm" className="h-11 rounded-none" onClick={() => setMotionKey((k) => k + 1)}>
                <Play className="mr-2 h-4 w-4" />Preview
              </Button>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              {(['splash', 'splash-login', 'splash-login-home'] as const).map((scope) => (
                <button key={scope} type="button" onClick={() => patch({ motion: { ...draft.motion, scope } })}
                  className={`min-h-[44px] border px-4 text-[10px] font-bold uppercase tracking-widest ${
                    draft.motion.scope === scope ? 'border-accent bg-accent/10 text-accent' : 'border-accent/10 text-muted-foreground'}`}>
                  {scope.replace(/-/g, ' + ')}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 flex h-40 items-center justify-center border border-accent/10 bg-primary">
            <img key={`m-${motionKey}`} src={pickLogo(draft, 'splash')} alt="Motion preview"
              className={`h-20 object-contain ${motionClass}`} style={{ animationDuration: `${draft.motion.durationMs}ms` }} />
          </div>
        </Section>

        {/* 8. VERSIONS */}
        <Section id="versions" title="Asset History" description="Current, draft and previous branding. Restore any earlier version safely.">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 border border-accent/10 p-4">
              <Badge className="rounded-none bg-accent/10 text-accent">Current</Badge>
              <img src={pickLogo(publishedConfig, 'primary')} alt="Published logo" className="h-10 object-contain" />
              <span className="text-xs text-muted-foreground">
                {publishedConfig.updatedAt ? `${new Date(publishedConfig.updatedAt).toLocaleString()} · ${publishedConfig.updatedBy ?? 'admin'}` : 'Default branding'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 border border-accent/10 p-4">
              <Badge variant="outline" className="rounded-none">Draft</Badge>
              <img src={pickLogo(draft, 'primary')} alt="Draft logo" className="h-10 object-contain" />
              <span className="text-xs text-muted-foreground">Not visible publicly until published</span>
            </div>
            {versions.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">No previous versions yet.</p>
            ) : versions.map((version, index) => (
              <div key={`${version.at}-${index}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border border-accent/10 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <img src={pickLogo(mergeBranding(version.config), 'primary')} alt="Previous logo" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-foreground">{new Date(version.at).toLocaleString()}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{version.by ?? 'admin'}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-11 shrink-0 rounded-none text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => { setDraft(mergeBranding(version.config)); toast.success('Loaded into draft — preview, then publish'); }}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </Accordion>
    </div>
  );
}
