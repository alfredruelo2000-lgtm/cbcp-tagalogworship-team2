import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { getSongs } from '@/lib/db-songs.functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Search, 
  GripVertical, 
  Trash2, 
  Music, 
  Clock, 
  ChevronUp, 
  ChevronDown,
  Settings2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/setlists/$id')({
  component: SetlistBuilderPage,
});

function SetlistBuilderPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: services = [], isLoading: isLoadingService } = useQuery({
    queryKey: ['services'],
    queryFn: getServices
  });

  const { data: allSongs = [], isLoading: isLoadingSongs } = useQuery({
    queryKey: ['songs'],
    queryFn: getSongs
  });

  const service = services.find(s => s.id === id);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return [];
    return allSongs.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [allSongs, searchTerm]);

  const addSongMutation = useMutation({
    mutationFn: async ({ songId, title }: { songId: string, title: string }) => {
      const maxOrder = service?.songs.reduce((max, s) => Math.max(max, s.order), 0) || 0;
      const { error } = await supabase
        .from('service_items')
        .insert({
          service_id: id,
          song_id: songId,
          title: title,
          item_type: 'Song',
          sort_order: maxOrder + 1,
          selected_key: allSongs.find(s => s.id === songId)?.defaultKey || 'C'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Song added to setlist');
      setSearchTerm('');
    }
  });

  const removeSongMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Removed from setlist');
    }
  });

  const updateKeyMutation = useMutation({
    mutationFn: async ({ itemId, key }: { itemId: string, key: string }) => {
      const { error } = await supabase.from('service_items').update({ selected_key: key }).eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); }
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ firstId, secondId, firstOrder, secondOrder }: { firstId: string; secondId: string; firstOrder: number; secondOrder: number }) => {
      const first = await supabase.from('service_items').update({ sort_order: secondOrder }).eq('id', firstId);
      if (first.error) throw first.error;
      const second = await supabase.from('service_items').update({ sort_order: firstOrder }).eq('id', secondId);
      if (second.error) throw second.error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); toast.success('Setlist order saved'); },
    onError: (error: Error) => toast.error(`Unable to save order: ${error.message}`),
  });

  const moveSong = (index: number, direction: -1 | 1) => {
    if (!service) return;
    const ordered = [...service.songs].sort((a, b) => a.order - b.order);
    const nextIndex = index + direction;
    const current = ordered[index];
    const next = ordered[nextIndex];
    if (!current || !next) return;
    reorderMutation.mutate({ firstId: current.id, secondId: next.id, firstOrder: current.order, secondOrder: next.order });
  };

  if (isLoadingService) return <div className="p-12 text-center uppercase tracking-widest text-[10px]">Loading setlist builder...</div>;
  if (!service) return <div className="p-12 text-center uppercase tracking-widest text-[10px]">Service not found</div>;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Setlist Builder
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" asChild>
              <Link to="/dashboard/setlists">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-serif text-5xl text-foreground">{service.title} Flow</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14 uppercase tracking-widest">
            {new Date(service.serviceDate).toLocaleDateString()} • {service.theme || 'No Theme'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 ml-14">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="Search library to add songs..." 
              className="pl-12 h-14 rounded-none border-accent/20 bg-muted/30 focus:bg-background transition-all uppercase text-[11px] tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {searchTerm && (
              <div className="absolute top-full left-0 right-0 bg-primary border border-accent/20 z-50 shadow-2xl mt-1">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map(song => (
                    <button
                      key={song.id}
                      className="w-full p-4 flex items-center justify-between hover:bg-accent/10 text-left border-b border-accent/5 transition-colors"
                      onClick={() => addSongMutation.mutate({ songId: song.id, title: song.title })}
                    >
                      <div>
                        <p className="font-serif text-lg text-primary-foreground">{song.title}</p>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{song.artist}</p>
                      </div>
                      <Plus className="w-4 h-4 text-accent" />
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">No matches found</div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {service.songs.sort((a, b) => a.order - b.order).map((song, idx) => {
              const songData = allSongs.find(s => s.id === song.songId);
              return (
                <div key={song.id} className="group p-6 bg-muted/10 border border-accent/5 hover:border-accent/20 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" aria-label="Move song up" disabled={idx === 0 || reorderMutation.isPending} onClick={() => moveSong(idx, -1)} className="h-6 w-6 text-accent/20 hover:text-accent p-0">
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Move song down" disabled={idx === service.songs.length - 1 || reorderMutation.isPending} onClick={() => moveSong(idx, 1)} className="h-6 w-6 text-accent/20 hover:text-accent p-0">
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div>
                      <h4 className="font-serif text-xl text-foreground">{songData?.title || 'Unknown Song'}</h4>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{songData?.artist || 'Unknown Artist'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Key</Label>
                      <select 
                        className="bg-transparent border-none text-[10px] font-bold text-accent focus:ring-0 cursor-pointer"
                        value={song.selectedKey}
                        onChange={(e) => updateKeyMutation.mutate({ itemId: song.id, key: e.target.value })}
                      >
                        {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                          <option key={k} value={k} className="bg-primary">{k}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col items-end">
                      <Label className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">BPM</Label>
                      <span className="text-[10px] font-bold">{songData?.bpm || '--'}</span>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-none transition-all"
                      onClick={() => removeSongMutation.mutate(song.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {service.songs.length === 0 && (
              <div className="p-20 border border-accent/5 border-dashed bg-muted/5 flex flex-col items-center justify-center text-center space-y-6">
                <Music className="w-12 h-12 text-accent/10" />
                <div className="space-y-2">
                  <h3 className="font-serif text-2xl text-accent/40">Empty Setlist</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground max-w-xs">Use the search bar above to begin curating the musical flow for this service.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <section className="p-8 bg-primary text-primary-foreground border border-accent/20 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Setlist Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Total Songs</span>
                <span className="font-serif text-xl">{service.songs.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Est. Duration</span>
                <span className="font-serif text-xl">{service.songs.length * 5}m</span>
              </div>
            </div>
            <Button className="w-full rounded-none bg-accent text-primary hover:bg-accent/90 font-bold text-[10px] uppercase tracking-widest py-6">
              Finalize & Print
            </Button>
          </section>

          <section className="p-8 border border-accent/5 space-y-4">
            <div className="flex items-center gap-2 text-accent">
               <Settings2 className="w-4 h-4" />
               <h3 className="text-[10px] font-bold uppercase tracking-widest">Builder Settings</h3>
            </div>
            <p className="text-[9px] text-muted-foreground italic leading-relaxed">
              Service-specific keys do not affect the original library defaults. Song order changes are saved instantly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
