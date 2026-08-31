import { previewVars, type DesignConcept } from "@/lib/design-studio";

export type PreviewSurface = "home" | "songs" | "viewer" | "setlist" | "admin" | "forms";
export type PreviewDevice = "mobile" | "tablet" | "desktop";

const DEVICE_WIDTH: Record<PreviewDevice, number> = { mobile: 390, tablet: 768, desktop: 1280 };

export const PREVIEW_SURFACES: Array<{ key: PreviewSurface; label: string }> = [
  { key: "home", label: "Home" },
  { key: "songs", label: "Song Library" },
  { key: "viewer", label: "Chord Viewer" },
  { key: "setlist", label: "Setlists" },
  { key: "admin", label: "Admin" },
  { key: "forms", label: "Forms" },
];

function shadow(concept: DesignConcept) {
  return concept.layout.shadow === "none" ? undefined : "var(--design-shadow)";
}

function buttonRadius(concept: DesignConcept) {
  const style = concept.layout.button;
  if (style === "pill") return 999;
  if (style === "square") return 0;
  return concept.layout.radius;
}

function Surface({ concept, surface }: { concept: DesignConcept; surface: PreviewSurface }) {
  const radius = concept.layout.radius;
  const pad = concept.layout.density === "compact" ? 10 : concept.layout.density === "spacious" ? 20 : 14;
  const cardStyle: React.CSSProperties = {
    background: "var(--card)",
    color: "var(--card-foreground)",
    borderRadius: radius,
    border: concept.layout.card === "flat" ? "none" : "1px solid var(--border)",
    boxShadow: concept.layout.card === "elevated" ? shadow(concept) : undefined,
    padding: pad,
  };
  const primaryBtn: React.CSSProperties = {
    background: concept.layout.button === "outline" ? "transparent" : "var(--primary)",
    color: concept.layout.button === "outline" ? "var(--primary)" : "var(--primary-foreground)",
    border: concept.layout.button === "outline" ? "1px solid var(--primary)" : "none",
    borderRadius: buttonRadius(concept),
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    minHeight: 44,
  };
  const accentBtn: React.CSSProperties = {
    ...primaryBtn,
    background: "var(--accent)",
    color: "var(--accent-foreground)",
    border: "none",
  };
  const heading: React.CSSProperties = { fontFamily: "var(--font-serif)", lineHeight: 1.15, margin: 0 };
  const muted: React.CSSProperties = { color: "var(--muted-foreground)", fontSize: 12, margin: 0 };

  const nav = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: `${pad}px ${pad + 2}px`,
        background:
          concept.layout.nav === "solid" ? "var(--primary)" : concept.layout.nav === "glass" ? "color-mix(in oklab, var(--card) 70%, transparent)" : "var(--background)",
        color: concept.layout.nav === "solid" ? "var(--primary-foreground)" : "var(--foreground)",
        borderBottom: concept.layout.nav === "bordered" ? "1px solid var(--border)" : "none",
        backdropFilter: concept.layout.nav === "glass" ? "blur(10px)" : undefined,
      }}
    >
      <span style={{ ...heading, fontSize: 14, fontWeight: 700 }}>CBCP Worship</span>
      <span style={{ display: "flex", gap: 12, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.9 }}>
        <span>Songs</span>
        <span>Setlists</span>
        <span style={{ color: "var(--accent)" }}>Team</span>
      </span>
    </div>
  );

  const body = () => {
    if (surface === "home") {
      return (
        <div style={{ display: "grid", gap: pad }}>
          <div
            style={{
              background: concept.layout.hero === "cinematic" ? "var(--primary)" : "var(--muted)",
              color: concept.layout.hero === "cinematic" ? "var(--primary-foreground)" : "var(--foreground)",
              borderRadius: radius,
              padding: concept.layout.hero === "compact" ? pad + 4 : pad + 18,
              filter: concept.layout.image === "soft" ? "saturate(0.92)" : undefined,
            }}
          >
            <p style={{ ...muted, color: "var(--accent)", letterSpacing: "0.24em", textTransform: "uppercase", fontSize: 10 }}>Tagalog Worship</p>
            <h2 style={{ ...heading, fontSize: concept.layout.hero === "compact" ? 24 : 32, marginTop: 8 }}>Sambahin ang Panginoon</h2>
            <p style={{ ...muted, marginTop: 8, color: concept.layout.hero === "cinematic" ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
              Chord sheets, setlists, and team schedules in one place.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: pad }}>
              <button style={accentBtn}>Explore Songs</button>
              <button style={{ ...primaryBtn, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)" }}>Join Team</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: pad }}>
            {["Worship", "Media", "Resources"].map((item) => (
              <div key={item} style={cardStyle}>
                <p style={{ ...heading, fontSize: 14 }}>{item}</p>
                <p style={muted}>Updated weekly</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (surface === "songs") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, overflow: "hidden" }}>
            {["All", "Tagalog", "English", "Hymns"].map((pill, index) => (
              <span
                key={pill}
                style={{
                  fontSize: 11,
                  padding: "8px 12px",
                  borderRadius: buttonRadius(concept),
                  background: index === 0 ? "var(--primary)" : "var(--muted)",
                  color: index === 0 ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                {pill}
              </span>
            ))}
          </div>
          {["Kay Buti-buti Mo", "Tanging Alay", "Salamat Panginoon", "Ikaw ang Aking Lakas"].map((title, index) => (
            <div key={title} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 10, minHeight: 56, padding: `8px ${pad}px` }}>
              <span style={{ width: 34, height: 34, borderRadius: radius, background: "var(--muted)", flexShrink: 0 }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{title}</span>
                <span style={{ display: "block", ...muted, fontSize: 11 }}>Key {["G", "D", "C", "A"][index]} · 72 BPM</span>
              </span>
              <span style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.14em" }}>OPEN</span>
            </div>
          ))}
        </div>
      );
    }
    if (surface === "viewer") {
      return (
        <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <h3 style={{ ...heading, fontSize: 18 }}>Tanging Alay</h3>
            <span style={{ fontSize: 10, padding: "6px 10px", borderRadius: buttonRadius(concept), background: "var(--muted)", color: "var(--muted-foreground)" }}>Key D</span>
          </div>
          <div style={{ fontFamily: "var(--design-font-chord)", fontSize: 13, lineHeight: 1.9 }}>
            <p style={{ margin: 0, color: "var(--accent)", fontSize: 11, letterSpacing: "0.18em" }}>[VERSE 1]</p>
            <p style={{ margin: 0 }}>
              <span style={{ color: "#d33" }}>D</span> Ang tanging alay ko <span style={{ color: "#d33" }}>A/C#</span> sa Iyo
            </p>
            <p style={{ margin: 0 }}>
              <span style={{ color: "#d33" }}>Bm</span> Ay buhay kong <span style={{ color: "#d33" }}>G</span> buo
            </p>
            <p style={{ margin: "8px 0 0", color: "var(--accent)", fontSize: 11, letterSpacing: "0.18em" }}>[BRIDGE]</p>
            <p style={{ margin: 0 }}>
              <span style={{ color: "#d33" }}>G</span> Ikaw lamang ang <span style={{ color: "#d33" }}>A</span> hangad ko
            </p>
          </div>
        </div>
      );
    }
    if (surface === "setlist") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              <span style={{ ...heading, fontSize: 15, display: "block" }}>Sunday Worship</span>
              <span style={{ ...muted, display: "block" }}>4 songs · 28 min</span>
            </span>
            <button style={accentBtn}>Plan</button>
          </div>
          {["Kay Buti-buti Mo — G", "Tanging Alay — D", "Salamat Panginoon — C"].map((row, index) => (
            <div key={row} style={{ ...cardStyle, display: "flex", gap: 10, alignItems: "center", minHeight: 52 }}>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)", width: 16 }}>{index + 1}</span>
              <span style={{ fontSize: 13 }}>{row}</span>
            </div>
          ))}
        </div>
      );
    }
    if (surface === "admin") {
      return (
        <div style={{ display: "flex", gap: pad }}>
          <div style={{ width: 120, background: "var(--sidebar)", color: "var(--sidebar-foreground)", borderRadius: radius, padding: pad, display: "grid", gap: 8, alignContent: "start" }}>
            {["Overview", "Songs", "Setlists", "Team", "Settings"].map((item, index) => (
              <span key={item} style={{ fontSize: 11, color: index === 0 ? "var(--accent)" : "var(--muted-foreground)" }}>{item}</span>
            ))}
          </div>
          <div style={{ flex: 1, display: "grid", gap: pad }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: pad }}>
              {[["Songs", "128"], ["Setlists", "24"], ["Members", "31"]].map(([label, value]) => (
                <div key={label} style={cardStyle}>
                  <p style={muted}>{label}</p>
                  <p style={{ ...heading, fontSize: 22 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <p style={{ ...heading, fontSize: 14 }}>Recent activity</p>
              <p style={muted}>Salamat Panginoon published · 5m ago</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...cardStyle, display: "grid", gap: 10 }}>
        <p style={{ ...heading, fontSize: 15 }}>Add Song</p>
        <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted-foreground)" }}>
          Title
          <input
            readOnly
            value="Tanging Alay"
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--input)",
              borderRadius: concept.layout.button === "pill" ? 999 : radius,
              padding: "10px 12px",
              fontSize: 13,
              minHeight: 44,
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 11, color: "var(--muted-foreground)" }}>
          Lyrics & chords
          <textarea
            readOnly
            value={"[Verse 1]\n[D]Ang tanging alay ko"}
            style={{
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--input)",
              borderRadius: radius,
              padding: "10px 12px",
              fontFamily: "var(--design-font-chord)",
              fontSize: 12,
              minHeight: 68,
              resize: "none",
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={primaryBtn}>Save</button>
          <button style={{ ...primaryBtn, background: "transparent", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}>
      {nav}
      <div style={{ padding: pad + 2 }}>{body()}</div>
    </div>
  );
}

/** Fully scoped preview — design tokens only apply inside this container. */
export default function DesignPreview({
  concept,
  mode,
  device,
  surface,
}: {
  concept: DesignConcept;
  mode: "light" | "dark";
  device: PreviewDevice;
  surface: PreviewSurface;
}) {
  const width = DEVICE_WIDTH[device];
  return (
    <div className="overflow-x-auto border border-accent/10 bg-muted/20 p-3">
      <div style={{ width, maxWidth: "100%" }}>
        <div style={previewVars(concept, mode) as React.CSSProperties} className="overflow-hidden">
          <Surface concept={concept} surface={surface} />
        </div>
      </div>
    </div>
  );
}
