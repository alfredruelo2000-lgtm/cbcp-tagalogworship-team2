import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTeamPublic } from "@/lib/db-public.functions";
import { normalizeRole } from "@/lib/team-roles";


export function TeamPreview() {
  const { data: team = [] } = useQuery({
    queryKey: ['team-public'],
    queryFn: getTeamPublic,
  });

  const featuredMembers = team.filter((m: any) => m.featured).slice(0, 4);
  const displayMembers = featuredMembers.length > 0 ? featuredMembers : team.slice(0, 4);

  return (
    <section className="bg-muted/20 px-5 py-12 sm:px-6 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-16">
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Our People</span>
            <h2 className="font-serif leading-tight text-foreground text-[clamp(1.75rem,7vw,2.25rem)]">Serving Together</h2>
            <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
              Our worship ministry is made up of singers, musicians, technical volunteers, and servants who desire to use their gifts for God's glory.
            </p>
            <Link 
              to="/team" 
              className="inline-flex h-12 w-full items-center justify-center bg-primary px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground transition-all hover:bg-primary/90 sm:w-auto"
            >
              Meet the Worship Team
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:col-span-3">
            {displayMembers.map((member: any) => (
              <div key={member.id} className="group">
                <div className="mb-2.5 aspect-[4/5] overflow-hidden bg-muted sm:mb-4 sm:aspect-[3/4]">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.public_name || member.full_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
                  ) : (
                    <div className="grid h-full w-full place-items-center font-serif text-2xl text-accent">
                      {(member.public_name || member.full_name || '?').charAt(0)}
                    </div>
                  )}
                </div>
                <h4 className="truncate font-serif text-[0.95rem] sm:text-lg">{member.public_name || member.full_name}</h4>
                <p className="truncate text-[9px] uppercase tracking-[0.2em] text-accent sm:text-[10px]">{normalizeRole(member.primary_role)}</p>
              </div>

            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
