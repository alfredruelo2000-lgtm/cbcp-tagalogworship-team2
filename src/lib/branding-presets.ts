/** Local persistence for AI collage studio branding presets. */
export type BrandingPresetValues = {
  font: string;
  align: string;
  titleScale: number;
  uppercaseTitle: boolean;
  wmMode: string;
  wmText: string;
  wmPos: string;
  wmOpacity: number;
  wmScale: number;
};

export type BrandingPreset = BrandingPresetValues & { id: string; name: string };

const KEY = 'cbcp-branding-presets';

export function loadBrandingPresets(): BrandingPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BrandingPreset[]) : [];
  } catch {
    return [];
  }
}

export function saveBrandingPresets(presets: BrandingPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(presets.slice(0, 24)));
  } catch {
    /* storage unavailable — presets stay in-memory for this session */
  }
}
