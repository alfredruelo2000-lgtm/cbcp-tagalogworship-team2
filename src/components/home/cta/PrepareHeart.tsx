export function PrepareHeart() {
  return (
    <section className="group relative overflow-hidden bg-primary px-5 py-14 text-center text-primary-foreground sm:px-6 sm:py-24 lg:py-28">
      <div className="absolute inset-0 opacity-5 bg-[url('https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale" />
      <div className="relative z-10 mx-auto max-w-2xl space-y-8 sm:space-y-12">
        <div className="space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Spiritual Preparation</span>
          <h2 className="font-serif text-[clamp(1.75rem,7.5vw,3rem)]">Prepare Your Heart</h2>
        </div>
        <p className="text-balance text-[0.95rem] font-light leading-relaxed opacity-90 sm:text-lg">
          Before we step onto a platform, pick up an instrument, or sing a note, we first come before God as humble worshippers, seeking His face above all else.
        </p>
        <div className="border-t border-primary-foreground/20 pt-8 italic sm:pt-12">
          <blockquote className="space-y-4">
            <p className="text-balance font-serif text-xl leading-tight sm:text-2xl">
              “Lord, make our worship pleasing to You. Give us humble hearts, faithful hands, and lives that point people to Jesus Christ.”
            </p>
            <footer className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase not-italic">— A Worshipper's Prayer</footer>
          </blockquote>
        </div>
      </div>
    </section>

  );
}
