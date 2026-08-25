import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMediaPublic } from '@/lib/db-public.functions';
import { supabase } from '@/integrations/supabase/client';
import { MediaGallery } from '@/components/media/MediaGallery';
import { MediaCard } from '@/components/media/MediaCard';
import { MediaItem, MediaType, MediaCategory } from '@/types/media';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Camera, Video, Music, FileText, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/_public/media')({
  head: () => ({
    meta: [
      { title: "Media Library | Radiant Worship" },
      { name: "description", content: "Browse photos, videos, and ministry moments that reflect the life and worship of our church community." },
    ],
  }),
  component: MediaPage,
});


function MediaPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: media = [] } = useQuery({
    queryKey: ['media-public'],
    queryFn: getMediaPublic,
  });

  const { data: albums = [] } = useQuery({
    queryKey: ['media-albums'],
    queryFn: async () => {
      const { data, error } = await supabase.from('media_albums' as any).select('*');
      if (error) throw error;
      return data;
    }
  });

  const filteredItems = useMemo(() => {
    return (media || []).map((item: any) => ({
      ...item,
      mediaType: item.media_type || item.mediaType,
      fileUrl: item.file_url || item.fileUrl,
      createdAt: item.created_at || item.createdAt,
      visibility: (item as any).visibility || 'Public'
    })).filter((item: any) => {
      const title = item.title || '';
      const tags = item.tags || [];
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const mediaType = item.mediaType;
      if (activeTab === 'all') return matchesSearch;
      if (activeTab === 'photos') return matchesSearch && mediaType === 'Photo';
      if (activeTab === 'videos') return matchesSearch && mediaType === 'Video';
      if (activeTab === 'audio') return matchesSearch && mediaType === 'Audio';
      if (activeTab === 'files') return matchesSearch && mediaType === 'Document';
      return matchesSearch;
    });
  }, [media, activeTab, searchQuery]);

  const featuredAlbums = albums.filter((a: any) => (a as any).featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative pt-32 pb-20 px-6 border-b border-accent/10">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="rounded-none border-accent/20 text-accent font-semibold tracking-widest text-[10px] uppercase">
            Media Library
          </Badge>
          <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-tight">
            Worship Media
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed italic font-serif text-lg">
            "Photos, videos, audio, and ministry moments that reflect the life and worship of our church community."
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 space-y-24">
        {/* Featured Albums Section */}
        {activeTab === 'all' && (
          <section className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">Ministry Moments</span>
                <h2 className="font-serif text-4xl">Featured Albums</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(featuredAlbums || []).map((album: any) => (
                <div key={album.id} className="group cursor-pointer space-y-6">
                  <div className="aspect-[4/5] overflow-hidden border border-accent/10 relative">
                    <img 
                      src={album.cover_image_url || album.coverImageUrl} 
                      alt={album.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-6 right-6">
                      <Badge className="rounded-none bg-accent text-primary text-[8px] font-bold uppercase tracking-widest">
                        {album.media_count || album.mediaCount || 0} Items
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-widest">{album.category}</span>
                    <h3 className="font-serif text-2xl group-hover:text-accent transition-colors">{album.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{album.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Media Explorer */}
        <section className="space-y-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-accent/10 pb-12">
            <Tabs defaultValue="all" className="w-full lg:w-auto" onValueChange={setActiveTab}>
              <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-x-8 gap-y-4 justify-start">
                {[
                  { id: 'all', label: 'All Media', icon: LayoutGrid },
                  { id: 'photos', label: 'Photos', icon: Camera },
                  { id: 'videos', label: 'Videos', icon: Video },
                  { id: 'audio', label: 'Audio', icon: Music },
                  { id: 'files', label: 'Ministry Files', icon: FileText }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="bg-transparent p-0 data-[state=active]:bg-transparent shadow-none rounded-none border-none text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground data-[state=active]:text-accent relative pb-2 transition-all after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent data-[state=active]:after:w-full after:transition-all"
                  >
                    <tab.icon className="w-3.5 h-3.5 mr-2 inline-block mb-0.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/40" />
              <Input 
                placeholder="SEARCH MEDIA..." 
                className="pl-10 rounded-none border-accent/10 bg-muted/20 text-[10px] tracking-widest font-bold placeholder:text-accent/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <MediaGallery items={filteredItems} />
          ) : (
            <div className="py-24 text-center border border-dashed border-accent/10">
              <p className="font-serif italic text-muted-foreground text-xl">No media items found matching your criteria.</p>
              <button 
                onClick={() => {setSearchQuery(''); setActiveTab('all');}}
                className="mt-6 text-[10px] font-bold tracking-[0.2em] uppercase text-accent border-b border-accent/30 pb-1"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
