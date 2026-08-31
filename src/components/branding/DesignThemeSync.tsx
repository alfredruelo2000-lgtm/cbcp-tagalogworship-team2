import { useQuery } from "@tanstack/react-query";
import { getSettingByKey } from "@/lib/db-settings.functions";
import { DESIGN_PUBLISHED_KEY, mergeConcept, themeCss } from "@/lib/design-studio";

export const publishedDesignQueryKey = ["design-theme-published"] as const;

export interface PublishedDesign {
  enabled: boolean;
  concept: ReturnType<typeof mergeConcept>;
  publishedAt?: string | undefined;
  publishedBy?: string | undefined;
}

export function usePublishedDesign() {
  const query = useQuery({
    queryKey: publishedDesignQueryKey,
    queryFn: () => getSettingByKey(DESIGN_PUBLISHED_KEY),
    staleTime: 30_000,
  });
  const raw = (query.data?.value ?? null) as { enabled?: boolean; concept?: unknown; publishedAt?: string; publishedBy?: string } | null;
  const design: PublishedDesign = {
    enabled: Boolean(raw?.enabled && raw?.concept),
    concept: mergeConcept(raw?.concept),
    publishedAt: raw?.publishedAt,
    publishedBy: raw?.publishedBy,
  };
  return { ...query, design };
}

/**
 * Injects the published design theme as CSS variables.
 * Renders nothing until an admin has explicitly published a concept.
 */
export function DesignThemeSync() {
  const { design } = usePublishedDesign();
  if (!design.enabled) return null;
  return <style id="design-theme-tokens" dangerouslySetInnerHTML={{ __html: themeCss(design.concept) }} />;
}
