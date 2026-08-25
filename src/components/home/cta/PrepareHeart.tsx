export function PrepareHeart() {
  return (
    <section className="py-32 px-6 bg-primary text-primary-foreground text-center overflow-hidden relative group">
      <div className="absolute inset-0 opacity-5 bg-[url('https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale" />
      <div className="mx-auto max-w-2xl space-y-12 relative z-10">
        <div className="space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Spiritual Preparation</span>
          <h2 className="text-4xl md:text-5xl font-serif">Prepare Your Heart</h2>
        </div>
        <p className="leading-relaxed opacity-90 text-lg font-light text-balance">
          Before we step onto a platform, pick up an instrument, or sing a note, we first come before God as humble worshippers, seeking His face above all else.
        </p>
        <div className="pt-12 border-t border-primary-foreground/20 italic">
          <blockquote className="space-y-4">
            <p className="text-2xl font-serif leading-tight text-balance">
              “Lord, make our worship pleasing to You. Give us humble hearts, faithful hands, and lives that point people to Jesus Christ.”
            </p>
            <footer className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase not-italic">— A Worshipper's Prayer</footer>
          </blockquote>
        </div>
      </div>
    </section>

  );
}
