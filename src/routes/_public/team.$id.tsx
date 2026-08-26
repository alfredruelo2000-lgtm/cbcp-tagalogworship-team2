import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTeamMemberPublic } from '@/lib/db-public.functions';
import { initials, memberDisplayName, normalizeRole } from '@/lib/team-roles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Music, Mic2, Calendar } from 'lucide-react';

export const Route = createFileRoute('/_public/team/$id')({
  component: MemberProfilePage,
  head: () => ({
    meta: [
      { title: 'Team Member — Worship Ministry Profile' },
      { name: 'description', content: 'Profile of a member serving in our worship ministry.' },
      { property: 'og:title', content: 'Team Member — Worship Ministry Profile' },
      { property: 'og:description', content: 'Profile of a member serving in our worship ministry.' },
      { property: 'og:type', content: 'profile' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
});

function MemberProfilePage() {
  const { id } = Route.useParams();

  const { data: member, isPending } = useQuery({
    queryKey: ['team-public', 'member', id],
    queryFn: () => getTeamMemberPublic(id),
  });

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-3 w-24 animate-pulse bg-muted" />
        <div className="mt-6 flex gap-4">
          <div className="h-24 w-24 animate-pulse bg-muted sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-5 w-2/3 animate-pulse bg-muted" />
            <div className="h-3 w-1/3 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Profile not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">This member is not part of the public directory.</p>
        <Button asChild variant="outline" className="mt-6 rounded-none text-[10px] font-bold uppercase tracking-widest">
          <Link to="/team">Back to directory</Link>
        </Button>
      </div>
    );
  }

  const name = memberDisplayName(member as any);
  const role = normalizeRole((member as any).primary_role);
  const skills: string[] = (member as any).skills ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <Link
        to="/team"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent"
      >
        <ArrowLeft className="h-3 w-3" /> Back to team
      </Link>

      <header className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-b border-accent/10 pb-6">
        <div className="h-24 w-24 shrink-0 overflow-hidden bg-accent/10 sm:h-32 sm:w-32">
          {(member as any).avatar_url ? (
            <img
              src={(member as any).avatar_url}
              alt={name}
              className="h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="grid h-full w-full place-items-center font-serif text-3xl text-accent">
              {initials(name)}
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-1.5">
          <h1 className="truncate font-serif text-2xl leading-tight text-foreground sm:text-4xl">{name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{role}</p>
          {(member as any).instrument && (
            <p className="truncate text-xs text-muted-foreground">{(member as any).instrument}</p>
          )}
        </div>
      </header>

      <div className="mt-6 space-y-8">
        {(member as any).bio && (
          <section className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">About</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{(member as any).bio}</p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(member as any).instrument && (
            <InfoRow icon={<Music className="h-3.5 w-3.5 text-accent" />} label="Instrument" value={(member as any).instrument} />
          )}
          {(member as any).vocal_range && (
            <InfoRow icon={<Mic2 className="h-3.5 w-3.5 text-accent" />} label="Vocal range" value={(member as any).vocal_range} />
          )}
          {((member as any).date_joined || (member as any).created_at) && (
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5 text-accent" />}
              label="Serving since"
              value={new Date((member as any).date_joined || (member as any).created_at).toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            />
          )}
          {(member as any).show_public_contact && (member as any).email && (
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5 text-accent" />}
              label="Contact"
              value={(member as any).email}
              href={`mailto:${(member as any).email}`}
            />
          )}
        </section>

        {skills.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="rounded-none border-accent/15 text-[9px] uppercase tracking-widest text-muted-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex min-w-0 items-center gap-3 border border-accent/5 bg-muted/10 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition-colors hover:border-accent/20">
      {content}
    </a>
  ) : (
    content
  );
}
