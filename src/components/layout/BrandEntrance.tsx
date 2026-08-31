import { useEffect, useState } from "react";
import { pickLogo, useBranding } from "@/lib/branding";

export function BrandEntrance() {
  const [visible, setVisible] = useState(false);
  const { branding } = useBranding();

  useEffect(() => {
    if (sessionStorage.getItem("cbcp-entrance-seen") === "1") return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem("cbcp-entrance-seen", "1");
      setVisible(false);
    }, 1900);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const { motion } = branding;
  const motionClass = motion.preset === "none" || !motion.autoplay ? "" : `brand-motion brand-motion--${motion.preset}`;

  return (
    <div className="brand-entrance" role="status" aria-label={branding.name}>
      <div className="brand-entrance__content">
        <img
          src={pickLogo(branding, "splash")}
          alt={`${branding.name} logo`}
          className={`brand-entrance__logo ${motionClass}`}
          style={{ animationDuration: `${motion.durationMs}ms` }}
        />
        <p className="brand-entrance__name">{branding.name}</p>
      </div>
    </div>
  );
}
