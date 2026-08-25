import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTeamPublic } from "@/lib/db-public.functions";

export function TeamPreview() {
  const { data: team = [] } = useQuery({
    queryKey: ['team-public'],
    queryFn: getTeamPublic,
  });

  const featuredMembers = team.filter((m: any) => m.featured).slice(0, 4);
  const displayMembers = featuredMembers.length > 0 ? featuredMembers : team.slice(0, 4);

  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          <div className="lg:col-span-2 space-y-6">
            <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our People</span>
            <h2 className="text-4xl font-serif text-foreground leading-tight">Serving Together</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our worship ministry is made up of singers, musicians, technical volunteers, and servants who desire to use their gifts for God's glory.
            </p>
            <Link 
              to="/team" 
              className="inline-flex h-12 items-center justify-center bg-primary text-primary-foreground px-8 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:bg-primary/90"
            >
              Meet the Worship Team
            </Link>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-6">
            {displayMembers.map((member: any) => (
              <div key={member.id} className="group">
                <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
                  <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0" loading="lazy" decoding="async" />
                </div>
                <h4 className="font-serif text-lg">{member.full_name}</h4>
                <p className="text-[10px] tracking-[0.2em] text-accent uppercase">{member.primary_role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
