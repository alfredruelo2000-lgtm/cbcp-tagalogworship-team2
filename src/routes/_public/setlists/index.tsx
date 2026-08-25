import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  Filter,
  ChevronRight,
  Layout
} from 'lucide-react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { SetlistStatus, ServiceType } from '@/types/setlists';

export const Route = createFileRoute('/_public/setlists/')({
  component: SetlistsPage,
});

function SetlistsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SetlistStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ServiceType | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const { data: setlists = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
  });

  const filteredSetlists = useMemo(() => {
    return setlists.filter((setlist: any) => {
      const matchesSearch = 
        (setlist.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (setlist.theme?.toLowerCase().includes(search.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === 'All' || setlist.status === statusFilter;
      const matchesType = typeFilter === 'All' || setlist.service_type === typeFilter || setlist.serviceType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a: any, b: any) => new Date(b.service_date || b.serviceDate).getTime() - new Date(a.service_date || a.serviceDate).getTime());
  }, [setlists, search, statusFilter, typeFilter]);

  const getStatusColor = (status: SetlistStatus) => {
    switch (status) {
      case 'Ready': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Draft': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      case 'Preparing': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'Completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Archived': return 'bg-muted text-muted-foreground border-transparent';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="text-left">
          <h1 className="font-serif text-5xl lg:text-6xl text-foreground mb-6">Worship Setlists</h1>
          <p className="text-xl text-muted-foreground font-light max-w-2xl">
            Plan, organize, and prepare worship songs for services, rehearsals, and ministry gatherings.
          </p>
        </div>
        <Button className="rounded-none h-12 px-8 tracking-widest uppercase text-[10px] font-bold">
          <Plus className="w-4 h-4 mr-2" /> Create Setlist
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-[80px] z-30 bg-background/80 backdrop-blur-md py-6 border-b border-accent/10 mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <Input 
              placeholder="Search setlists, themes, or leaders..." 
              className="pl-12 h-12 rounded-none border-accent/20 bg-muted/30 focus:bg-background transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button 
            variant="outline" 
            className={`rounded-none h-12 px-6 tracking-widest uppercase text-[10px] font-bold border-accent/20 w-full md:w-auto ${showFilters ? 'bg-accent/10 text-accent border-accent/40' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3 h-3 mr-2" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-accent/10 flex flex-wrap gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Status</label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Draft', 'Preparing', 'Ready', 'Completed', 'Archived'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    className={`px-3 py-1 text-[10px] tracking-widest uppercase transition-all ${statusFilter === status ? 'bg-accent text-background' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Service Type</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-muted/50 text-[10px] tracking-widest uppercase px-3 py-1 outline-none border border-accent/10 focus:border-accent/30 block"
              >
                <option value="All">All Services</option>
                <option value="Sunday Worship">Sunday Worship</option>
                <option value="Prayer Meeting">Prayer Meeting</option>
                <option value="Youth Worship">Youth Worship</option>
                <option value="Midweek Service">Midweek Service</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Setlist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredSetlists.map((setlist) => (
          <Link 
            key={setlist.id} 
            to="/setlists/$id" 
            params={{ id: setlist.id }}
            className="group block"
          >
            <div className="h-full border border-accent/10 p-8 bg-background hover:border-accent/30 transition-all duration-300 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <Badge variant="outline" className={`rounded-none uppercase text-[8px] tracking-widest font-bold ${getStatusColor(setlist.status)}`}>
                  {setlist.status}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {setlist.songs.length} Songs
                </span>
              </div>

              <h3 className="font-serif text-2xl text-foreground mb-4 group-hover:text-accent transition-colors">
                {setlist.title}
              </h3>

              <div className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Calendar className="w-3 h-3 mr-2 text-accent/50" />
                    {new Date(setlist.serviceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    <User className="w-3 h-3 mr-2 text-accent/50" />
                    {setlist.worshipLeader}
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Layout className="w-3 h-3 mr-2 text-accent/50" />
                    {setlist.serviceType}
                  </div>
                </div>

                {setlist.theme && (
                  <p className="text-xs italic text-muted-foreground border-t border-accent/5 pt-4">
                    Theme: {setlist.theme}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredSetlists.length === 0 && (
        <div className="py-32 text-center border border-dashed border-accent/20 bg-muted/5">
          <p className="text-muted-foreground italic">No setlists found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
