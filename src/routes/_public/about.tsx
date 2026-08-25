import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/about')({
  head: () => ({
    meta: [
      { title: "About Us | Radiant Worship" },
      { name: "description", content: "Learn about the mission, values, and heart of Radiant Worship Ministry as we serve the Church through music and prayer." },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="space-y-12">
        <header className="text-center space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our Heart</span>
          <h1 className="font-serif text-5xl">About Radiant Worship</h1>
        </header>
        
        <section className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Radiant Worship is a ministry committed to creating space for authentic encounters with God. We believe that worship is not merely a performance, but a lifestyle of obedience and adoration.
          </p>
          <p>
            Our mission is to serve the local Church by leading God's people in biblical, Christ-centered praise, developing skilled and humble worshippers, and stewarding the musical and creative gifts entrusted to us for His glory alone.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-8 py-12">
          <div className="p-8 border border-accent/10 bg-muted/20">
            <h3 className="font-serif text-xl mb-4">Our Mission</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To point people to Jesus Christ, foster a culture of genuine praise, and provide the Church with musical tools that exalt the Word of God.
            </p>
          </div>
          <div className="p-8 border border-accent/10 bg-muted/20">
            <h3 className="font-serif text-xl mb-4">Our Values</h3>
            <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
              <li>Biblical Integrity</li>
              <li>Christ-Centered Focus</li>
              <li>Community & Service</li>
              <li>Excellence in Craft</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  ),
});