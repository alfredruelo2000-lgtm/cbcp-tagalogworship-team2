import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePublicSectionVisibility } from "@/lib/public-section-visibility";
import logoAsset from "@/assets/cbcp-logo.png.asset.json";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { session, isMinistryAdmin } = useAuth();
  const showDashboard = Boolean(session);
  const { navItems } = usePublicSectionVisibility();

  return (
    <>
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setIsOpen(false)}>
          <img src={logoAsset.url} alt="CBCP Tagalog Worship Team" className="h-10 w-10 shrink-0 object-contain lg:h-12 lg:w-12" />
          <span className="hidden font-serif text-lg font-semibold leading-tight text-foreground sm:block">
            CBCP <span className="text-accent">Tagalog</span><br />Worship Team
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          <div className="flex items-center gap-6">
            {navItems.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                className="relative group py-2 text-[11px] font-bold tracking-[0.15em] text-muted-foreground transition-all duration-300 hover:text-foreground"
                activeProps={{ className: "text-foreground active-nav" }}
                activeOptions={{ exact: link.to === "/" }}
              >
                {link.label}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full [.active-nav_&]:w-full" />
              </Link>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" className="rounded-none border-foreground font-bold tracking-widest uppercase text-[10px]" asChild>
            <Link to={showDashboard ? "/dashboard" : "/login"}>{showDashboard ? "DASHBOARD" : "TEAM LOGIN"}</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="flex h-11 w-11 items-center justify-center text-foreground lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

    </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col overflow-y-auto overscroll-contain bg-background pb-[env(safe-area-inset-bottom)] lg:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col px-5 pb-8 pt-1">
            {navItems.map((link) => (
              <Link
                key={link.key}
                to={link.to}
                onClick={() => setIsOpen(false)}
                activeProps={{ className: "text-accent" }}
                activeOptions={{ exact: link.to === "/" }}
                className="flex min-h-[48px] items-center justify-between border-b border-border/60 text-[12px] font-bold tracking-[0.14em] text-foreground transition-colors active:bg-muted/40"
              >
                <span className="flex items-center gap-3">
                  <span className="h-4 w-px bg-transparent [.text-accent_&]:bg-accent" />
                  {link.label}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            <Button className="mt-5 h-12 w-full rounded-none font-bold uppercase tracking-widest" asChild>
              <Link to={showDashboard ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)}>
                {showDashboard ? "DASHBOARD" : "TEAM LOGIN"}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
