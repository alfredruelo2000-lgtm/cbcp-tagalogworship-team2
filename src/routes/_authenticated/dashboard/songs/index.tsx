import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  Music, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  Edit,
  Archive,
  Eye,
  ArrowUpDown,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSongs, archiveSong, deleteSong } from '@/lib/db-songs.functions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { useState, useMemo } from 'react';
import { WorshipSong } from '@/types/songs';

export const Route = createFileRoute('/_authenticated/dashboard/songs/')({
  component: SongManagementPage,
});

function SongManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [themeFilter, setThemeFilter] = useState('All');
  const [languageFilter, setLanguageFilter] = useState('All');
   const [deleteId, setDeleteId] = useState<string | null>(null);
   const [coverFilter, setCoverFilter] = useState<'All' | 'Has Cover' | 'Missing Cover'>('All');

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: () => getSongs(),
  });

  const allThemes = useMemo(() => {
    const themes = new Set<string>();
    songs.forEach(song => song.themes?.forEach(t => themes.add(t)));
    return ['All', ...Array.from(themes).sort()];
  }, [songs]);

  const languages = ['All', 'Tagalog', 'English', 'Taglish', 'Unclassified'];
  const displayLanguage = (value?: string) => value === 'Filipino/Tagalog' ? 'Tagalog' : value || 'Unclassified';

  const languageCounts = useMemo(() => Object.fromEntries(languages.map(lang => [lang, lang === 'All' ? songs.length : songs.filter(song => displayLanguage(song.language) === lang).length])), [songs]);


  const filteredSongs = useMemo(() => {
    return songs.filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        (song.artist || '').toLowerCase().includes(search.toLowerCase());
      const matchesTheme = themeFilter === 'All' || song.themes?.includes(themeFilter);
       const matchesLanguage = languageFilter === 'All' || displayLanguage(song.language) === languageFilter;
       const matchesCover = coverFilter === 'All' || (coverFilter === 'Has Cover' ? Boolean(song.artworkUrl) : !song.artworkUrl);
       return matchesSearch && matchesTheme && matchesLanguage && matchesCover;
    });
  }, [songs, search, themeFilter, languageFilter, coverFilter]);

  const archiveMutation = useMutation({
    mutationFn: archiveSong,
    onMutate: async (id: string | { data: string }) => {
      const songId = typeof id === 'string' ? id : id.data;
      await queryClient.cancelQueries({ queryKey: ['songs'] });
      const previousSongs = queryClient.getQueryData(['songs']);
      queryClient.setQueryData(['songs'], (old: WorshipSong[]) => 
        old?.map(s => s.id === songId ? { ...s, status: 'Archived' } : s)
      );
      return { previousSongs };
    },
    onSuccess: () => {
      toast.success('Song archived');
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['songs'], context.previousSongs);
      toast.error('Failed to archive song');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSong,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['songs'] });
      const previousSongs = queryClient.getQueryData(['songs']);
      queryClient.setQueryData(['songs'], (old: WorshipSong[]) => 
        old?.filter(s => s.id !== id)
      );
      return { previousSongs };
    },
    onSuccess: () => {
      toast.success('Song deleted successfully');
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData(['songs'], context.previousSongs);
      toast.error('Failed to delete song');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    }
  });

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Planning & Content
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Song Library Management</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Maintain the ministry's musical repertoire. Update metadata, keys, and status for all songs.
          </p>
        </div>
        <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
          <Link to="/dashboard/songs/new">
            <Plus className="w-4 h-4 mr-2" /> Add New Song
          </Link>
        </Button>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-6 border border-accent/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title, artist..." 
            className="pl-10 rounded-none border-accent/10 focus-visible:ring-accent bg-background text-[11px] uppercase tracking-wider"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-none border-accent/10 px-6 font-bold text-[10px] uppercase tracking-widest">
                <Filter className="w-3 h-3 mr-2" /> {languageFilter === 'All' ? 'Language' : languageFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-none border-accent/10 bg-primary text-primary-foreground">
               {languages.map(language => <DropdownMenuItem key={language} onClick={() => setLanguageFilter(language)} className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">{language} ({languageCounts[language]})</DropdownMenuItem>)}
               <DropdownMenuSeparator />
               {(['All', 'Has Cover', 'Missing Cover'] as const).map(status => <DropdownMenuItem key={status} onClick={() => setCoverFilter(status)} className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">{status}</DropdownMenuItem>)}
               <DropdownMenuSeparator />
              {allThemes.map(theme => (
                <DropdownMenuItem 
                  key={theme} 
                  onClick={() => setThemeFilter(theme)}
                  className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer"
                >
                  {theme}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {(search || themeFilter !== 'All' || languageFilter !== 'All') && (
            <Button 
              variant="ghost" 
              onClick={() => { setSearch(''); setThemeFilter('All'); setLanguageFilter('All'); }}
              className="rounded-none px-4 font-bold text-[10px] uppercase tracking-widest text-accent"
            >
              <X className="w-3 h-3 mr-2" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Songs Table */}
      <div className="border border-accent/5 bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-accent/5">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Title & Artist</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Language</TableHead>
               <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6 text-center">Key / BPM</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Themes</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Usage</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  Loading repertoire...
                </TableCell>
              </TableRow>
            ) : (filteredSongs || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  No songs matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (filteredSongs || []).map((song: any) => (
              <TableRow key={song.id} className="group border-accent/5 hover:bg-muted/10 transition-colors">
                <TableCell className="py-6 px-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-accent/5 flex items-center justify-center border border-accent/10 overflow-hidden">
                       {song.artworkUrl ? <img src={song.artworkUrl} alt="" className="w-full h-full object-cover" /> : <Music className="w-4 h-4 text-accent/40" />}
                     </div>
                    <div>
                      <h3 className="font-serif text-lg leading-tight">{song.title}</h3>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{song.artist}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-center">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-[10px] font-bold text-accent">{song.defaultKey}</span>
                    <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">{song.bpm} BPM</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 max-w-[200px]">
                  <div className="flex flex-wrap gap-1">
                    {(song.themes || []).slice(0, 2).map((theme: any) => (
                      <Badge key={theme} variant="outline" className="rounded-none text-[7px] uppercase tracking-tighter border-accent/10 text-muted-foreground">
                        {theme}
                      </Badge>
                    ))}
                    {song.themes && song.themes.length > 2 && <span className="text-[8px] text-accent">+{song.themes.length - 2}</span>}
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest">{song.usageCount || 0} times</p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">Last: {song.lastUsed ? new Date(song.lastUsed).toLocaleDateString() : 'Never'}</p>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <Badge className={cn(
                    "rounded-none border-none text-[8px] font-bold uppercase tracking-widest",
                    song.status === 'Active' ? "bg-green-500/10 text-green-500" : 
                    song.status === 'Learning' ? "bg-amber-500/10 text-amber-500" :
                    song.status === 'Inactive' ? "bg-red-500/10 text-red-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {song.status}
                  </Badge>
                  {song.visibility !== 'Public' && (
                    <Badge variant="outline" className="ml-2 rounded-none border-accent/20 text-accent/60 text-[7px] font-bold uppercase tracking-widest">
                      {song.visibility}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-6 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-accent/40 hover:text-accent rounded-none">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-none border-accent/10 bg-primary text-primary-foreground">
                      <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-accent/50 font-bold">Options</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                        <Link to="/songs/$id" params={{ id: song.id }}>
                          <Eye className="w-3 h-3 mr-2" /> View Public Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                        <Link to="/dashboard/songs/$id" params={{ id: song.id }}>
                          <Edit className="w-3 h-3 mr-2" /> Edit Song
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-accent/10" />
                      <DropdownMenuItem 
                        onClick={() => handleArchive(song.id)}
                        className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer"
                      >
                        <Archive className="w-3 h-3 mr-2" /> Archive Song
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(song.id)}
                        className="text-[10px] uppercase tracking-widest font-bold text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 mr-2" /> Delete Permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none border-accent/10 bg-primary text-primary-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl uppercase tracking-widest">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-[10px] uppercase tracking-widest">
              This will permanently remove the song from the library and all setlists. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-accent/10 text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-none bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-widest font-bold"
            >
              Delete Song
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
