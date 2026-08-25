import { useEffect, useState } from "react";
import logoAsset from "@/assets/cbcp-logo.png.asset.json";

export function BrandEntrance() {
  const [visible, setVisible] = useState(false);

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

  return (
    <div className="brand-entrance" role="status" aria-label="CBCP Tagalog Worship Team">
      <div className="brand-entrance__content">
        <img src={logoAsset.url} alt="CBCP Tagalog Worship Team logo" className="brand-entrance__logo" />
        <p className="brand-entrance__name">CBCP Tagalog Worship Team</p>
      </div>
    </div>
  );
}
