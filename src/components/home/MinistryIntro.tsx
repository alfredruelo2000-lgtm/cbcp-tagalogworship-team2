import { Link } from "@tanstack/react-router";

export function MinistryIntro() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="space-y-4">
              <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our Purpose</span>
              <h2 className="text-4xl md:text-5xl font-serif text-foreground leading-tight">More Than Music</h2>
            </div>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Worship is more than singing songs. It is our response to who God is and what He has done through Jesus Christ.
              </p>
              <p>
                Our Praise & Worship Ministry exists to serve the Church, lead God's people in biblical worship, develop faithful worshippers, and use every gift for the glory of Christ.
              </p>
            </div>

            <blockquote className="pt-6 border-t border-accent/20">
              <p className="font-serif italic text-xl text-foreground/80">
                “Oh come, let us worship and bow down; let us kneel before the LORD, our Maker!”
              </p>
              <footer className="mt-4 text-[10px] font-bold tracking-[0.2em] text-accent uppercase">
                — Psalm 95:6
              </footer>
            </blockquote>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <img 
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop" 
                alt="Worship Ministry" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-accent/30 -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
