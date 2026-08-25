import { useQuery } from "@tanstack/react-query";
import { getSettingByKey } from "@/lib/db-settings.functions";

export const PUBLIC_SECTION_KEYS = [
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

export const publicSectionVisibilityQueryKey = ["homepage-sections-public"] as const;

export function usePublicSectionVisibility() {
  const query = useQuery({
    queryKey: publicSectionVisibilityQueryKey,
    queryFn: () => getSettingByKey("homepage_sections"),
  });

  const configured = query.data?.value;
  const sections = configured && typeof configured === "object" && !Array.isArray(configured)
    ? configured as Record<string, boolean | { published?: boolean }>
    : {};

  return {
    ...query,
    sections,
    isVisible: (key: PublicSectionKey) => {
      const setting = sections[key];
      if (typeof setting === "boolean") return setting;
      if (setting && typeof setting === "object" && "published" in setting) {
        return setting.published !== false;
      }
      return true;
    },
  };
}
