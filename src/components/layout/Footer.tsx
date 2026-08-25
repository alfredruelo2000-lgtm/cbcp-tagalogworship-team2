import { Link } from "@tanstack/react-router";
import { Mail, Instagram, Youtube, Facebook } from "lucide-react";
import logoAsset from "@/assets/cbcp-logo.png.asset.json";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-foreground pt-32 pb-12 text-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoAsset.url} alt="CBCP Tagalog Worship Team" className="h-16 w-16 object-contain" />
              <span className="font-serif text-lg font-semibold leading-tight text-background">CBCP <span className="text-accent">Tagalog</span><br />Worship Team</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-background/60">
              A ministry dedicated to creating space for authentic encounters with God through music, prayer, and community.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-background/40 transition-colors hover:text-accent">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/40 transition-colors hover:text-accent">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-background/40 transition-colors hover:text-accent">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="mailto:contact@cbcpworship.org" className="text-background/40 transition-colors hover:text-accent">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Navigation</h4>
            <ul className="mt-6 space-y-4">
              {["Home", "Worship", "Songs", "Setlists", "Team"].map((item) => (
                <li key={item}>
                  <Link
                    to={item === "Home" ? "/" : (`/${item.toLowerCase()}` as any)}
                    className="text-sm text-background/60 transition-colors hover:text-background"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Resources</h4>
            <ul className="mt-6 space-y-4">
              {["Media Library", "Chord Charts", "Service Times", "About Us", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase().replace(" ", "-")}` as any}
                    className="text-sm text-background/60 transition-colors hover:text-background"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Scripture/Quote */}
          <div className="rounded-2xl border border-background/10 bg-background/5 p-8 lg:p-6">
            <blockquote className="space-y-4">
              <p className="font-serif text-lg italic text-background/90">
                "Let everything that has breath praise the LORD."
              </p>
              <footer className="text-xs font-bold tracking-widest text-accent uppercase">
                — Psalm 150:6
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 border-t border-background/10 pt-8 text-center lg:flex lg:items-center lg:justify-between lg:text-left">
          <p className="text-[10px] font-medium tracking-widest text-background/40 uppercase">
            © {currentYear} CBCP Tagalog Worship Team. All rights reserved.
          </p>
          <p className="mt-4 text-[10px] font-medium tracking-widest text-background/40 uppercase lg:mt-0">
            Excellence in Service • Devotion in Worship
          </p>
        </div>
      </div>
    </footer>
  );
}
