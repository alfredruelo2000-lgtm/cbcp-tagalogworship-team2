import { useState, useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTeamPublic } from '@/lib/db-public.functions';
import { ROLE_SORT_WEIGHT, initials, memberDisplayName, normalizeRole } from '@/lib/team-roles';
import { Search, X, ChevronRight, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_public/team/')({
  component: TeamDirectoryPage,
  head: () => ({
    meta: [
      { title: 'Worship Team — Ministry Personnel Directory' },
      {
        name: 'description',
        content:
          'Meet the worship leaders, vocalists, musicians and multimedia volunteers serving in our worship ministry.',
      },
      { property: 'og:title', content: 'Worship Team — Ministry Personnel Directory' },
      {
        property: 'og:description',
        content: 'Meet the leaders, vocalists, musicians and multimedia volunteers of our worship ministry.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
});

function TeamDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: team = [], isPending } = useQuery({
    queryKey: ['team-public'],
    queryFn: () => getTeamPublic(),
  });

  const members = useMemo(
    () =>
      (team as any[])
        .map((m) => ({ ...m, role: normalizeRole(m.primary_role), name: memberDisplayName(m) }))
        .sort((a, b) => {
          const orderA = a.display_order ?? 999;
          const orderB = b.display_order ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          const weight = (ROLE_SORT_WEIGHT[a.role] ?? 9) - (ROLE_SORT_WEIGHT[b.role] ?? 9);
          return weight !== 0 ? weight : a.name.localeCompare(b.name);
        }),
    [team],
  );

  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) counts.set(m.role, (counts.get(m.role) ?? 0) + 1);
    return Array.from(counts.entries()).sort(
      (a, b) => (ROLE_SORT_WEIGHT[a[0]] ?? 9) - (ROLE_SORT_WEIGHT[b[0]] ?? 9),
    );
  }, [members]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      const haystack = [m.name, m.role, m.instrument, ...(m.skills ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [members, searchQuery, roleFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Ministry Personnel</p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">Worship Team</h1>
        <p className="max-w-xl text-xs text-muted-foreground sm:text-sm">
          Those who serve with their gifts in the house of the Lord.
        </p>
      </header>

      {/* Sticky toolbar */}
      <div className="sticky top-[52px] z-20 -mx-4 mt-6 border-b border-accent/10 bg-background/95 px-4 py-3 backdrop-blur sm:top-[60px] sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, role or instrument"
            className="h-10 rounded-none border-accent/10 bg-muted/20 pl-9 pr-9 text-sm focus-visible:ring-accent"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Role pills — horizontally scrollable on mobile */}
        <div className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <RolePill active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} label="All" count={members.length} />
          {roleCounts.map(([role, count]) => (
            <RolePill
              key={role}
              active={roleFilter === role}
              onClick={() => setRoleFilter(role)}
              label={role}
              count={count}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      {isPending ? (
        <ul className="mt-4 divide-y divide-accent/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <div className="h-14 w-14 shrink-0 animate-pulse bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/5 animate-pulse bg-muted" />
                <div className="h-2 w-1/4 animate-pulse bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="mt-8 border border-dashed border-accent/10 bg-muted/10 py-16 text-center">
          <p className="font-serif text-lg italic text-muted-foreground">No team members match your search.</p>
          <button
            type="button"
            className="mt-3 text-[10px] font-bold uppercase tracking-widest text-accent"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Compact list (mobile) */}
          <ul className="mt-2 divide-y divide-accent/5 sm:hidden">
            {filtered.map((member) => (
              <li key={member.id}>
                <Link
                  to="/team/$id"
                  params={{ id: member.id }}
                  className="flex items-center gap-3 py-3 active:bg-muted/30"
                >
                  <Avatar member={member} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base leading-tight text-foreground">{member.name}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-accent">
                      {member.role}
                    </p>
                    {member.instrument && (
                      <p className="truncate text-[10px] text-muted-foreground">{member.instrument}</p>
                    )}
                  </div>
                  {member.featured && <Star className="h-3 w-3 shrink-0 fill-accent text-accent" />}
                  <ChevronRight className="h-4 w-4 shrink-0 text-accent/30" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Card grid (tablet / desktop) */}
          <div className="mt-6 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member) => (
              <Link
                key={member.id}
                to="/team/$id"
                params={{ id: member.id }}
                className="group block border border-accent/5 bg-muted/10 transition-all hover:border-accent/20 hover:shadow-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <Avatar member={member} className="h-full w-full" rounded={false} />
                  {member.featured && (
                    <span className="absolute right-2 top-2 bg-background/80 p-1 backdrop-blur">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <h3 className="truncate font-serif text-lg text-foreground transition-colors group-hover:text-accent">
                    {member.name}
                  </h3>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{member.role}</p>
                  {member.instrument && (
                    <p className="truncate text-[11px] text-muted-foreground">{member.instrument}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RolePill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 snap-start whitespace-nowrap border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
        active
          ? 'border-accent bg-accent text-primary'
          : 'border-accent/15 bg-muted/20 text-muted-foreground hover:text-accent',
      )}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function Avatar({
  member,
  className,
  rounded = true,
}: {
  member: { avatar_url?: string | null; name: string };
  className?: string;
  rounded?: boolean;
}) {
  if (!member.avatar_url) {
    return (
      <div
        className={cn(
          'grid shrink-0 place-items-center bg-accent/10 font-serif text-accent',
          rounded ? 'rounded-sm' : '',
          className,
        )}
      >
        {initials(member.name)}
      </div>
    );
  }
  return (
    <img
      src={member.avatar_url}
      alt={member.name}
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 object-cover transition-transform duration-500 group-hover:scale-105', className)}
    />
  );
}
