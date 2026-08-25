import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  ListMusic, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Eye,
  Clock,
  Music,
  FileText
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/setlists')({
  component: SetlistManagementPage,
});

function SetlistManagementPage() {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .update({ status: 'Archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Setlist archived');
    },
    onError: (error: any) => {
      toast.error('Failed to archive setlist: ' + error.message);
    }
  });

  const handleArchive = (id: string) => {
    if (confirm('Are you sure you want to archive this setlist? This will move the service to the archives.')) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Planning & Content
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Setlist Management</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Curate song selections, manage flow, and organize worship setlists for all services.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-accent/10 px-8 py-6 font-bold text-[10px] uppercase tracking-widest">
            Browse Archive
          </Button>
          <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
            <Link to="/dashboard/setlists/new">
              <Plus className="w-4 h-4 mr-2" /> New Setlist
            </Link>
          </Button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-accent/5 pb-6">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <Input 
            placeholder="Search setlists, themes, or services..." 
            className="pl-12 h-12 rounded-none border-accent/20 bg-muted/30 focus:bg-background transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="rounded-none h-12 px-6 tracking-widest uppercase text-[10px] font-bold border-accent/20 flex-1 md:flex-none">
            <Filter className="w-3 h-3 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Setlists Table */}
      <div className="border border-accent/5 bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-accent/5">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Title & Theme</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Songs</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Service Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  Loading setlists...
                </TableCell>
              </TableRow>
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  No setlists found.
                </TableCell>
              </TableRow>
            ) : services.map((setlist: any) => (
              <TableRow key={setlist.id} className="group border-accent/5 hover:bg-muted/10 transition-colors">
                <TableCell className="py-6 px-6">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg leading-tight">{setlist.title}</h3>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest">
                      <FileText className="w-3 h-3" /> {setlist.theme || 'No theme set'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <div className="flex items-center gap-2">
                    <Music className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold tracking-widest">{setlist.songs.length} Songs</span>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                      {new Date(setlist.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest">{setlist.serviceType}</p>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6">
                  <Badge className={cn(
                    "rounded-none border-none text-[8px] font-bold uppercase tracking-widest",
                    setlist.status === 'Ready' ? "bg-green-500/10 text-green-500" : 
                    setlist.status === 'Preparing' ? "bg-amber-500/10 text-amber-500" :
                    setlist.status === 'Draft' ? "bg-accent/10 text-accent" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {setlist.status}
                  </Badge>
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
                        <Link to="/setlists/$id" params={{ id: setlist.id }}>
                          <Eye className="w-3 h-3 mr-2" /> View Setlist
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                        <Edit className="w-3 h-3 mr-2" /> Edit Setlist
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                        <Copy className="w-3 h-3 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-accent/10" />
                      <DropdownMenuItem 
                        onClick={() => handleArchive(setlist.id)}
                        className="text-[10px] uppercase tracking-widest font-bold text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                      >
                        <Archive className="w-3 h-3 mr-2" /> Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
