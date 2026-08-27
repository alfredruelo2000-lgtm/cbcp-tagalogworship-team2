import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMediaPublic, getMediaAlbumsPublic } from '@/lib/db-public.functions';
import { MediaGallery } from '@/components/media/MediaGallery';
import { FeaturedCollageBanner } from '@/components/media/FeaturedCollageBanner';
import { MediaItem } from '@/types/media';
import { Search, Camera, Video, Music, FileText, LayoutGrid } from 'lucide-react';

export const Route = createFileRoute('/_public/media')({
  head: () => ({
    meta: [
      { title: 'Worship Media | CBCP Tagalog Worship' },
      {
        name: 'description',
        content: 'Photos, videos, audio and ministry moments from the CBCP Tagalog worship team.',
      },
      { property: 'og:title', content: 'Worship Media | CBCP Tagalog Worship' },
      {
        property: 'og:description',
        content: 'Browse worship photos, videos and audio from our services, rehearsals and worship nights.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: MediaPage,
});

const FILTERS = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'Photo', label: 'Photos', icon: Camera },
  { id: 'Video', label: 'Videos', icon: Video },
  { id: 'Audio', label: 'Audio', icon: Music },
  { id: 'Document', label: 'Files', icon: FileText },
] as const;

function MediaPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['media-public'],
    queryFn: getMediaPublic,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ['media-albums-public'],
    queryFn: getMediaAlbumsPublic,
  });

  const items = useMemo<MediaItem[]>(
    () =>
      (media || []).map((item: any) => ({
        ...item,
        mediaType: item.media_type ?? item.mediaType,
        fileUrl: item.file_url ?? item.fileUrl,
        thumbnailUrl: item.thumbnail_url ?? item.thumbnailUrl,
        eventDate: item.event_date ?? item.created_at,
        albumId: item.album_id ?? undefined,
        tags: item.tags ?? [],
      })),
    [media],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (activeTab !== 'all' && item.mediaType !== activeTab) return false;
      if (albumId && item.albumId !== albumId) return false;
      if (!q) return true;
      return (
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, activeTab, albumId, searchQuery]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) map[item.mediaType] = (map[item.mediaType] ?? 0) + 1;
    return map;
  }, [items]);

  const featured = useMemo(
    () => items.filter((item) => item.featured && item.mediaType === 'Photo').slice(0, 6),
    [items],
  );


  return (
    <div className="min-h-screen bg-background">
      {/* Compact hero */}
      <header className="border-b border-accent/10 px-5 pb-6 pt-8 sm:px-6 sm:pb-10 sm:pt-14">
        <div className="mx-auto max-w-7xl space-y-2 text-center sm:space-y-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent">Media Library</span>
          <h1 className="font-serif leading-tight text-foreground text-[clamp(1.75rem,7vw,3rem)]">Worship Media</h1>
          <p className="mx-auto max-w-xl font-serif text-[13px] italic leading-relaxed text-muted-foreground sm:text-base">
            Moments from our services, rehearsals and worship nights.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-10">
        <FeaturedCollageBanner items={featured} />

        {/* Sticky toolbar */}
        <div className="sticky top-[3.25rem] z-30 -mx-3 mb-4 space-y-2.5 border-b border-accent/10 bg-background/95 px-3 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 sm:py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent/40" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH MEDIA..."
              className="h-9 w-full border border-accent/10 bg-muted/20 pl-9 pr-3 text-[10px] font-bold tracking-[0.15em] uppercase placeholder:text-accent/30 focus:border-accent/30 focus:outline-none"
            />
          </div>

          <div className="-mx-3 flex snap-x gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            {FILTERS.map((f) => {
              const isActive = activeTab === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(f.id)}
                  className={`flex shrink-0 snap-start items-center gap-1.5 border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-accent/10 text-muted-foreground hover:border-accent/30'
                  }`}
                >
                  <f.icon className="h-3 w-3" />
                  {f.label}
                  <span className="text-accent/50">{counts[f.id] ?? 0}</span>
                </button>
              );
            })}
          </div>

          {albums.length > 0 && (
            <div className="-mx-3 flex snap-x gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
              <button
                onClick={() => setAlbumId(null)}
                className={`shrink-0 snap-start border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                  albumId === null ? 'border-accent/40 text-accent' : 'border-accent/10 text-muted-foreground'
                }`}
              >
                All Albums
              </button>
              {(albums as any[]).map((album) => (
                <button
                  key={album.id}
                  onClick={() => setAlbumId(album.id === albumId ? null : album.id)}
                  className={`shrink-0 snap-start border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                    albumId === album.id ? 'border-accent/40 text-accent' : 'border-accent/10 text-muted-foreground'
                  }`}
                >
                  {album.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse border border-accent/5 bg-muted/30" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <MediaGallery items={filtered} />
        ) : (
          <div className="border border-dashed border-accent/10 px-6 py-16 text-center">
            <p className="font-serif text-base italic text-muted-foreground sm:text-lg">
              {items.length === 0 ? 'Media is being prepared. Check back soon.' : 'No media matches your filters.'}
            </p>
            {items.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  setAlbumId(null);
                }}
                className="mt-5 border-b border-accent/30 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
