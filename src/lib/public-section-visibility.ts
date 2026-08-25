import { useQuery } from "@tanstack/react-query";
import { getSettingByKey } from "@/lib/db-settings.functions";

export const PUBLIC_SECTION_KEYS = [
  "home",
  "worship",
  "songs",
  "setlists",
  "team",
  "resources",
  "media",
  "about",
  "contact",
] as const;

export type PublicSectionKey = (typeof PUBLIC_SECTION_KEYS)[number];

export const SECTION_META: Record<PublicSectionKey, { label: string; to: string }> = {
  home: { label: "HOME", to: "/" },
  worship: { label: "WORSHIP", to: "/worship" },
  songs: { label: "SONGS", to: "/songs" },
  setlists: { label: "SETLISTS", to: "/setlists" },
  team: { label: "TEAM", to: "/team" },
  resources: { label: "RESOURCES", to: "/resources" },
  media: { label: "MEDIA", to: "/media" },
  about: { label: "ABOUT", to: "/about" },
  contact: { label: "CONTACT", to: "/contact" },
};

export const publicSectionVisibilityQueryKey = ["homepage-sections-public"] as const;

type SectionConfig = boolean | { published?: boolean; showInNavigation?: boolean; displayOrder?: number };

export function usePublicSectionVisibility() {
  const query = useQuery({
    queryKey: publicSectionVisibilityQueryKey,
    queryFn: () => getSettingByKey("homepage_sections"),
  });

  const configured = query.data?.value;
  const raw = configured && typeof configured === "object" && !Array.isArray(configured)
    ? (configured as Record<string, unknown>)
    : {};

  const sections = raw as Record<string, SectionConfig>;
  const configuredOrder = Array.isArray(raw["order"]) ? (raw["order"] as string[]) : [];

  const isVisible = (key: PublicSectionKey) => {
    const setting = sections[key];
    if (typeof setting === "boolean") return setting;
    if (setting && typeof setting === "object" && "published" in setting) {
      return setting.published !== false;
    }
    return true;
  };

  const isNavVisible = (key: PublicSectionKey) => {
    if (!isVisible(key)) return false;
    const setting = sections[key];
    if (setting && typeof setting === "object" && "showInNavigation" in setting) {
      return setting.showInNavigation !== false;
    }
    return true;
  };

  // Ordered list of section keys following the admin-configured order.
  const orderedKeys: PublicSectionKey[] = [
    ...configuredOrder.filter((key): key is PublicSectionKey =>
      (PUBLIC_SECTION_KEYS as readonly string[]).includes(key)),
    ...PUBLIC_SECTION_KEYS.filter((key) => !configuredOrder.includes(key)),
  ];

  const navItems = orderedKeys
    .filter((key) => isNavVisible(key))
    .map((key) => ({ key, ...SECTION_META[key] }));

  return {
    ...query,
    sections,
    orderedKeys,
    navItems,
    isVisible,
    isNavVisible,
  };
}
