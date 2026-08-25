import { useState, useMemo } from 'react';
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getServices } from '@/lib/db-services.functions';
import { getTeamPublic } from '@/lib/db-public.functions';
import { TeamRole, TeamMemberStatus } from '@/types/team';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  ChevronRight, 
  Mic2, 
  Music, 
  Headphones, 
  Plus,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_public/team')({
  component: TeamDirectoryLayout,
});

function TeamDirectoryLayout() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  const { data: team = [] } = useQuery({
    queryKey: ['team-public'],
    queryFn: () => getTeamPublic()
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
  });

  const filteredMembers = useMemo(() => {
    return team.filter((member: any) => {
      const fullName = member.full_name || member.fullName || '';
      const primaryRole = member.primary_role || member.primaryRole || '';
      
      const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          primaryRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || primaryRole.toLowerCase() === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesVisibility = visibilityFilter === 'all' || 
                               (visibilityFilter === 'featured' && member.featured) ||
                               (visibilityFilter === 'standard' && !member.featured);
      
      return matchesSearch && matchesRole && matchesStatus && matchesVisibility;
    });
  }, [team, searchQuery, roleFilter, statusFilter, visibilityFilter]);

  const roles = Array.from(new Set(team.map((m: any) => m.primary_role || m.primaryRole))).filter(Boolean).sort();
  const statuses = ['Active', 'Available', 'Limited Availability', 'On Break', 'Inactive'];

  const getStatusColor = (status: TeamMemberStatus) => {
    switch (status) {
      case 'Active': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'Available': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'Limited Availability': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'On Break': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-200';
    }
  };

  const getUpcomingAssignmentsCount = (memberId: string) => {
    return services.reduce((count: number, service: any) => {
      const isAssigned = service.assignments?.some((a: any) => (a.memberId || a.member_id) === memberId);
      return isAssigned ? count + 1 : count;
    }, 0);
  };

  return (
    <div className="container mx-auto px-6 py-20 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
              Ministry Personnel
            </Badge>
            <h1 className="font-serif text-5xl lg:text-7xl text-foreground">Worship Team</h1>
            <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
              Directory of those serving in the house of the Lord
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-none h-12 px-8 text-[10px] font-bold tracking-[0.2em] uppercase border-accent/20 hover:bg-accent hover:text-primary transition-all">
              <Link to="/team">
                <Plus className="w-3 h-3 mr-2" /> Application / Info
              </Link>
            </Button>
          </div>
        </header>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12 border-b border-accent/10">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or role..." 
              className="pl-12 h-14 bg-muted/20 border-accent/10 rounded-none focus-visible:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-14 bg-muted/20 border-accent/10 rounded-none focus:ring-accent uppercase text-[10px] tracking-widest font-bold">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-accent/10">
                <SelectItem value="all" className="uppercase text-[10px] tracking-widest">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role as string} value={role as string} className="uppercase text-[10px] tracking-widest">{role as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-14 bg-muted/20 border-accent/10 rounded-none focus:ring-accent uppercase text-[10px] tracking-widest font-bold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-accent/10">
                <SelectItem value="all" className="uppercase text-[10px] tracking-widest">All Status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status} className="uppercase text-[10px] tracking-widest">{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="h-14 bg-muted/20 border-accent/10 rounded-none focus:ring-accent uppercase text-[10px] tracking-widest font-bold">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-accent/10">
                <SelectItem value="all" className="uppercase text-[10px] tracking-widest">All Members</SelectItem>
                <SelectItem value="featured" className="uppercase text-[10px] tracking-widest">Featured Only</SelectItem>
                <SelectItem value="standard" className="uppercase text-[10px] tracking-widest">Standard Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn("h-14 w-14 rounded-none border-accent/10 transition-all", viewMode === 'grid' ? "bg-accent text-primary" : "text-accent")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={cn("h-14 w-14 rounded-none border-accent/10 transition-all", viewMode === 'list' ? "bg-accent text-primary" : "text-accent")}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results */}
        <div>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 border border-dashed border-accent/10">
              <p className="font-serif italic text-muted-foreground text-xl">No team members match your filters.</p>
              <Button 
                variant="link" 
                className="mt-4 text-accent uppercase tracking-widest text-[10px] font-bold"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setVisibilityFilter('all');
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredMembers.map((member: any) => (
                <Link 
                  key={member.id} 
                  to="/team/$id" 
                  params={{ id: member.id }}
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-4">
                    <img 
                      src={member.avatar_url || member.photoUrl} 
                      alt={member.full_name || member.fullName} 

                      className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className={cn(getStatusColor(member.status), "border backdrop-blur-sm shadow-sm rounded-none text-[8px] uppercase tracking-widest")}>
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-serif text-2xl text-foreground group-hover:text-accent transition-colors">{member.full_name || member.fullName}</h3>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">{member.primary_role || member.primaryRole}</p>

                    </div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground border-t border-accent/5 pt-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-accent/40" />
                        <span>{getUpcomingAssignmentsCount(member.id)} Upcoming</span>
                      </div>
                      <span className="text-accent/60 group-hover:text-accent transition-colors flex items-center gap-1 font-bold">
                        View Profile <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member: any) => (
                <Link 
                  key={member.id} 
                  to="/team/$id" 
                  params={{ id: member.id }}
                  className="group flex flex-col sm:flex-row sm:items-center gap-6 p-6 bg-muted/20 border border-accent/5 hover:border-accent/10 transition-all"
                >
                  <div className="h-16 w-16 overflow-hidden bg-muted flex-shrink-0">
                    <img src={member.avatar_url || member.photoUrl} alt={member.full_name || member.fullName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl text-foreground group-hover:text-accent transition-colors truncate">{member.full_name || member.fullName}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                      <span className="text-[10px] font-bold tracking-widest text-accent uppercase">{member.primary_role || member.primaryRole}</span>

                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{member.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] font-bold text-accent uppercase tracking-widest">{getUpcomingAssignmentsCount(member.id)} Upcoming</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Services Scheduled</p>
                    </div>
                    <Badge className={cn(getStatusColor(member.status), "rounded-none text-[8px] uppercase tracking-widest")}>
                      {member.status}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-accent/20 group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-20 print:hidden">
        <Outlet />
      </div>
    </div>
  );
}
