import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/dashboard/schedule')({
  component: ScheduleManagementPage,
});

function ScheduleManagementPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => getServices(),
  });

  const { data: team = [] } = useQuery({
    queryKey: ['team-full'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data;
    }
  });

  const pendingAssignments = services.flatMap(s => 
    s.assignments
      .filter((a: any) => a.status === 'Pending')
      .map((a: any) => ({ ...a, serviceTitle: s.title, serviceDate: s.serviceDate }))
  );

  const recentlyConfirmed = services.flatMap((s: any) => 
    (s.assignments || [])
      .filter((a: any) => a.status === 'Confirmed')
      .map((a: any) => ({ ...a, serviceTitle: s.title, serviceDate: s.serviceDate }))
  ).sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Helper to find service for a specific date
  const getServiceForDate = (day: number) => {
    const dateString = `${year}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return services.find((s: any) => s.serviceDate === dateString);
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Team Coordination
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Team Schedule</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Monitor team availability, manage service rotations, and resolve scheduling conflicts.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-accent/10 px-8 py-6 font-bold text-[10px] uppercase tracking-widest">
            Availability Requests
          </Button>
          <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
            <Link to="/dashboard/schedule/new">

              <Plus className="w-4 h-4 mr-2" /> Auto-Schedule
            </Link>
          </Button>
        </div>
      </header>

      {/* Calendar View */}
      <div className="bg-background border border-accent/5">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent/5 bg-muted/10">
          <h2 className="font-serif text-2xl text-foreground">
            {monthName} <span className="text-accent/50">{year}</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-background border border-accent/10 p-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-none">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-none">
                <ChevronRight size={16} />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="rounded-none text-[10px] font-bold uppercase tracking-widest border-accent/20 h-10">
              <Filter size={14} className="mr-2" /> View Filters
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-accent/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-accent/40 bg-muted/5">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-t border-accent/5">
          {/* Empty cells for start of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[160px] bg-muted/5 border-r border-b border-accent/5" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const service = getServiceForDate(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth();

            return (
              <div key={day} className={cn(
                "min-h-[160px] p-3 border-r border-b border-accent/5 group transition-colors hover:bg-muted/10",
                isToday && "bg-accent/5"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "text-xs font-bold",
                    isToday ? "text-accent" : "text-muted-foreground"
                  )}>
                    {day}
                  </span>
                  {service && (
                    <Badge className="bg-accent/10 text-accent border-none rounded-none text-[8px] font-bold uppercase tracking-widest px-1.5 h-4">
                      Service
                    </Badge>
                  )}
                </div>

                {service && (
                  <div className="space-y-2">
                    <div className="p-2 bg-primary/5 border border-accent/10 rounded-sm">
                      <p className="text-[9px] font-bold text-foreground line-clamp-2 leading-tight mb-1">{service.title}</p>
                      <div className="flex items-center gap-1 text-[7px] text-muted-foreground uppercase tracking-widest">
                        <Clock size={8} /> {service.serviceTime}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[7px] uppercase tracking-widest text-muted-foreground px-1">
                        <span>Confirmed</span>
                        <span className="font-bold text-green-600">
                          {(service.assignments || []).filter((a: any) => a.status === 'Confirmed').length}/{(service.assignments || []).length}
                        </span>
                      </div>
                      <div className="w-full bg-accent/10 h-1">
                        <div 
                          className="bg-green-600 h-full" 
                          style={{ width: `${((service.assignments || []).filter((a: any) => a.status === 'Confirmed').length / (service.assignments || []).length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {!service && day % 7 === 0 && (
                  <div className="mt-2 text-[7px] text-muted-foreground uppercase tracking-widest px-1 italic">
                    No service scheduled
                  </div>
                )}
                {service && (
                  <div className="mt-2">
                    <Button asChild variant="link" className="h-auto p-0 text-[7px] text-accent uppercase tracking-widest font-bold">
                      <Link to="/dashboard/schedule/$id" params={{ id: service.assignments?.[0]?.id || '' }}>
                        Manage Team
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

            );
          })}

          {/* Empty cells for end of month */}
          {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="min-h-[160px] bg-muted/5 border-r border-b border-accent/5" />
          ))}
        </div>
      </div>

      {/* Roster & Availability Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600" />
            Pending Confirmations
          </h3>
          <div className="space-y-2">
            {pendingAssignments.slice(0, 5).map((assignment: any) => {
              const member = (team || []).find((t: any) => t.id === (assignment.memberId || assignment.member_id));
              return (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/20 border border-accent/5 hover:border-accent/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-accent/10 flex items-center justify-center font-serif text-accent text-xl">
                      {member?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{member?.full_name || 'Unknown'}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{assignment.serviceTitle} • {assignment.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 text-[8px] font-bold uppercase tracking-widest text-accent hover:bg-accent/10">Remind</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-[8px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10">Replace</Button>
                  </div>
                </div>
              );
            })}
            {pendingAssignments.length === 0 && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground italic p-4 text-center border border-dashed border-accent/10">
                No pending confirmations
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-serif text-2xl text-foreground flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600" />
            Recently Confirmed
          </h3>
          <div className="space-y-2">
            {recentlyConfirmed.slice(0, 5).map((assignment: any) => {
              const member = (team || []).find((t: any) => t.id === (assignment.memberId || assignment.member_id));
              return (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/20 border border-accent/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-600/10 flex items-center justify-center font-serif text-green-600 text-xl">
                      {member?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">{member?.full_name || 'Unknown'}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{assignment.serviceTitle} • {assignment.role}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600/10 text-green-600 border-none rounded-none text-[8px] font-bold uppercase tracking-widest">
                    Confirmed
                  </Badge>
                </div>
              );
            })}
            {recentlyConfirmed.length === 0 && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground italic p-4 text-center border border-dashed border-accent/10">
                No recent confirmations
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
