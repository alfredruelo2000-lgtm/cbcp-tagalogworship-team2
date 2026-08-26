import { Link } from "@tanstack/react-router";

export function JoinCTA() {
  return (
    <section className="bg-background px-5 py-14 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 font-serif text-balance text-foreground text-[clamp(1.75rem,7.5vw,3rem)] sm:mb-8">Use Your Gifts to Serve the Body of Christ</h2>
        <p className="mx-auto mb-8 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground sm:mb-12 sm:text-lg">
          Whether you sing, play an instrument, serve in sound, multimedia, or simply have a heart for worship, there is a place for you to serve God's people.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-6">
          <Link to="/contact" className="flex h-12 items-center justify-center bg-foreground px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-background transition-all hover:bg-foreground/90 sm:h-14 sm:px-10">Join the Worship Team</Link>
          <Link to="/about" className="flex h-12 items-center justify-center border border-foreground px-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-foreground hover:text-background sm:h-14 sm:px-10">Learn More</Link>
        </div>
      </div>

    </section>
  );
}
