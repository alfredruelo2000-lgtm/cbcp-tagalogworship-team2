import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMediaItems } from '@/lib/db-resources.functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  FolderOpen
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard/media')({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['media-items'],
    queryFn: () => getMediaItems(),
  });
  const filteredMedia = useMemo(() => mediaItems.filter((item: any) => {
    const matchesSearch = `${item.title ?? ''} ${item.description ?? ''} ${item.category ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All Types' || item.media_type === typeFilter;
    return matchesSearch && matchesType;
  }), [mediaItems, searchQuery, typeFilter]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Play className="w-5 h-5" />;
      case 'Photo': return <ImageIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Digital Assets
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Media Library</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Central repository for worship backgrounds, sermon recordings, song demos, and ministry documentation.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-accent/10 px-8 py-6 font-bold text-[10px] uppercase tracking-widest">
            <FolderOpen className="w-4 h-4 mr-2" /> Albums
          </Button>
          <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
            <Link to="/dashboard/media/new">
              <Plus className="w-4 h-4 mr-2" /> Upload Media
            </Link>
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/20 border border-accent/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(event) => setSearchQuery(event.target.value)}
             placeholder="SEARCH ASSETS..." 
             className="w-full bg-background border border-accent/10 py-2 pl-10 pr-4 text-[10px] uppercase tracking-widest focus:outline-none focus:border-accent/30"
           />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="bg-background border border-accent/10 py-2 px-4 text-[10px] uppercase tracking-widest focus:outline-none w-full md:w-40">
            <option>All Types</option>
            <option>Video</option>
            <option>Photo</option>
            <option>Audio</option>
            <option>Document</option>
          </select>
          <Button variant="outline" size="icon" className="h-10 w-10 border-accent/10 rounded-none shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent animate-pulse">Loading Library...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMedia.map((item: any) => (
            <div key={item.id} className="group bg-muted/10 border border-accent/5 hover:border-accent/20 transition-all flex flex-col">
              <div className="aspect-video relative overflow-hidden bg-muted/20">
                {item.thumbnail_url ? (
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-accent/20">
                    {getIcon(item.media_type)}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-background/80 text-foreground border-none rounded-none text-[8px] uppercase backdrop-blur-sm">
                    {item.media_type}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button asChild variant="outline" size="icon" className="rounded-full border-white text-white hover:bg-white/20 h-10 w-10">
                    <a href={item.file_url} target="_blank" rel="noreferrer" aria-label={`Open ${item.title}`}>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full border-white text-white hover:bg-white/20 h-10 w-10">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-widest text-accent font-bold">{item.category}</span>
                  <span className="text-[8px] text-muted-foreground uppercase">{item.file_size || 'N/A'}</span>
                </div>
                <h3 className="font-serif text-xl group-hover:text-accent transition-colors">{item.title}</h3>
                <p className="text-[10px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                  {item.description || 'No description provided.'}
                </p>
              </div>
            </div>
          ))}

          {mediaItems.length === 0 && (
            <div className="col-span-full p-24 text-center border border-dashed border-accent/10">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground italic">
                Your media library is currently empty.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}