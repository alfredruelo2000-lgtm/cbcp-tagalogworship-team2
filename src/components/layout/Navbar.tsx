import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePublicSectionVisibility, type PublicSectionKey } from "@/lib/public-section-visibility";
import logoAsset from "@/assets/cbcp-logo.png.asset.json";


const navLinks: Array<{ label: string; to: string; section?: PublicSectionKey }> = [
  { label: "HOME", to: "/" },
  { label: "WORSHIP", to: "/worship", section: "worship" },
  { label: "SONGS", to: "/songs", section: "songs" },
  { label: "SETLISTS", to: "/setlists", section: "setlists" },
  { label: "TEAM", to: "/team", section: "team" },
  { label: "RESOURCES", to: "/resources", section: "resources" },
  { label: "MEDIA", to: "/media", section: "media" },
  { label: "ABOUT", to: "/about", section: "about" },
  { label: "CONTACT", to: "/contact", section: "contact" },
];


export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isMinistryAdmin } = useAuth();
  const { isVisible } = usePublicSectionVisibility();
  const visibleNavLinks = navLinks.filter((link) => link.section === undefined || isVisible(link.section));

  return (

    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="CBCP Tagalog Worship Team" className="h-12 w-12 object-contain" />
          <span className="hidden font-serif text-lg font-semibold leading-tight text-foreground sm:block">
            CBCP <span className="text-accent">Tagalog</span><br />Worship Team
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          <div className="flex items-center gap-6">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[11px] font-bold tracking-[0.15em] text-muted-foreground transition-all duration-300 hover:text-foreground relative group py-2"
                activeProps={{ className: "text-foreground active-nav" }}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full [.active-nav_&]:w-full" />
              </Link>

            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" className="rounded-none border-foreground font-bold tracking-widest uppercase text-[10px]" asChild>
             <Link to={isMinistryAdmin ? "/dashboard" : "/login"}>{isMinistryAdmin ? "DASHBOARD" : "TEAM LOGIN"}</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="fixed inset-0 top-20 z-40 bg-background p-6 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-6">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between border-b border-border pb-4 text-sm font-bold tracking-widest text-foreground transition-colors active:text-accent"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <Button className="mt-4 w-full rounded-none font-bold tracking-widest uppercase" asChild>
               <Link to={isMinistryAdmin ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)}>{isMinistryAdmin ? "DASHBOARD" : "TEAM LOGIN"}</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
