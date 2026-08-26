export function CoreValues() {
  const values = [
    {
      title: "Christ-Centered",
      description: "Everything begins and ends with Jesus Christ."
    },
    {
      title: "Biblically Grounded",
      description: "Our songs, leadership, and ministry must agree with Scripture."
    },
    {
      title: "Spiritually Authentic",
      description: "Worship comes from genuine hearts, not performance."
    },
    {
      title: "Excellence in Service",
      description: "We prepare and serve faithfully because God deserves our best."
    }
  ];

  return (
    <section className="bg-muted/20 px-5 py-12 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-3 text-center sm:mb-14">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our Foundation</span>
          <h2 className="font-serif text-foreground text-[clamp(1.75rem,7vw,2.25rem)]">What Shapes Our Worship</h2>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-12">
          {values.map((value, index) => (
            <div 
              key={value.title} 
              className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mb-4 h-px w-12 bg-accent/30 transition-all duration-500 group-hover:w-full sm:mb-6" />
              <h3 className="mb-2 font-serif text-lg text-foreground sm:mb-3 sm:text-xl">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
