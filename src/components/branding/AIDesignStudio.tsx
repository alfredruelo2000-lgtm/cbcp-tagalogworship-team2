import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle, Check, Columns2, History, Loader2, Lock, Monitor, Moon, RotateCcw,
  ShieldCheck, Smartphone, Sparkles, Sun, Tablet, Wand2,
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
import DesignPreview, { PREVIEW_SURFACES, type PreviewDevice, type PreviewSurface } from './DesignPreview';
import { publishedDesignQueryKey } from './DesignThemeSync';
import {
  DEFAULT_LOCKS, DESIGN_DRAFTS_KEY, DESIGN_PUBLISHED_KEY, DESIGN_VERSIONS_KEY, FONT_OPTIONS,
  ORIGINAL_DESIGN, accessibilityCheck, applyLocks, diffSummary, mergeConcept, overallScore,
  performanceCheck, responsiveCheck, scoreConcept, themeCss,
  type CheckReport, type DesignConcept, type DesignLayout, type DesignLocks, type DesignPalette, type DesignStatus,
} from '@/lib/design-studio';
import { analyzeDesign, generateDesignConcepts, refineDesignConcept } from '@/lib/design-ai.functions';

interface DesignSnapshot {
  at: string;
  by?: string;
  label: string;
  enabled: boolean;
  concept: DesignConcept;
}

const PALETTE_FIELDS: Array<{ key: keyof DesignPalette; label: string }> = [
  { key: 'background', label: 'Background' },
  { key: 'foreground', label: 'Text' },
  { key: 'card', label: 'Card' },
  { key: 'cardForeground', label: 'Card text' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryForeground', label: 'On primary' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentForeground', label: 'On accent' },
  { key: 'muted', label: 'Muted surface' },
  { key: 'mutedForeground', label: 'Secondary text' },
  { key: 'border', label: 'Borders' },
];

const LAYOUT_FIELDS: Array<{ key: keyof DesignLayout; label: string; options: string[] }> = [
  { key: 'shadow', label: 'Shadow depth', options: ['none', 'soft', 'medium', 'strong'] },
  { key: 'density', label: 'Spacing density', options: ['compact', 'comfortable', 'spacious'] },
  { key: 'nav', label: 'Navigation style', options: ['minimal', 'solid', 'glass', 'bordered'] },
  { key: 'button', label: 'Button style', options: ['square', 'rounded', 'pill', 'outline'] },
  { key: 'card', label: 'Card style', options: ['flat', 'bordered', 'elevated', 'editorial'] },
  { key: 'hero', label: 'Hero treatment', options: ['compact', 'editorial', 'cinematic'] },
  { key: 'image', label: 'Image treatment', options: ['natural', 'soft', 'duotone'] },
  { key: 'motion', label: 'Motion', options: ['none', 'subtle', 'expressive'] },
  { key: 'mobile', label: 'Mobile strategy', options: ['compact', 'balanced', 'airy'] },
];

const LOCK_FIELDS: Array<{ key: keyof DesignLocks; label: string }> = [
  { key: 'logo', label: 'Lock official logo (never AI-replaced)' },
  { key: 'navy', label: 'Lock CBCP navy primary' },
  { key: 'gold', label: 'Lock CBCP gold accent' },
  { key: 'songViewer', label: 'Protect chord viewer readability' },
  { key: 'adminSidebar', label: 'Protect admin sidebar structure' },
  { key: 'chordFont', label: 'Lock monospace chord font' },
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

function CheckList({ title, report }: { title: string; report: CheckReport }) {
  return (
    <div className="border border-accent/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <Badge variant="outline" className={`rounded-none text-[10px] ${report.severe ? 'border-destructive text-destructive' : 'border-accent/30 text-accent'}`}>
          {report.score}/100
        </Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {report.items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-xs">
            <span className={item.status === 'pass' ? 'text-accent' : item.status === 'warn' ? 'text-amber-500' : 'text-destructive'}>
              {item.status === 'pass' ? <Check size={14} /> : <AlertTriangle size={14} />}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{item.label}</span>
              <span className="block text-muted-foreground">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScoreGrid({ concept }: { concept: DesignConcept }) {
  const scores = scoreConcept(concept);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="border border-accent/10 px-3 py-2">
          <p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p>
          <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function AIDesignStudio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const publishedStored = useQuery({ queryKey: ['design-published-admin'], queryFn: () => getSettingByKey(DESIGN_PUBLISHED_KEY) });
  const draftsStored = useQuery({ queryKey: ['design-drafts'], queryFn: () => getSettingByKey(DESIGN_DRAFTS_KEY) });
  const versionsStored = useQuery({ queryKey: ['design-versions'], queryFn: () => getSettingByKey(DESIGN_VERSIONS_KEY) });

  const publishedRaw = publishedStored.data?.value as { enabled?: boolean; concept?: unknown; publishedAt?: string } | null | undefined;
  const liveConcept = publishedRaw?.enabled && publishedRaw.concept ? mergeConcept(publishedRaw.concept) : ORIGINAL_DESIGN;
  const snapshots: DesignSnapshot[] = Array.isArray(versionsStored.data?.value) ? (versionsStored.data?.value as unknown as DesignSnapshot[]) : [];

  const [concepts, setConcepts] = useState<DesignConcept[]>([]);
  const [locks, setLocks] = useState<DesignLocks>(DEFAULT_LOCKS);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<PreviewDevice>('mobile');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [surface, setSurface] = useState<PreviewSurface>('home');
  const [compare, setCompare] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(4);
  const [refinement, setRefinement] = useState('');
  const [confirmPublish, setConfirmPublish] = useState(false);

  useEffect(() => {
    if (hydrated || draftsStored.isLoading) return;
    const value = draftsStored.data?.value as { concepts?: unknown[]; locks?: Partial<DesignLocks> } | null | undefined;
    const stored = Array.isArray(value?.concepts) ? value!.concepts.map(mergeConcept) : [];
    setConcepts(stored);
    setLocks({ ...DEFAULT_LOCKS, ...(value?.locks ?? {}) });
    setSelectedId(stored[0]?.id ?? null);
    setHydrated(true);
  }, [hydrated, draftsStored.isLoading, draftsStored.data]);

  const selected = useMemo(() => concepts.find((c) => c.id === selectedId) ?? null, [concepts, selectedId]);
  const previewConcept = useMemo(() => (selected ? applyLocks(selected, locks) : null), [selected, locks]);

  const a11y = useMemo(() => (previewConcept ? accessibilityCheck(previewConcept) : null), [previewConcept]);
  const responsive = useMemo(() => (previewConcept ? responsiveCheck(previewConcept) : null), [previewConcept]);
  const perf = useMemo(() => (previewConcept ? performanceCheck(previewConcept) : null), [previewConcept]);
  const blocking = Boolean(a11y?.severe || responsive?.severe || perf?.severe);

  const persistDrafts = useMutation({
    mutationFn: (payload: { concepts: DesignConcept[]; locks: DesignLocks }) => updateSetting({ key: DESIGN_DRAFTS_KEY, value: payload }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['design-drafts'] }),
  });

  const saveDrafts = (nextConcepts: DesignConcept[], nextLocks: DesignLocks = locks) => {
    setConcepts(nextConcepts);
    setLocks(nextLocks);
    persistDrafts.mutate({ concepts: nextConcepts, locks: nextLocks });
  };

  const patchSelected = (partial: Partial<DesignConcept>) => {
    if (!selected) return;
    saveDrafts(concepts.map((c) => (c.id === selected.id ? { ...c, ...partial, status: 'draft' } : c)));
  };

  const themeSummary = useMemo(() => themeCss(liveConcept), [liveConcept]);

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeDesign({ data: { currentTheme: themeSummary, ...(notes ? { notes } : {}) } }),
    onSuccess: (result) => { setAnalysis(result.review); toast.success('Design audit ready'); },
    onError: (error) => toast.error(`Analysis failed: ${(error as Error).message}`),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateDesignConcepts({
        data: { count, keepNavy: locks.navy, keepGold: locks.gold, currentTheme: themeSummary, ...(brief ? { brief } : {}) },
      }),
    onSuccess: (result) => {
      const created = result.concepts.map((concept, index) =>
        mergeConcept({
          ...concept,
          id: `ai-${Date.now()}-${index}`,
          status: 'draft' as DesignStatus,
          source: 'ai' as const,
          version: 1,
          createdAt: new Date().toISOString(),
          createdBy: user?.email,
        }),
      );
      saveDrafts([...created, ...concepts]);
      setSelectedId(created[0]?.id ?? null);
      toast.success(`${created.length} concepts generated — nothing is live yet`);
    },
    onError: (error) => toast.error(`Generation failed: ${(error as Error).message}`),
  });

  const refineMutation = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error('Select a concept first.');
      return refineDesignConcept({ data: { concept: JSON.stringify(selected), instruction: refinement } });
    },
    onSuccess: (result) => {
      if (!selected) return;
      const next = mergeConcept({
        ...result.concept,
        id: selected.id,
        source: selected.source,
        createdAt: selected.createdAt,
        createdBy: selected.createdBy,
        version: selected.version + 1,
        status: 'draft' as DesignStatus,
      });
      saveDrafts(concepts.map((c) => (c.id === selected.id ? next : c)));
      setRefinement('');
      toast.success(`Refined to v${next.version} — still a draft`);
    },
    onError: (error) => toast.error(`Refine failed: ${(error as Error).message}`),
  });

  const publishMutation = useMutation({
    mutationFn: async (concept: DesignConcept) => {
      const history: DesignSnapshot[] = [
        {
          at: new Date().toISOString(),
          by: user?.email ?? 'admin',
          label: `Auto snapshot before publishing "${concept.name}"`,
          enabled: Boolean(publishedRaw?.enabled),
          concept: liveConcept,
        },
        ...snapshots,
      ].slice(0, 20);
      await updateSetting({ key: DESIGN_VERSIONS_KEY, value: history });
      const next = { ...concept, status: 'published' as DesignStatus, publishedAt: new Date().toISOString() };
      await updateSetting({ key: DESIGN_PUBLISHED_KEY, value: { enabled: true, concept: next, publishedAt: next.publishedAt, publishedBy: user?.email } });
      await updateSetting({
        key: DESIGN_DRAFTS_KEY,
        value: { concepts: concepts.map((c) => (c.id === concept.id ? next : c.status === 'published' ? { ...c, status: 'approved' as DesignStatus } : c)), locks },
      });
      return next;
    },
    onSuccess: (next) => {
      setConfirmPublish(false);
      setConcepts((prev) => prev.map((c) => (c.id === next.id ? next : c)));
      toast.success(`"${next.name}" is now live — rollback stays available`);
      void queryClient.invalidateQueries({ queryKey: ['design-published-admin'] });
      void queryClient.invalidateQueries({ queryKey: publishedDesignQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['design-versions'] });
      void queryClient.invalidateQueries({ queryKey: ['design-drafts'] });
    },
    onError: (error) => toast.error(`Publish failed: ${(error as Error).message}`),
  });

  const restoreMutation = useMutation({
    mutationFn: async (payload: { enabled: boolean; concept: DesignConcept; label: string }) => {
      const history: DesignSnapshot[] = [
        { at: new Date().toISOString(), by: user?.email ?? 'admin', label: `Auto snapshot before ${payload.label}`, enabled: Boolean(publishedRaw?.enabled), concept: liveConcept },
        ...snapshots,
      ].slice(0, 20);
      await updateSetting({ key: DESIGN_VERSIONS_KEY, value: history });
      await updateSetting({
        key: DESIGN_PUBLISHED_KEY,
        value: { enabled: payload.enabled, concept: payload.concept, publishedAt: new Date().toISOString(), publishedBy: user?.email },
      });
    },
    onSuccess: () => {
      toast.success('Live design restored');
      void queryClient.invalidateQueries({ queryKey: ['design-published-admin'] });
      void queryClient.invalidateQueries({ queryKey: publishedDesignQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['design-versions'] });
    },
    onError: (error) => toast.error(`Restore failed: ${(error as Error).message}`),
  });

  const busy = analyzeMutation.isPending || generateMutation.isPending || refineMutation.isPending || publishMutation.isPending || restoreMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border border-accent/10 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
            <ShieldCheck size={14} className="text-accent" /> AI Design Studio
          </p>
          <p className="text-xs text-muted-foreground">
            AI proposes; you approve. Nothing reaches the live site until you publish, and every publish snapshots the previous design first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-none border-accent/30 text-[10px] uppercase tracking-widest text-accent">
            Live: {publishedRaw?.enabled ? liveConcept.name : 'Original CBCP'}
          </Badge>
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : null}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['analyze', 'concepts', 'preview']} className="space-y-3">
        <Section id="analyze" title="1 · Analyze current app" description="AI audits colors, typography, spacing, mobile UX and consistency of the design you have today.">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes for the audit (optional)</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. the song list feels heavy on phones; navigation looks plain"
                className="min-h-[80px] rounded-none border-accent/10"
              />
            </div>
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending} className="min-h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest">
              {analyzeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Analyze current design
            </Button>
            {analysis ? (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap border border-accent/10 bg-muted/20 p-4 text-xs leading-relaxed text-foreground">{analysis}</pre>
            ) : null}
          </div>
        </Section>

        <Section id="concepts" title="2 · Generate design concepts" description="3–5 original, coordinated systems: colors, typography, spacing, components and motion.">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Creative brief (optional)</Label>
              <Textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="e.g. more reverent and editorial, calmer contrast, stronger mobile hierarchy"
                className="min-h-[80px] rounded-none border-accent/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Number of concepts: {count}</Label>
              <Slider value={[count]} min={3} max={5} step={1} onValueChange={([value]) => setCount(value ?? 4)} />
            </div>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="min-h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest">
              {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Generate concepts
            </Button>

            <div className="grid gap-3 sm:grid-cols-2">
              {concepts.map((concept) => {
                const locked = applyLocks(concept, locks);
                const score = overallScore(scoreConcept(locked));
                const active = concept.id === selectedId;
                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => setSelectedId(concept.id)}
                    className={`min-h-11 border p-4 text-left transition-colors ${active ? 'border-accent bg-accent/5' : 'border-accent/10 hover:border-accent/40'}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-foreground">{concept.name}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {concept.recommended ? <Badge variant="outline" className="rounded-none border-accent/40 text-[9px] uppercase text-accent">Recommended</Badge> : null}
                        <Badge variant="outline" className="rounded-none text-[9px] uppercase">{concept.status}</Badge>
                      </span>
                    </span>
                    <span className="mt-2 flex gap-1">
                      {[locked.light.background, locked.light.primary, locked.light.accent, locked.light.muted, locked.dark.background].map((color, index) => (
                        <span key={`${concept.id}-${index}`} className="h-5 w-5 border border-black/10" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-xs text-muted-foreground line-clamp-3">{concept.direction}</span>
                    <span className="mt-2 block text-[10px] uppercase tracking-widest text-accent">Score {score}/100 · v{concept.version}</span>
                  </button>
                );
              })}
              {!concepts.length ? <p className="text-xs text-muted-foreground">No concepts yet — generate a set to begin.</p> : null}
            </div>
          </div>
        </Section>

        <Section id="preview" title="3 · Safe live preview & compare" description="Preview the concept on real screens without touching the live app, side by side with the current design.">
          {previewConcept ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['mobile', 'tablet', 'desktop'] as PreviewDevice[]).map((option) => (
                  <Button
                    key={option}
                    size="sm"
                    variant={device === option ? 'default' : 'outline'}
                    onClick={() => setDevice(option)}
                    className="min-h-11 rounded-none text-[10px] uppercase tracking-widest"
                  >
                    {option === 'mobile' ? <Smartphone size={14} className="mr-1" /> : option === 'tablet' ? <Tablet size={14} className="mr-1" /> : <Monitor size={14} className="mr-1" />}
                    {option}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} className="min-h-11 rounded-none text-[10px] uppercase tracking-widest">
                  {mode === 'light' ? <Sun size={14} className="mr-1" /> : <Moon size={14} className="mr-1" />} {mode}
                </Button>
                <Button size="sm" variant={compare ? 'default' : 'outline'} onClick={() => setCompare(!compare)} className="min-h-11 rounded-none text-[10px] uppercase tracking-widest">
                  <Columns2 size={14} className="mr-1" /> Compare
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {PREVIEW_SURFACES.map((item) => (
                  <Button
                    key={item.key}
                    size="sm"
                    variant={surface === item.key ? 'default' : 'outline'}
                    onClick={() => setSurface(item.key)}
                    className="min-h-11 rounded-none text-[10px] uppercase tracking-widest"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className={compare ? 'grid gap-4 lg:grid-cols-2' : ''}>
                {compare ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Current live design</p>
                    <DesignPreview concept={liveConcept} mode={mode} device={device} surface={surface} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Proposed: {previewConcept.name}</p>
                  <DesignPreview concept={previewConcept} mode={mode} device={device} surface={surface} />
                </div>
              </div>

              <div className="border border-accent/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What would change</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {diffSummary(liveConcept, previewConcept).map((line) => <li key={line}>• {line}</li>)}
                </ul>
              </div>

              <ScoreGrid concept={previewConcept} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select or generate a concept to preview it.</p>
          )}
        </Section>

        <Section id="customize" title="4 · Customize & refine" description="Fine-tune colors, fonts, radius and component styles, or ask AI to adjust the selected concept.">
          {selected ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concept name</Label>
                  <Input value={selected.name} onChange={(event) => patchSelected({ name: event.target.value })} className="rounded-none border-accent/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Corner radius: {selected.layout.radius}px</Label>
                  <Slider
                    value={[selected.layout.radius]}
                    min={0}
                    max={28}
                    step={1}
                    onValueChange={([value]) => patchSelected({ layout: { ...selected.layout, radius: value ?? 0 } })}
                  />
                </div>
              </div>

              {(['light', 'dark'] as const).map((paletteMode) => (
                <div key={paletteMode} className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{paletteMode} palette</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PALETTE_FIELDS.map((field) => (
                      <div key={`${paletteMode}-${field.key}`} className="space-y-1">
                        <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">{field.label}</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selected[paletteMode][field.key]}
                            onChange={(event) => patchSelected({ [paletteMode]: { ...selected[paletteMode], [field.key]: event.target.value } } as Partial<DesignConcept>)}
                            className="h-9 w-9 border border-accent/20 bg-transparent"
                            aria-label={`${paletteMode} ${field.label}`}
                          />
                          <span className="truncate text-[10px] text-muted-foreground">{selected[paletteMode][field.key]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-3">
                {(['heading', 'body', 'chord'] as const).map((slot) => (
                  <div key={slot} className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">{slot} font</Label>
                    <select
                      value={selected.fonts[slot]}
                      onChange={(event) => patchSelected({ fonts: { ...selected.fonts, [slot]: event.target.value } })}
                      disabled={slot === 'chord' && locks.chordFont}
                      className="min-h-11 w-full border border-accent/10 bg-background px-2 text-xs text-foreground disabled:opacity-60"
                    >
                      {FONT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {LAYOUT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-[9px] uppercase tracking-widest text-muted-foreground">{field.label}</Label>
                    <select
                      value={String(selected.layout[field.key])}
                      onChange={(event) => patchSelected({ layout: { ...selected.layout, [field.key]: event.target.value } as DesignLayout })}
                      className="min-h-11 w-full border border-accent/10 bg-background px-2 text-xs text-foreground"
                    >
                      {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border border-accent/10 p-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ask AI to adjust this concept</Label>
                <Textarea
                  value={refinement}
                  onChange={(event) => setRefinement(event.target.value)}
                  placeholder="e.g. warmer background, calmer gold, tighter mobile spacing"
                  className="min-h-[70px] rounded-none border-accent/10"
                />
                <Button
                  onClick={() => refineMutation.mutate()}
                  disabled={refineMutation.isPending || refinement.trim().length < 3}
                  className="min-h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest"
                >
                  {refineMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Refine concept
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select a concept to customize it.</p>
          )}
        </Section>

        <Section id="checks" title="5 · Accessibility, responsive & performance checks" description="Every concept is validated before it can be approved or published.">
          {a11y && responsive && perf ? (
            <div className="grid gap-3 lg:grid-cols-3">
              <CheckList title="Accessibility (WCAG AA)" report={a11y} />
              <CheckList title="Responsive 320 → 1440px" report={responsive} />
              <CheckList title="Performance" report={perf} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select a concept to run the checks.</p>
          )}
        </Section>

        <Section id="locks" title="6 · Brand protection locks" description="Guardrails the AI and publishing flow can never override.">
          <div className="space-y-3">
            {LOCK_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center justify-between gap-4 border border-accent/10 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 text-xs text-foreground">
                  <Lock size={14} className="shrink-0 text-accent" /> {field.label}
                </span>
                <Switch checked={locks[field.key]} onCheckedChange={(value) => saveDrafts(concepts, { ...locks, [field.key]: value })} />
              </label>
            ))}
          </div>
        </Section>

        <Section id="approval" title="7 · Approval & publish" description="Draft → reviewed → approved → published. Publishing requires explicit confirmation.">
          {selected && previewConcept ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(['draft', 'reviewed', 'approved'] as DesignStatus[]).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selected.status === status ? 'default' : 'outline'}
                    onClick={() => saveDrafts(concepts.map((c) => (c.id === selected.id ? { ...c, status } : c)))}
                    className="min-h-11 rounded-none text-[10px] uppercase tracking-widest"
                  >
                    Mark {status}
                  </Button>
                ))}
              </div>

              {blocking ? (
                <p className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  This concept fails one or more accessibility/responsive/performance checks. Fix the failures before publishing.
                </p>
              ) : null}

              {!confirmPublish ? (
                <Button
                  onClick={() => setConfirmPublish(true)}
                  disabled={selected.status !== 'approved' || blocking}
                  className="min-h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest"
                >
                  Publish this design
                </Button>
              ) : (
                <div className="space-y-3 border border-accent/30 bg-accent/5 p-4">
                  <p className="text-xs text-foreground">
                    Publishing “{previewConcept.name}” updates the live public site and admin dashboard. A recovery snapshot of the current design is saved automatically.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => publishMutation.mutate(previewConcept)}
                      disabled={publishMutation.isPending}
                      className="min-h-11 rounded-none bg-accent text-primary text-[10px] font-bold uppercase tracking-widest"
                    >
                      {publishMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Yes, publish now
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmPublish(false)} className="min-h-11 rounded-none text-[10px] uppercase tracking-widest">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Select a concept to move it through approval.</p>
          )}
        </Section>

        <Section id="history" title="8 · Snapshots & rollback" description="Restore the previous design or the original CBCP design at any time.">
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => restoreMutation.mutate({ enabled: false, concept: ORIGINAL_DESIGN, label: 'restoring original CBCP design' })}
              disabled={restoreMutation.isPending}
              className="min-h-11 rounded-none text-[10px] uppercase tracking-widest"
            >
              <RotateCcw size={14} className="mr-2" /> Restore original CBCP design
            </Button>
            {snapshots.length ? (
              <ul className="divide-y divide-accent/10 border border-accent/10">
                {snapshots.map((snapshot) => (
                  <li key={snapshot.at} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-foreground">{snapshot.concept?.name ?? 'Design snapshot'}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {new Date(snapshot.at).toLocaleString()} · {snapshot.by ?? 'admin'} · {snapshot.label}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreMutation.mutate({ enabled: snapshot.enabled, concept: mergeConcept(snapshot.concept), label: 'rolling back to a snapshot' })}
                      disabled={restoreMutation.isPending}
                      className="min-h-11 shrink-0 rounded-none text-[10px] uppercase tracking-widest"
                    >
                      <History size={14} className="mr-2" /> Restore
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No snapshots yet — one is created automatically on every publish or rollback.</p>
            )}
          </div>
        </Section>
      </Accordion>
    </div>
  );
}
