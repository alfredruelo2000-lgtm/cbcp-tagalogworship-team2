import { useEffect } from "react";
import { pickLogo, useBranding } from "@/lib/branding";

/** Applies published branding to the document: favicon, theme color, and optional palette. */
export function BrandingSync() {
  const { branding } = useBranding();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const favicon = pickLogo(branding, "favicon");
    for (const rel of ["icon", "apple-touch-icon"]) {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = favicon;
    }

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = branding.palette.navy;

    const root = document.documentElement;
    if (branding.palette.applyToSite) {
      root.style.setProperty("--color-primary", branding.palette.navy);
      root.style.setProperty("--color-accent", branding.palette.gold);
    } else {
      root.style.removeProperty("--color-primary");
      root.style.removeProperty("--color-accent");
    }
  }, [branding]);

  return null;
}
