import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Save, Loader2, Calendar, User, Clock, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { getTeamMembers, getAssignments, updateAssignmentStatus } from '@/lib/db-team.functions';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export const Route = createFileRoute('/_authenticated/dashboard/schedule/$id')({
  component: AssignmentDetailPage,
});

function AssignmentDetailPage() {
  const { id } = useParams({ from: '/_authenticated/dashboard/schedule/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => getAssignments()
  });

  const assignment = assignments.find(a => a.id === id);

  const updateStatusMutation = useMutation({
    mutationFn: updateAssignmentStatus,
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + (error as Error).message);
    }
  });

  if (loadingAssignments) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-serif text-foreground">Assignment Not Found</h2>
        <Button onClick={() => navigate({ to: '/dashboard/schedule' })} className="mt-4 rounded-none bg-accent text-primary uppercase text-[10px] font-bold tracking-widest">
          Back to Schedule
        </Button>
      </div>
    );
  }

  const statusColors = {
    'Confirmed': 'bg-green-500/10 text-green-500',
    'Pending': 'bg-amber-500/10 text-amber-500',
    'Declined': 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Assignment Details
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Scheduling Detail</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Status & Assignment</h3>
            
            <div className="p-6 bg-muted/20 border border-accent/5 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Status</span>
                <Badge className={cn("rounded-none border-none text-[8px] font-bold uppercase tracking-widest", statusColors[assignment.status as keyof typeof statusColors] || "bg-accent/10 text-accent")}>
                  {assignment.status}
                </Badge>
              </div>

              <div className="space-y-4 pt-4 border-t border-accent/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ data: { id, status: 'Confirmed' } })}
                    className="rounded-none border-green-500/20 hover:bg-green-500/10 text-green-500 text-[9px] uppercase font-bold tracking-widest"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-2" /> Confirm
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ data: { id, status: 'Declined' } })}
                    className="rounded-none border-red-500/20 hover:bg-red-500/10 text-red-500 text-[9px] uppercase font-bold tracking-widest"
                  >
                    <XCircle className="w-3 h-3 mr-2" /> Decline
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-background border border-accent/5">
                  <User className="w-5 h-5 text-accent/40" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Team Member</p>
                    <p className="text-sm font-bold uppercase tracking-wider">{(assignment as any).profiles?.full_name || 'Assigned Member'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 p-4 bg-background border border-accent/5">
                  <Shield className="w-5 h-5 text-accent/40" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Assigned Role</p>
                    <p className="text-sm font-bold uppercase tracking-wider">{assignment.role}</p>
                  </div>
               </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Service Context</h3>
            
            <div className="space-y-4">
               <div className="flex items-center gap-4 p-4 bg-background border border-accent/5">
                  <Calendar className="w-5 h-5 text-accent/40" />
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Service Date</p>
                    <p className="text-sm font-bold uppercase tracking-wider">Scheduled Service</p>
                  </div>
               </div>
               <Button asChild variant="link" className="text-accent text-[10px] uppercase font-bold tracking-widest p-0">
                  <Link to="/dashboard/schedule">
                    View Entire Roster <ArrowRight className="w-3 h-3 ml-2" />
                  </Link>
               </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
