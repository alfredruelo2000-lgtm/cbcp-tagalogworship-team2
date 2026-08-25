import { Link } from '@tanstack/react-router';
import { 
  Music, 
  Calendar, 
  ListMusic, 
  Users, 
  BookOpen, 
  FileVideo,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Settings,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { getSongs } from '@/lib/db-songs.functions';
import { getServices } from '@/lib/db-services.functions';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboardOverview() {
  const { isWorshipLeader, isMinistryAdmin } = useAuth();

  const { data: songs = [] } = useQuery({ queryKey: ['songs'], queryFn: () => getSongs() });
  const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: () => getServices() });
  const { data: teamCount = 0 } = useQuery({ 
    queryKey: ['team-count'], 
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'Archived');
      if (error) throw error;
      return count ?? 0;
    } 
  });
  
  const stats = [
    { label: 'Upcoming Services', value: (services || []).filter((s: any) => s.status !== 'Completed' && s.status !== 'Archived').length, icon: Calendar, to: '/dashboard/services' },
    { label: 'Active Songs', value: (songs || []).filter((s: any) => s.status === 'Active').length, icon: Music, to: '/dashboard/songs' },
    { label: 'Team Members', value: teamCount, icon: Users, to: '/dashboard/team' },
    { label: 'Pending Assignments', value: (services || []).reduce((acc: number, s: any) => acc + (s.assignments || []).filter((a: any) => a.status === 'Pending').length, 0), icon: Clock, to: '/dashboard/schedule' },
  ];

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity_type,
        time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: log.user_id || 'System'
      }));
    }
  });

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
          Ministry Management
        </Badge>
        <h1 className="font-serif text-5xl text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Welcome to the Radiant Worship administration portal. Manage your ministry assets, schedule, and team members from one central location.
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.to} className="block transition-transform hover:scale-[1.02]">
            <Card className="rounded-none border-accent/5 bg-muted/20 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-muted/10 border border-accent/5 p-8">
            <h2 className="font-serif text-2xl mb-8 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "New Service", icon: PlusCircle, path: "/dashboard/services/new", color: "text-accent" },
                { label: "Add Song", icon: Music, path: "/dashboard/songs/new", color: "text-blue-400" },
                { label: "Schedule Team", icon: Clock, path: "/dashboard/schedule/new", color: "text-green-400" },
                { label: "New Resource", icon: BookOpen, path: "/dashboard/resources/new", color: "text-purple-400" },
                { label: "Upload Media", icon: FileVideo, path: "/dashboard/media/new", color: "text-orange-400" },
                { label: "Settings", icon: Settings, path: "/dashboard/settings", color: "text-muted-foreground" },
              ].map((action) => (
                <Link 
                  key={action.label}
                  to={action.path}
                  className="flex flex-col items-center justify-center p-6 bg-background border border-accent/5 hover:border-accent/20 transition-all group"
                >
                  <action.icon className={cn("w-6 h-6 mb-3 transition-transform group-hover:scale-110", action.color)} />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <section className="p-8 bg-primary text-primary-foreground rounded-none shadow-2xl space-y-6">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">Ministry Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/60">System Health</span>
                <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest text-accent border-accent/20">Standby</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Active Sessions</span>
                <span className="text-xs font-serif text-accent">1</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Last Sync</span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">Just now</span>
              </div>
            </div>
          </section>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase border-b border-accent/10 pb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity: any, idx: number) => (
                  <Link 
                    key={activity.id || idx} 
                    to={activity.entity === 'Song' ? '/dashboard/songs' : activity.entity === 'Service' ? '/dashboard/services' : '/dashboard'}
                    className="group p-6 bg-muted/10 border border-accent/5 hover:border-accent/20 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                            {activity.action}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {activity.time}
                          </span>
                        </div>
                        <h3 className="font-serif text-lg">{activity.entity}</h3>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.1em]">
                          Modified by {activity.user}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-accent hover:bg-accent/10 rounded-none">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ))
              ) : (
                <div className="p-12 border border-accent/5 border-dashed text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground italic">No recent activity yet.</p>
                </div>
              )}
              {isMinistryAdmin && recentActivity.length > 0 && (
                <Button variant="link" className="text-accent text-[10px] font-bold uppercase tracking-widest p-0 h-auto" asChild>
                  <Link to="/dashboard/activity">View Full Activity Log</Link>
                </Button>
              )}
            </div>
          </section>

          {/* Upcoming Services Preview */}
          <section className="space-y-6">
            <h2 className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase border-b border-accent/10 pb-4">
              Upcoming Planning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(services || []).slice(0, 2).map((service: any) => (
                <Card key={service.id} className="rounded-none border-accent/5 bg-muted/10">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest border-accent/20 text-accent">
                        {service.status}
                      </Badge>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                        {new Date(service.serviceDate).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="font-serif text-xl">{service.title}</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest">
                      WL: Assigned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex -space-x-2">
                        {(service.assignments || []).slice(0, 3).map((a: any) => (
                          <div key={a.id} className="w-6 h-6 rounded-none bg-accent/20 border border-primary flex items-center justify-center text-[8px] font-bold text-accent">
                            {(a.role || 'M').substring(0, 1)}
                          </div>
                        ))}
                      </div>
                      <Button asChild variant="ghost" size="sm" className="text-accent text-[9px] font-bold uppercase tracking-widest p-0 h-auto">
                        <Link to={`/dashboard/setlists`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
