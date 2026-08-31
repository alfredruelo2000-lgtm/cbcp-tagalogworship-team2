import { useQuery } from "@tanstack/react-query";
import { getSettingByKey } from "@/lib/db-settings.functions";
import logoAsset from "@/assets/cbcp-logo.png.asset.json";

/**
 * Single canonical branding configuration for the whole app.
 * Published config lives in ministry_settings under `branding`.
 * Work in progress lives under `branding_draft`, history under `branding_versions`.
 */
export const BRANDING_KEY = "branding";
export const BRANDING_DRAFT_KEY = "branding_draft";
export const BRANDING_VERSIONS_KEY = "branding_versions";

export const brandingQueryKey = ["branding-config"] as const;

export const BRAND_SLOTS = [
  { key: "primary", label: "Primary Logo", hint: "Main CBCP Tagalog Worship Team lockup" },
  { key: "mark", label: "Logo Mark / Icon", hint: "Compact mark for header, sidebar, mobile" },
  { key: "light", label: "Light Logo", hint: "For dark / navy backgrounds" },
  { key: "dark", label: "Dark Logo", hint: "For light / cream backgrounds" },
  { key: "favicon", label: "Favicon", hint: "Browser tab icon (square)" },
  { key: "pwa192", label: "PWA Icon 192", hint: "Installed app icon 192×192" },
  { key: "pwa512", label: "PWA Icon 512", hint: "Installed app icon 512×512" },
  { key: "splash", label: "Splash / Launch", hint: "Launch screen + brand entrance" },
  { key: "original", label: "Original Upload", hint: "Untouched backup, never published" },
] as const;

export type BrandSlot = (typeof BRAND_SLOTS)[number]["key"];

export interface BrandPalette {
  navy: string;
  gold: string;
  cream: string;
  text: string;
  muted: string;
  applyToSite: boolean;
}

export interface BrandDisplay {
  size: number;
  padding: number;
  maxWidth: number;
  align: "left" | "center";
  iconOnly: boolean;
}

export interface BrandMotion {
  preset:
    | "none"
    | "gentle-fade"
    | "soft-reveal"
    | "subtle-glow"
    | "mark-to-name"
    | "elegant-scale"
    | "light-reveal";
  durationMs: number;
  autoplay: boolean;
  scope: "splash" | "splash-login" | "splash-login-home";
}

export interface BrandingConfig {
  name: string;
  tagline: string;
  logos: Partial<Record<BrandSlot, string | undefined>>;
  display: BrandDisplay;
  palette: BrandPalette;
  motion: BrandMotion;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BrandVersion {
  at: string;
  by?: string;
  label?: string;
  config: BrandingConfig;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  name: "CBCP Tagalog Worship Team",
  tagline: "Praise and worship ministry",
  logos: {
    primary: logoAsset.url,
    mark: logoAsset.url,
    light: logoAsset.url,
    dark: logoAsset.url,
    splash: logoAsset.url,
    favicon: "/favicon.png",
    pwa192: "/icons/cbcp-192.png",
    pwa512: "/icons/cbcp-512.png",
  },
  display: { size: 48, padding: 0, maxWidth: 220, align: "left", iconOnly: false },
  palette: {
    navy: "#071a4a",
    gold: "#c9a227",
    cream: "#fdf7e7",
    text: "#0b1220",
    muted: "#64748b",
    applyToSite: false,
  },
  motion: { preset: "gentle-fade", durationMs: 1400, autoplay: true, scope: "splash" },
};

export function mergeBranding(value: unknown): BrandingConfig {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<BrandingConfig>) : {};
  return {
    ...DEFAULT_BRANDING,
    ...raw,
    logos: { ...DEFAULT_BRANDING.logos, ...(raw.logos ?? {}) },
    display: { ...DEFAULT_BRANDING.display, ...(raw.display ?? {}) },
    palette: { ...DEFAULT_BRANDING.palette, ...(raw.palette ?? {}) },
    motion: { ...DEFAULT_BRANDING.motion, ...(raw.motion ?? {}) },
  };
}

/** Pick the best logo for a surface without ever leaving an empty <img>. */
export function pickLogo(
  config: BrandingConfig,
  kind: "primary" | "mark" | "light" | "dark" | "splash" | "favicon",
): string {
  const { logos } = config;
  const chain: Record<typeof kind, Array<string | undefined>> = {
    primary: [logos.primary, logos.mark, logos.dark, logos.light],
    mark: [logos.mark, logos.primary, logos.light, logos.dark],
    light: [logos.light, logos.primary, logos.mark],
    dark: [logos.dark, logos.primary, logos.mark],
    splash: [logos.splash, logos.primary, logos.mark],
    favicon: [logos.favicon, logos.mark, logos.primary],
  };
  return chain[kind].find((url) => typeof url === "string" && url.length > 0) ?? logoAsset.url;
}

/** Published branding — safe for public pages (anon can read ministry_settings). */
export function useBranding() {
  const query = useQuery({
    queryKey: brandingQueryKey,
    queryFn: () => getSettingByKey(BRANDING_KEY),
    staleTime: 30_000,
  });
  const branding = mergeBranding(query.data?.value);
  return { ...query, branding };
}
