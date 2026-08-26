import { Link } from "@tanstack/react-router";

export function HeroSection({
  title,
  subtitle,
  tagline,
  primaryCtaText,
  primaryCtaTo,
  secondaryCtaText,
  secondaryCtaTo,
  imageSrc,
  variant = "split",
}: {
  title: React.ReactNode;
  subtitle?: string;
  tagline?: string;
  primaryCtaText?: string;
  primaryCtaTo?: string;
  secondaryCtaText?: string;
  secondaryCtaTo?: string;
  imageSrc?: string;
  variant?: "split" | "full";
}) {
  if (variant === "full") {
    return (
      <section className="relative flex min-h-[62vh] w-full items-center overflow-hidden py-16 sm:min-h-[70vh] lg:h-[86vh] lg:min-h-[600px] lg:py-0">
        {imageSrc && (
          <div className="absolute inset-0 z-0">
            <img
              src={imageSrc}
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/60 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/60" />
          </div>
        )}
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 text-center text-primary-foreground sm:px-6">
          {tagline && (
            <span className="mb-4 inline-block text-[9px] font-bold tracking-[0.35em] text-accent uppercase animate-in fade-in slide-in-from-bottom-4 duration-700 sm:mb-6 sm:text-[10px] sm:tracking-[0.4em]">
              {tagline}
            </span>
          )}
          <h1 className="font-serif font-normal leading-[1.08] tracking-tight text-[clamp(2.1rem,9vw,4rem)] md:text-7xl lg:text-8xl animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-[0.95rem] leading-relaxed opacity-90 sm:mt-8 sm:text-lg md:text-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              {subtitle}
            </p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
            {primaryCtaText && (
              <Link
                to={primaryCtaTo as any}
                className="inline-flex h-12 w-full items-center justify-center bg-accent px-8 text-[10px] font-bold tracking-[0.2em] text-accent-foreground uppercase shadow-lg transition-all hover:bg-accent/90 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:hover:scale-105"
              >
                {primaryCtaText}
              </Link>
            )}
            {secondaryCtaText && (
              <Link
                to={secondaryCtaTo as any}
                className="inline-flex h-12 w-full items-center justify-center border border-primary-foreground/30 bg-white/10 px-8 text-[10px] font-bold tracking-[0.2em] text-primary-foreground uppercase backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:hover:scale-105"
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-background px-6 pt-24 pb-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative z-10 flex flex-col items-start">
            {tagline && (
              <span className="mb-6 inline-block text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
                {tagline}
              </span>
            )}
            <h1 className="font-serif text-5xl font-normal leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            )}
            <div className="mt-12 flex flex-wrap gap-4">
              {primaryCtaText && (
                <Link
                  to={primaryCtaTo as any}
                  className="inline-flex h-12 items-center justify-center bg-primary px-8 text-[10px] font-bold tracking-[0.2em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
                >
                  {primaryCtaText}
                </Link>
              )}
              {secondaryCtaText && (
                <Link
                  to={secondaryCtaTo as any}
                  className="inline-flex h-12 items-center justify-center border border-foreground bg-transparent px-8 text-[10px] font-bold tracking-[0.2em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
                >
                  {secondaryCtaText}
                </Link>
              )}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] w-full overflow-hidden bg-muted lg:aspect-[3/4]">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Worship focus"
                  className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/50">
                   <span className="font-serif italic text-muted-foreground/30">Radiant Worship</span>
                </div>
              )}
            </div>
            {/* Aesthetic decorative element */}
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 border border-accent/20 lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
