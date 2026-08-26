import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSongsPublic } from '@/lib/db-public.functions';
import { SongCard } from '@/components/ui/songs/SongCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, LayoutGrid, List, Filter, Music } from 'lucide-react';
import { createFileRoute } from '@tanstack/react-router';
import { useIsMobile } from '@/hooks/use-mobile';
import { songKeys } from '@/lib/song-data';

type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'most-used' | 'artist';
type ViewMode = 'grid' | 'list';
type GroupMode = 'none' | 'language' | 'alphabetical';
const languages = ['All', 'Tagalog', 'English', 'Taglish', 'Other'] as const;
const displayLanguage = (value?: string) => value === 'Filipino/Tagalog' ? 'Tagalog' : value === 'Cebuano/Bisaya' ? 'Other' : value || 'Unclassified';

export const Route = createFileRoute('/_public/songs/')({
  head: () => ({ meta: [
    { title: 'Worship Song Library | CBCP Tagalog Worship Team' },
    { name: 'description', content: 'Browse the CBCP Tagalog Worship Team worship song library by language, theme, key, and title.' },
    { property: 'og:title', content: 'Worship Song Library | CBCP Tagalog Worship Team' },
    { property: 'og:description', content: 'Browse worship songs, lyrics, and chord charts from CBCP Tagalog Worship Team.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]}),
  component: SongLibraryPage,
});

function SongLibraryPage() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewTouched, setViewTouched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');
  const [groupBy, setGroupBy] = useState<GroupMode>('none');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [themeFilter, setThemeFilter] = useState('All');
  const [keyFilter, setKeyFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!viewTouched) setViewMode('list'); }, [isMobile, viewTouched]);
  const pickView = (mode: ViewMode) => { setViewTouched(true); setViewMode(mode); };
  const { data: songs = [], isLoading } = useQuery({ queryKey: songKeys.publicList, queryFn: getSongsPublic });
  const allThemes = useMemo(() => ['All', ...Array.from(new Set(songs.flatMap((s: any) => s.themes || []))).sort()], [songs]);
  const allKeys = useMemo(() => ['All', ...Array.from(new Set(songs.map((s: any) => s.defaultKey).filter(Boolean))).sort()], [songs]);
  const counts = useMemo(() => Object.fromEntries(languages.map((lang) => [lang, lang === 'All' ? songs.length : songs.filter((s: any) => displayLanguage(s.language) === lang).length])), [songs]);
  const filteredSongs = useMemo(() => songs.filter((song: any) => {
    const haystack = [song.title, song.artist, song.songwriter, song.language, displayLanguage(song.language), ...(song.themes || []), song.lyrics, ...(song.scriptureReferences || []).map((r: any) => typeof r === 'string' ? r : r.reference)].filter(Boolean).join(' ').toLowerCase(); 
    return haystack.includes(search.toLowerCase()) && (languageFilter === 'All' || displayLanguage(song.language) === languageFilter) && (themeFilter === 'All' || (song.themes || []).includes(themeFilter)) && (keyFilter === 'All' || song.defaultKey === keyFilter);
  }).sort((a: any, b: any) => sortBy === 'title-desc' ? b.title.localeCompare(a.title) : sortBy === 'recent' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : sortBy === 'most-used' ? (b.usageCount || 0) - (a.usageCount || 0) : sortBy === 'artist' ? (a.artist || '').localeCompare(b.artist || '') || a.title.localeCompare(b.title) : a.title.localeCompare(b.title)), [songs, search, languageFilter, themeFilter, keyFilter, sortBy]);
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', songs: filteredSongs }];
    const map = new Map<string, any[]>();
    filteredSongs.forEach((song: any) => { const label = groupBy === 'language' ? displayLanguage(song.language) : (song.title?.charAt(0) || '#').toUpperCase(); map.set(label, [...(map.get(label) || []), song]); });
    return Array.from(map, ([label, items]) => ({ label, songs: items })).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredSongs, groupBy]);
  const letters = Array.from(new Set(songs.map((s: any) => (s.title?.charAt(0) || '#').toUpperCase()))).sort();
  const reset = () => { setSearch(''); setLanguageFilter('All'); setThemeFilter('All'); setKeyFilter('All'); setSortBy('title-asc'); };
  return <main className="container mx-auto px-4 sm:px-6 pb-16 pt-5 md:py-14">
    <header className="mx-auto mb-4 max-w-4xl text-center md:mb-9">
      <h1 className="mb-1.5 font-serif text-[26px] leading-tight text-foreground sm:text-4xl lg:text-6xl md:mb-4">Worship Song Library</h1>
      <p className="hidden text-sm text-muted-foreground sm:block sm:text-lg">Songs we use to lead the Church in biblical, Christ-centered worship.</p>
      <p className="text-xs text-muted-foreground sm:hidden">Christ-centered worship, ready to lead.</p>
    </header>
    <section className="sticky top-16 z-30 -mx-4 mb-5 border-b border-accent/10 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:top-20 md:mb-9 md:py-5" aria-label="Song library controls">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search songs" placeholder="Search songs..." className="h-11 rounded-none pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Button variant="outline" size="icon" aria-label="Toggle filters" className="h-11 w-11 shrink-0 rounded-none sm:w-auto sm:px-4" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Filters</span></Button>
        <div className="flex shrink-0 border border-accent/10"><Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-11 w-11 rounded-none" aria-label="Grid view" onClick={() => pickView('grid')}><LayoutGrid className="h-4 w-4" /></Button><Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-11 w-11 rounded-none" aria-label="List view" onClick={() => pickView('list')}><List className="h-4 w-4" /></Button></div>
      </div>
      <div className="scrollbar-none -mx-4 mt-2 flex snap-x gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter by language">{languages.map((lang) => (!mounted || lang === 'All' || (counts[lang] ?? 0) > 0) && (
        <button
          key={lang}
          role="tab"
          aria-selected={languageFilter === lang}
          onClick={() => setLanguageFilter(lang)}
          className={`h-8 shrink-0 snap-start whitespace-nowrap border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${languageFilter === lang ? 'border-accent bg-accent text-accent-foreground' : 'border-accent/15 bg-transparent text-muted-foreground hover:border-accent/40 hover:text-foreground'}`}
        >
          {lang}{mounted && <span className={`ml-1.5 font-normal tracking-normal ${languageFilter === lang ? 'opacity-80' : 'text-muted-foreground/70'}`}>{counts[lang] ?? 0}</span>}
        </button>
      ))}</div>
      {groupBy === 'alphabetical' && <nav className="flex flex-wrap gap-2 border-t border-accent/10 pt-3" aria-label="Alphabetical navigation">{letters.map((letter) => <a key={letter} href={`#song-group-${letter}`} className="text-xs font-bold text-accent hover:underline">{letter}</a>)}</nav>}
      {showFilters && <div className="mt-2 flex flex-wrap gap-3 border-t border-accent/10 pt-3 md:gap-4 md:pt-5"><label className="text-xs text-muted-foreground">Group by <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupMode)} className="ml-2 bg-muted/50 p-2 text-foreground"><option value="none">None</option><option value="language">Language</option><option value="alphabetical">Alphabetical</option></select></label><label className="text-xs text-muted-foreground">Sort <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="ml-2 bg-muted/50 p-2 text-foreground"><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="recent">Recently Added</option><option value="artist">Artist</option><option value="most-used">Most Used</option></select></label><label className="text-xs text-muted-foreground">Theme <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)} className="ml-2 bg-muted/50 p-2 text-foreground">{allThemes.map((v) => <option key={v}>{v}</option>)}</select></label><label className="text-xs text-muted-foreground">Key <select value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} className="ml-2 bg-muted/50 p-2 text-foreground">{allKeys.map((v) => <option key={v}>{v}</option>)}</select></label><Button variant="ghost" className="rounded-none text-accent" onClick={reset}>Reset</Button></div>}
    </section>
    {isLoading ? <div className="py-20 text-center text-muted-foreground">Loading repertoire…</div> : groups.map(({ label, songs: groupSongs }) => <section key={label || 'all'} id={label ? `song-group-${label}` : undefined} className={viewMode === 'list' ? 'mx-auto mb-7 max-w-3xl md:mb-12' : 'mb-7 md:mb-12'}><div className="mb-2 flex items-center justify-between md:mb-5">{label && <h2 className="font-serif text-xl text-foreground md:text-2xl">{label}</h2>}<span className="text-[11px] text-muted-foreground md:text-xs">{groupSongs.length} song{groupSongs.length === 1 ? '' : 's'}</span></div><div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'border-t border-accent/10'}>{groupSongs.map((song: any) => <SongCard key={song.id} song={song} viewMode={viewMode} />)}</div></section>)}
    {!isLoading && filteredSongs.length === 0 && <div className="py-16 text-center md:py-20"><Music className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" /><h2 className="font-serif text-2xl">No songs found</h2><p className="mt-2 text-sm text-muted-foreground">Try a different search or clear your filters.</p><Button variant="outline" className="mt-6 rounded-none" onClick={reset}>Clear filters</Button></div>}
  </main>;
}
