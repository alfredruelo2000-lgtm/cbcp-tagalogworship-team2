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
    <section className="py-24 px-6 bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our Foundation</span>
          <h2 className="text-4xl font-serif text-foreground">What Shapes Our Worship</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {values.map((value, index) => (
            <div 
              key={value.title} 
              className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="mb-6 h-px w-12 bg-accent/30 group-hover:w-full transition-all duration-500" />
              <h3 className="text-xl font-serif mb-3 text-foreground">{value.title}</h3>
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
