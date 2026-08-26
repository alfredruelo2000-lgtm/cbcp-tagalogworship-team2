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
    <section className="bg-background px-5 py-12 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-center sm:mb-14">
          <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Equipping</span>
          <h2 className="mt-3 font-serif text-foreground text-[clamp(1.6rem,6.5vw,2.25rem)]">Grow as a Worshipper</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-3">
          {displayResources.map((r: any) => (
            <Link 
              key={r.id} 
              to="/resources" 
              className="group block border border-accent/10 p-5 transition-all hover:border-accent/30 sm:p-8"
            >
              <h4 className="mb-2.5 font-serif text-xl transition-colors group-hover:text-accent sm:mb-4 sm:text-2xl">{r.title}</h4>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:mb-8">{r.description}</p>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent border-b border-accent/30 pb-0.5">Explore</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
