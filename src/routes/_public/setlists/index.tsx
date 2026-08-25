import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Calendar, ChevronRight, Filter, ListMusic, Music, Plus, Search, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSetlistAbilities, useSetlists } from '@/components/setlists/setlist-hooks';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import type { Setlist } from '@/lib/db-setlists.functions';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_public/setlists/')({
  head: () => ({ meta: [
    { title: 'Worship Setlists | CBCP Tagalog Worship Team' },
    { name: 'description', content: 'Plan worship setlists for services, rehearsals, and ministry gatherings — song order, keys, and leaders in one place.' },
    { property: 'og:title', content: 'Worship Setlists | CBCP Tagalog Worship Team' },
    { property: 'og:description', content: 'Service and rehearsal setlists with per-service keys and song order.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]}),
  component: SetlistsPage,
});

type TabKey = 'upcoming' | 'mine' | 'past' | 'archive';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'mine', label: 'Mine' },
  { key: 'past', label: 'Past' },
  { key: 'archive', label: 'Archive' },
];

const statusStyle = (status: string) =>
  status === 'Ready' ? 'border-green-500/30 bg-green-500/10 text-green-700'
  : status === 'Preparing' ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
  : status === 'Completed' ? 'border-blue-500/30 bg-blue-500/10 text-blue-700'
  : status === 'Archived' ? 'border-transparent bg-muted text-muted-foreground'
  : 'border-accent/30 bg-accent/10 text-accent';

const todayKey = () => new Date().toISOString().slice(0, 10);

function SetlistsPage() {
  const { data: setlists = [], isLoading, isError, refetch } = useSetlists();
  const { canCreate, user } = useSetlistAbilities();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<'date' | 'title'>('date');
  const [typeFilter, setTypeFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);

  const types = useMemo(() => ['All', ...Array.from(new Set(setlists.map((s) => s.service_type).filter(Boolean)))], [setlists]);

  const filtered = useMemo(() => {
    const today = todayKey();
    const q = search.trim().toLowerCase();
    const rows = setlists.filter((s) => {
      const archived = s.status === 'Archived';
      if (tab === 'archive' ? !archived : archived) return false;
      if (tab === 'upcoming' && s.service_date < today) return false;
      if (tab === 'past' && s.service_date >= today) return false;
      if (tab === 'mine' && (!user || s.owner_id !== user.id)) return false;
      if (typeFilter !== 'All' && s.service_type !== typeFilter) return false;
      if (!q) return true;
      return [s.title, s.theme, s.service_type, s.service_date].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
    return rows.sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : tab === 'upcoming'
          ? a.service_date.localeCompare(b.service_date)
          : b.service_date.localeCompare(a.service_date),
    );
  }, [setlists, tab, search, typeFilter, sort, user]);

  return (
    <main className="container mx-auto px-4 pb-14 pt-4 sm:px-6 md:pb-16 md:pt-10">
      <header className="mb-3 flex items-start justify-between gap-3 md:mb-6">
        <div className="min-w-0">
          <h1 className="font-serif text-[26px] leading-tight text-foreground sm:text-4xl lg:text-5xl">Worship Setlists</h1>
          <p className="mt-1 hidden text-sm text-muted-foreground sm:block md:text-base">
            Plan song order, keys, and flow for services, rehearsals, and ministry gatherings.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">Service &amp; rehearsal planning.</p>
        </div>
        {canCreate && (
          <Button className="h-11 shrink-0 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest sm:px-6" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Create Setlist</span><span className="sm:hidden sr-only">Create setlist</span>
          </Button>
        )}
      </header>

      <section className="sticky top-16 z-30 -mx-4 mb-3 border-b border-accent/10 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-20 md:mb-6" aria-label="Setlist controls">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search setlists" placeholder="Search title, theme, date…" className="h-11 rounded-none pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" aria-label="Toggle filters" aria-expanded={showFilters} className="h-11 w-11 shrink-0 rounded-none sm:w-auto sm:px-4" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        <div className="scrollbar-none -mx-4 mt-2 flex snap-x gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0" role="tablist" aria-label="Setlist views">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                'h-9 shrink-0 snap-start whitespace-nowrap border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors',
                tab === key ? 'border-accent bg-accent text-accent-foreground' : 'border-accent/15 text-muted-foreground hover:border-accent/40 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-accent/10 pt-2.5">
            <label className="text-xs text-muted-foreground">Service
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="ml-2 h-9 bg-muted/50 px-2 text-foreground">
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as 'date' | 'title')} className="ml-2 h-9 bg-muted/50 px-2 text-foreground">
                <option value="date">Date</option>
                <option value="title">A–Z</option>
              </select>
            </label>
          </div>
        )}
      </section>

      {isLoading ? (
        <ul className="mx-auto max-w-3xl divide-y divide-accent/10 border-y border-accent/10">
          {[0, 1, 2].map((i) => <li key={i} className="h-[68px] animate-pulse bg-muted/30" />)}
        </ul>
      ) : isError ? (
        <div className="mx-auto max-w-3xl border border-dashed border-accent/20 py-12 text-center">
          <p className="text-sm text-muted-foreground">We couldn’t load setlists right now.</p>
          <Button variant="outline" className="mt-4 h-11 rounded-none" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-3xl border border-dashed border-accent/20 px-4 py-12 text-center md:py-16">
          <ListMusic className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {tab === 'mine' && !user ? 'Sign in to build your own setlists.' : 'No setlists here yet.'}
          </p>
          {tab === 'mine' && !user
            ? <Button asChild variant="outline" className="mt-4 h-11 rounded-none"><Link to="/login">Sign in</Link></Button>
            : canCreate && <Button variant="outline" className="mt-4 h-11 rounded-none" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New setlist</Button>}
        </div>
      ) : (
        <ul className="mx-auto max-w-3xl divide-y divide-accent/10 border-y border-accent/10">
          {filtered.map((setlist: Setlist) => (
            <li key={setlist.id}>
              <Link
                to="/setlists/$id"
                params={{ id: setlist.id }}
                preload="intent"
                className="group flex min-h-[64px] items-center gap-3 px-1 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:px-2"
              >
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border border-accent/15 bg-primary/5 text-accent">
                  <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(setlist.service_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="font-serif text-base leading-none">{new Date(setlist.service_date).getDate()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate font-serif text-[15px] leading-snug text-foreground group-hover:text-accent sm:text-lg">{setlist.title}</h2>
                    {setlist.is_official
                      ? <span title="Official ministry setlist" className="shrink-0"><ShieldCheck className="h-3.5 w-3.5 text-accent" /></span>
                      : <span title="Personal setlist" className="shrink-0"><User className="h-3.5 w-3.5 text-muted-foreground/60" /></span>}
                  </div>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground sm:text-xs">
                    <span className="shrink-0">{(setlist.service_time || '').slice(0, 5)}</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-accent/30" />
                    <span className="shrink-0">{setlist.service_items.length} song{setlist.service_items.length === 1 ? '' : 's'}</span>
                    {setlist.theme ? <><span className="hidden h-1 w-1 shrink-0 rounded-full bg-accent/30 sm:inline-block" /><span className="hidden truncate sm:inline">{setlist.theme}</span></> : null}
                  </p>
                </div>

                <span className={cn('hidden shrink-0 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest min-[380px]:inline-block', statusStyle(setlist.status))}>
                  {setlist.status}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-accent/50 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mx-auto mt-4 flex max-w-3xl items-center gap-2 text-[11px] text-muted-foreground">
        <Music className="h-3.5 w-3.5 text-accent/60" /> Keys chosen inside a setlist stay with that setlist — the song library keeps its default key.
      </p>

      <SetlistFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
