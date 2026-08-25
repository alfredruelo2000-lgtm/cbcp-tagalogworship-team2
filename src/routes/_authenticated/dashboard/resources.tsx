import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  Edit,
  Archive,
  Eye,
  CheckCircle2,
  AlertCircle
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getResources } from '@/lib/db-resources.functions';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard/resources')({
  component: ResourceManagementPage,
});

function ResourceManagementPage() {
  const queryClient = useQueryClient();
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getResources(),
  });

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('worship_resources').update({ status: 'Archived', is_public: false, visibility: 'Private' }).eq('id', id);
    if (error) {
      toast.error(`Unable to archive resource: ${error.message}`);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['resources'] });
    toast.success('Resource archived');
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Training & Library
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Resource Management</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Publish training modules, devotionals, and ministry resources for the team.
          </p>
        </div>
        <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
          <Link to="/dashboard/resources/new">

            <Plus className="w-4 h-4 mr-2" /> Create New Resource
          </Link>
        </Button>
      </header>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-6 border border-accent/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-10 rounded-none border-accent/10 focus-visible:ring-accent bg-background text-[11px] uppercase tracking-wider"
          />
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-accent/10 px-6 font-bold text-[10px] uppercase tracking-widest">
            <Filter className="w-3 h-3 mr-2" /> Filters
          </Button>
        </div>
      </div>

      {/* Resources Table */}
      <div className="border border-accent/5 bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-accent/5">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Title</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Category</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Published</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  Loading resources...
                </TableCell>
              </TableRow>
            ) : resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground uppercase text-[10px] tracking-widest italic">
                  No resources found.
                </TableCell>
              </TableRow>
            ) : resources.map((res: any) => (
              <TableRow key={res.id} className="group border-accent/5 hover:bg-muted/10 transition-colors">
                <TableCell className="py-6 px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/5 flex items-center justify-center border border-accent/10">
                      <BookOpen className="w-4 h-4 text-accent/40" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg leading-tight group-hover:text-accent transition-colors">{res.title}</h3>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{res.author}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 px-6 text-[10px] font-bold uppercase tracking-widest">
                  {res.category}
                </TableCell>
                <TableCell className="py-6 px-6">
                  <Badge className={cn(
                    "rounded-none border-none text-[8px] font-bold uppercase tracking-widest",
                    res.status === 'Published' ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"
                  )}>
                    {res.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-6 px-6 text-[9px] uppercase tracking-widest text-muted-foreground">
                  {res.publishedAt ? new Date(res.publishedAt).toLocaleDateString() : 'N/A'}
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
                        <Link to="/resources">
                          <Eye className="w-3 h-3 mr-2" /> View Public Page
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                        <Link to="/dashboard/resources/new">
                          <Edit className="w-3 h-3 mr-2" /> Edit Resource
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-accent/10" />
                      <DropdownMenuItem 
                        onClick={() => handleArchive(res.id)}
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
