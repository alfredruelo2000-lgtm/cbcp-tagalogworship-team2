import { Link } from "@tanstack/react-router";
import { Mail, Instagram, Youtube, Facebook, ChevronDown } from "lucide-react";
import { pickLogo, useBranding } from "@/lib/branding";

const NAV_LINKS = ["Home", "Worship", "Songs", "Setlists", "Team"];
const RESOURCE_LINKS = ["Media Library", "Chord Charts", "Service Times", "About Us", "Contact"];

const navTo = (item: string) => (item === "Home" ? "/" : `/${item.toLowerCase()}`);
const resourceTo = (item: string) => `/${item.toLowerCase().replace(" ", "-")}`;

function LinkList({ items, to }: { items: string[]; to: (item: string) => string }) {
  return (
    <ul className="space-y-1 lg:mt-6 lg:space-y-4">
      {items.map((item) => (
        <li key={item}>
          <Link
            to={to(item) as any}
            className="flex min-h-[44px] items-center text-sm text-background/60 transition-colors hover:text-background lg:min-h-0"
          >
            {item}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Minimal one-line footer for practice surfaces (Songs, Setlists) — keeps the screen for content. */
export function MiniFooter() {
  return (
    <footer className="w-full border-t border-accent/10 bg-background px-4 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        “Let everything that has breath praise the LORD.” — Psalm 150:6
      </p>
    </footer>
  );
}


export function Footer() {
  const currentYear = new Date().getFullYear();
  const { branding } = useBranding();

  return (
    <footer className="w-full border-t border-border bg-foreground pb-6 pt-8 text-background lg:pb-12 lg:pt-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-3 lg:space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={pickLogo(branding, "light")} alt={branding.name} loading="lazy" decoding="async" className="h-10 w-10 object-contain lg:h-16 lg:w-16" />
              <span className="font-serif text-sm font-semibold leading-tight text-background lg:text-lg">CBCP <span className="text-accent">Tagalog</span><br />Worship Team</span>
            </Link>
            <p className="hidden max-w-xs text-sm leading-relaxed text-background/60 sm:block">
              A ministry dedicated to creating space for authentic encounters with God through music, prayer, and community.
            </p>
            <div className="flex items-center gap-1 lg:gap-4">
              <a href="#" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center text-background/40 transition-colors hover:text-accent lg:h-auto lg:w-auto"><Instagram className="h-5 w-5" /></a>
              <a href="#" aria-label="YouTube" className="flex h-11 w-11 items-center justify-center text-background/40 transition-colors hover:text-accent lg:h-auto lg:w-auto"><Youtube className="h-5 w-5" /></a>
              <a href="#" aria-label="Facebook" className="flex h-11 w-11 items-center justify-center text-background/40 transition-colors hover:text-accent lg:h-auto lg:w-auto"><Facebook className="h-5 w-5" /></a>
              <a href="mailto:contact@cbcpworship.org" aria-label="Email us" className="flex h-11 w-11 items-center justify-center text-background/40 transition-colors hover:text-accent lg:h-auto lg:w-auto"><Mail className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Navigation — collapsible on phones, open column on desktop */}
          <details className="group border-t border-background/10 lg:border-0">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-accent lg:pointer-events-none lg:min-h-0">
              Navigation
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 lg:hidden" aria-hidden="true" />
            </summary>
            <LinkList items={NAV_LINKS} to={navTo} />
          </details>

          {/* Resources */}
          <details className="group border-t border-background/10 lg:border-0">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-accent lg:pointer-events-none lg:min-h-0">
              Resources
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 lg:hidden" aria-hidden="true" />
            </summary>
            <LinkList items={RESOURCE_LINKS} to={resourceTo} />
          </details>

          {/* Scripture/Quote — desktop only to keep phones compact */}
          <div className="hidden rounded-2xl border border-background/10 bg-background/5 p-8 lg:block lg:p-6">
            <blockquote className="space-y-4">
              <p className="font-serif text-lg italic text-background/90">
                "Let everything that has breath praise the LORD."
              </p>
              <footer className="text-xs font-bold uppercase tracking-widest text-accent">
                — Psalm 150:6
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 border-t border-background/10 pt-4 text-center lg:mt-20 lg:flex lg:items-center lg:justify-between lg:pt-8 lg:text-left">
          <p className="text-[9px] font-medium uppercase tracking-widest text-background/40 lg:text-[10px]">
            © {currentYear} CBCP Tagalog Worship Team. All rights reserved.
          </p>
          <p className="mt-2 hidden text-[10px] font-medium uppercase tracking-widest text-background/40 sm:block lg:mt-0">
            Excellence in Service • Devotion in Worship
          </p>
        </div>
      </div>
    </footer>
  );
}
