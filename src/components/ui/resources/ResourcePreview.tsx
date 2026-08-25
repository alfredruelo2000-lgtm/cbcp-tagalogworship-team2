import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getResourcesPublic } from "@/lib/db-public.functions";

export function ResourcePreview() {
  const { data: resources = [] } = useQuery({
    queryKey: ['resources-public'],
    queryFn: getResourcesPublic,
  });

  const featuredResources = resources.filter((r: any) => r.featured).slice(0, 3);
  const displayResources = featuredResources.length > 0 ? featuredResources : resources.slice(0, 3);

  if (displayResources.length === 0) return null;

  return (
    <section className="py-24 px-6 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center mb-16">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Equipping</span>
          <h2 className="text-4xl font-serif text-foreground mt-4">Grow as a Worshipper</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayResources.map((r: any) => (
            <Link 
              key={r.id} 
              to="/resources" 
              className="p-8 border border-accent/10 hover:border-accent/30 transition-all group block"
            >
              <h4 className="font-serif text-2xl mb-4 group-hover:text-accent transition-colors">{r.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">{r.description}</p>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent border-b border-accent/30 pb-0.5">Explore</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
