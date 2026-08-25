import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/worship')({
  head: () => ({
    meta: [
      { title: "Our Worship Heart | Radiant Worship" },
      { name: "description", content: "Discover what worship means to us and how we gather as a body of Christ to exalt His name." },
      { property: "og:title", content: "Our Worship Heart | Radiant Worship" },
      { property: "og:description", content: "Discover what worship means to us and how we gather as a body of Christ to exalt His name." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-6 py-24 max-w-4xl">
      <div className="space-y-12">
        <header className="text-center space-y-4">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Worship Ministry</span>
          <h1 className="font-serif text-5xl">Worship Him</h1>
        </header>
        
        <section className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            Worship is the core of our ministry. We gather not just to sing, but to respond to the greatness and holiness of God. 
            Our worship is rooted in the truth of Scripture and fueled by the grace of Jesus Christ.
          </p>
          <div className="bg-primary/5 p-8 border-l-2 border-accent italic font-serif text-xl text-foreground/80">
            "God is spirit, and those who worship him must worship in spirit and truth." — John 4:24
          </div>
        </section>
      </div>
    </div>
  ),
})

