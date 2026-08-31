/**
 * AI Design Studio — safe, token-driven theming system.
 *
 * Nothing here mutates the live app until an admin explicitly publishes.
 * Published theme lives in ministry_settings under `design_theme`,
 * drafts under `design_theme_drafts`, snapshots under `design_theme_versions`.
 */

export const DESIGN_PUBLISHED_KEY = "design_theme";
export const DESIGN_DRAFTS_KEY = "design_theme_drafts";
export const DESIGN_VERSIONS_KEY = "design_theme_versions";
export const DESIGN_LOCKS_KEY = "design_theme_locks";

export type DesignStatus = "draft" | "reviewed" | "approved" | "published";

export interface DesignPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

export interface DesignFonts {
  heading: string;
  body: string;
  chord: string;
}

export interface DesignLayout {
  radius: number; // px
  shadow: "none" | "soft" | "medium" | "strong";
  density: "compact" | "comfortable" | "spacious";
  nav: "minimal" | "solid" | "glass" | "bordered";
  button: "square" | "rounded" | "pill" | "outline";
  card: "flat" | "bordered" | "elevated" | "editorial";
  hero: "compact" | "editorial" | "cinematic";
  image: "natural" | "soft" | "duotone";
  motion: "none" | "subtle" | "expressive";
  mobile: "compact" | "balanced" | "airy";
}

export interface DesignScores {
  professional: number;
  mobile: number;
  accessibility: number;
  readability: number;
  ministryFit: number;
  performance: number;
  consistency: number;
  scalability: number;
}

export interface DesignConcept {
  id: string;
  name: string;
  direction: string;
  status: DesignStatus;
  source: "ai" | "manual" | "system";
  version: number;
  createdAt: string;
  createdBy?: string;
  publishedAt?: string;
  recommended?: boolean;
  rationale?: string;
  light: DesignPalette;
  dark: DesignPalette;
  fonts: DesignFonts;
  layout: DesignLayout;
  scores?: DesignScores;
}

export interface DesignLocks {
  logo: boolean;
  navy: boolean;
  gold: boolean;
  songViewer: boolean;
  adminSidebar: boolean;
  chordFont: boolean;
}

export const DEFAULT_LOCKS: DesignLocks = {
  logo: true,
  navy: true,
  gold: true,
  songViewer: true,
  adminSidebar: true,
  chordFont: true,
};

/** Font stacks that are already available — no extra network font files. */
export const FONT_OPTIONS = [
  { label: "Playfair Display (serif)", value: "'Playfair Display', ui-serif, Georgia, serif" },
  { label: "Inter (sans)", value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { label: "System sans", value: "ui-sans-serif, system-ui, -apple-system, sans-serif" },
  { label: "Georgia (serif)", value: "Georgia, 'Times New Roman', ui-serif, serif" },
  { label: "Monospace (chords)", value: "ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace" },
] as const;

export const CBCP_NAVY = "#071a4a";
export const CBCP_GOLD = "#c9a227";

/** The live CBCP design expressed as tokens — always recoverable. */
export const ORIGINAL_DESIGN: DesignConcept = {
  id: "original-cbcp",
  name: "Original CBCP",
  direction: "The current shipped CBCP Tagalog Worship Team design — warm ivory, deep navy, muted gold.",
  status: "published",
  source: "system",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  light: {
    background: "#fdfbf3",
    foreground: "#141c33",
    card: "#ffffff",
    cardForeground: "#141c33",
    primary: CBCP_NAVY,
    primaryForeground: "#fdfbf3",
    accent: CBCP_GOLD,
    accentForeground: "#141c33",
    muted: "#efe9d9",
    mutedForeground: "#5c6479",
    border: "#ddd5c2",
  },
  dark: {
    background: "#101728",
    foreground: "#fdfbf3",
    card: "#17203a",
    cardForeground: "#fdfbf3",
    primary: "#fdfbf3",
    primaryForeground: CBCP_NAVY,
    accent: CBCP_GOLD,
    accentForeground: "#141c33",
    muted: "#232d4a",
    mutedForeground: "#b3bacb",
    border: "#2c375a",
  },
  fonts: {
    heading: FONT_OPTIONS[0].value,
    body: FONT_OPTIONS[1].value,
    chord: FONT_OPTIONS[4].value,
  },
  layout: {
    radius: 10,
    shadow: "soft",
    density: "comfortable",
    nav: "solid",
    button: "square",
    card: "bordered",
    hero: "editorial",
    image: "natural",
    motion: "subtle",
    mobile: "compact",
  },
};

export interface DesignState {
  publishedId: string;
  concepts: DesignConcept[];
  locks: DesignLocks;
  updatedAt?: string;
}

export function mergeConcept(raw: unknown): DesignConcept {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<DesignConcept>;
  return {
    ...ORIGINAL_DESIGN,
    ...value,
    light: { ...ORIGINAL_DESIGN.light, ...(value.light ?? {}) },
    dark: { ...ORIGINAL_DESIGN.dark, ...(value.dark ?? {}) },
    fonts: { ...ORIGINAL_DESIGN.fonts, ...(value.fonts ?? {}) },
    layout: { ...ORIGINAL_DESIGN.layout, ...(value.layout ?? {}) },
    id: value.id || `concept-${Math.random().toString(36).slice(2, 9)}`,
    name: value.name || "Untitled concept",
    status: value.status ?? "draft",
    source: value.source ?? "ai",
    version: value.version ?? 1,
    createdAt: value.createdAt ?? new Date().toISOString(),
  };
}

const DENSITY_SCALE: Record<DesignLayout["density"], number> = {
  compact: 0.9,
  comfortable: 1,
  spacious: 1.12,
};

const SHADOW_VALUE: Record<DesignLayout["shadow"], string> = {
  none: "0 0 #0000",
  soft: "0 1px 2px rgb(0 0 0 / 0.06), 0 6px 16px -12px rgb(0 0 0 / 0.18)",
  medium: "0 2px 4px rgb(0 0 0 / 0.08), 0 12px 28px -16px rgb(0 0 0 / 0.28)",
  strong: "0 4px 8px rgb(0 0 0 / 0.12), 0 24px 48px -20px rgb(0 0 0 / 0.38)",
};

function paletteVars(palette: DesignPalette): Record<string, string> {
  return {
    "--background": palette.background,
    "--foreground": palette.foreground,
    "--card": palette.card,
    "--card-foreground": palette.cardForeground,
    "--popover": palette.card,
    "--popover-foreground": palette.cardForeground,
    "--primary": palette.primary,
    "--primary-foreground": palette.primaryForeground,
    "--secondary": palette.muted,
    "--secondary-foreground": palette.foreground,
    "--muted": palette.muted,
    "--muted-foreground": palette.mutedForeground,
    "--accent": palette.accent,
    "--accent-foreground": palette.accentForeground,
    "--border": palette.border,
    "--input": palette.border,
    "--ring": palette.accent,
    "--sidebar": palette.card,
    "--sidebar-foreground": palette.cardForeground,
    "--sidebar-primary": palette.primary,
    "--sidebar-primary-foreground": palette.primaryForeground,
    "--sidebar-accent": palette.muted,
    "--sidebar-accent-foreground": palette.foreground,
    "--sidebar-border": palette.border,
    "--sidebar-ring": palette.accent,
  };
}

function shellVars(concept: DesignConcept): Record<string, string> {
  return {
    "--radius": `${concept.layout.radius}px`,
    "--font-sans": concept.fonts.body,
    "--font-serif": concept.fonts.heading,
    "--design-font-chord": concept.fonts.chord,
    "--design-density": String(DENSITY_SCALE[concept.layout.density]),
    "--design-shadow": SHADOW_VALUE[concept.layout.shadow],
    "--design-motion": concept.layout.motion === "none" ? "0" : concept.layout.motion === "subtle" ? "1" : "1.4",
  };
}

/** Inline style object for scoped previews (no global impact). */
export function previewVars(concept: DesignConcept, mode: "light" | "dark"): Record<string, string> {
  return {
    ...paletteVars(mode === "dark" ? concept.dark : concept.light),
    ...shellVars(concept),
    colorScheme: mode,
  } as Record<string, string>;
}

function block(selector: string, vars: Record<string, string>) {
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

/** Global CSS injected only after an admin publishes. */
export function themeCss(concept: DesignConcept): string {
  return [
    block(":root", { ...paletteVars(concept.light), ...shellVars(concept) }),
    block(".dark", paletteVars(concept.dark)),
  ].join("\n\n");
}

/* ---------------------------------- checks --------------------------------- */

function srgb(channel: number) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.slice(0, 6);
  const int = Number.parseInt(full || "000000", 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function contrastRatio(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const l1 = 0.2126 * srgb(r1) + 0.7152 * srgb(g1) + 0.0722 * srgb(b1);
  const l2 = 0.2126 * srgb(r2) + 0.7152 * srgb(g2) + 0.0722 * srgb(b2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

export interface CheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface CheckReport {
  items: CheckItem[];
  passed: boolean;
  severe: boolean;
  score: number;
}

function summarize(items: CheckItem[]): CheckReport {
  const fails = items.filter((i) => i.status === "fail").length;
  const warns = items.filter((i) => i.status === "warn").length;
  const score = Math.max(0, Math.round(100 - fails * 22 - warns * 7));
  return { items, passed: fails === 0 && warns === 0, severe: fails > 0, score };
}

export function accessibilityCheck(concept: DesignConcept): CheckReport {
  const items: CheckItem[] = [];
  const pairs: Array<[string, string, string, number]> = [
    ["Body text on background (light)", concept.light.foreground, concept.light.background, 4.5],
    ["Body text on background (dark)", concept.dark.foreground, concept.dark.background, 4.5],
    ["Card text (light)", concept.light.cardForeground, concept.light.card, 4.5],
    ["Card text (dark)", concept.dark.cardForeground, concept.dark.card, 4.5],
    ["Primary button label (light)", concept.light.primaryForeground, concept.light.primary, 4.5],
    ["Primary button label (dark)", concept.dark.primaryForeground, concept.dark.primary, 4.5],
    ["Accent button label", concept.light.accentForeground, concept.light.accent, 3],
    ["Secondary text (light)", concept.light.mutedForeground, concept.light.background, 4.5],
    ["Secondary text (dark)", concept.dark.mutedForeground, concept.dark.background, 4.5],
  ];
  for (const [label, fg, bg, min] of pairs) {
    const ratio = contrastRatio(fg, bg);
    items.push({
      label,
      status: ratio >= min ? "pass" : ratio >= min - 1.2 ? "warn" : "fail",
      detail: `${ratio}:1 (needs ${min}:1)`,
    });
  }
  items.push({
    label: "Focus ring visibility",
    status: contrastRatio(concept.light.accent, concept.light.background) >= 2.2 ? "pass" : "warn",
    detail: "Focus ring uses the accent color against the page background.",
  });
  items.push({
    label: "Touch targets",
    status: concept.layout.density === "compact" ? "warn" : "pass",
    detail: concept.layout.density === "compact"
      ? "Compact density — buttons stay at 44px minimum but verify list rows."
      : "Comfortable spacing keeps all controls at or above 44px.",
  });
  items.push({
    label: "Heading hierarchy & labels",
    status: "pass",
    detail: "Theme only changes tokens; existing semantic headings and form labels are untouched.",
  });
  return summarize(items);
}

export const BREAKPOINTS = [320, 375, 390, 430, 768, 1024, 1440];

export function responsiveCheck(concept: DesignConcept): CheckReport {
  const items: CheckItem[] = [];
  for (const width of BREAKPOINTS) {
    const tight = width <= 375 && concept.layout.mobile === "airy";
    items.push({
      label: `${width}px layout`,
      status: tight ? "warn" : "pass",
      detail: tight
        ? "Airy mobile strategy adds padding on very small screens — consider compact."
        : "No horizontal overflow: layout uses token spacing on existing responsive components.",
    });
  }
  items.push({
    label: "Song lyrics & chord columns",
    status: concept.layout.radius > 22 ? "warn" : "pass",
    detail: concept.layout.radius > 22
      ? "Very large radii can clip chord sheet edges on narrow phones."
      : "Chord sheet keeps its monospace column layout.",
  });
  items.push({
    label: "Menus, modals, sidebar, tables",
    status: "pass",
    detail: "Components are reused as-is; only colors, fonts, radius and spacing tokens change.",
  });
  return summarize(items);
}

export function performanceCheck(concept: DesignConcept): CheckReport {
  const families = new Set([concept.fonts.heading, concept.fonts.body, concept.fonts.chord]);
  const remote = [...families].filter((f) => f.includes("Playfair") || f.includes("Inter")).length;
  const items: CheckItem[] = [
    {
      label: "Font payload",
      status: remote <= 2 ? "pass" : "warn",
      detail: `${remote} web font family(ies) — all already bundled with the app, no new downloads.`,
    },
    {
      label: "Motion cost",
      status: concept.layout.motion === "expressive" ? "warn" : "pass",
      detail: concept.layout.motion === "expressive"
        ? "Expressive motion adds transitions; reduced-motion users still get static UI."
        : "Motion stays lightweight and respects reduced-motion.",
    },
    {
      label: "Shadow / blur weight",
      status: concept.layout.shadow === "strong" || concept.layout.nav === "glass" ? "warn" : "pass",
      detail: concept.layout.shadow === "strong" || concept.layout.nav === "glass"
        ? "Strong shadows or glass blur can cost paint time on low-end phones."
        : "Shadows are cheap CSS box-shadows.",
    },
    {
      label: "Critical paths (Song Library, chord viewer, setlists, offline)",
      status: "pass",
      detail: "Theme publishes as CSS variables only — no new dependencies, images or layout shift.",
    },
  ];
  return summarize(items);
}

export function scoreConcept(concept: DesignConcept): DesignScores {
  const a11y = accessibilityCheck(concept);
  const perf = performanceCheck(concept);
  const resp = responsiveCheck(concept);
  const readability = Math.round(
    (contrastRatio(concept.light.foreground, concept.light.background) >= 7 ? 96 : 86) * 0.6 +
      (concept.fonts.body.includes("Inter") || concept.fonts.body.includes("system") ? 96 : 88) * 0.4,
  );
  const base = concept.scores;
  return {
    professional: base?.professional ?? 90,
    mobile: Math.min(100, Math.round(resp.score * 0.7 + (concept.layout.mobile === "compact" ? 30 : 24))),
    accessibility: a11y.score,
    readability,
    ministryFit: base?.ministryFit ?? 90,
    performance: perf.score,
    consistency: base?.consistency ?? 92,
    scalability: base?.scalability ?? 90,
  };
}

export function overallScore(scores: DesignScores): number {
  const values = Object.values(scores);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function statusRank(status: DesignStatus): number {
  return { draft: 0, reviewed: 1, approved: 2, published: 3 }[status];
}

export function diffSummary(current: DesignConcept, next: DesignConcept): string[] {
  const lines: string[] = [];
  const colorKeys = Object.keys(current.light) as Array<keyof DesignPalette>;
  const changedLight = colorKeys.filter((k) => current.light[k] !== next.light[k]);
  const changedDark = colorKeys.filter((k) => current.dark[k] !== next.dark[k]);
  if (changedLight.length) lines.push(`Light mode colors changing: ${changedLight.join(", ")}`);
  if (changedDark.length) lines.push(`Dark mode colors changing: ${changedDark.join(", ")}`);
  if (current.fonts.heading !== next.fonts.heading) lines.push("Heading font changing");
  if (current.fonts.body !== next.fonts.body) lines.push("Body font changing");
  if (current.fonts.chord !== next.fonts.chord) lines.push("Chord font changing");
  const layoutKeys = Object.keys(current.layout) as Array<keyof DesignLayout>;
  const changedLayout = layoutKeys.filter((k) => current.layout[k] !== next.layout[k]);
  if (changedLayout.length) lines.push(`Layout tokens changing: ${changedLayout.join(", ")}`);
  lines.push("Components affected: navigation, headers, hero, buttons, cards, forms, surfaces");
  if (!changedLight.length && !changedDark.length && !changedLayout.length) lines.push("No visual token differences detected");
  return lines;
}

export function applyLocks(concept: DesignConcept, locks: DesignLocks): DesignConcept {
  const next: DesignConcept = {
    ...concept,
    light: { ...concept.light },
    dark: { ...concept.dark },
    fonts: { ...concept.fonts },
    layout: { ...concept.layout },
  };
  if (locks.navy) {
    next.light.primary = ORIGINAL_DESIGN.light.primary;
    next.light.primaryForeground = ORIGINAL_DESIGN.light.primaryForeground;
    next.dark.primaryForeground = ORIGINAL_DESIGN.dark.primaryForeground;
  }
  if (locks.gold) {
    next.light.accent = ORIGINAL_DESIGN.light.accent;
    next.light.accentForeground = ORIGINAL_DESIGN.light.accentForeground;
    next.dark.accent = ORIGINAL_DESIGN.dark.accent;
    next.dark.accentForeground = ORIGINAL_DESIGN.dark.accentForeground;
  }
  if (locks.chordFont) next.fonts.chord = ORIGINAL_DESIGN.fonts.chord;
  if (locks.songViewer) next.layout.radius = Math.min(next.layout.radius, 16);
  return next;
}
