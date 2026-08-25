import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar, User, Shield, Clock, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices } from '@/lib/db-services.functions';
import { getTeamMembers, createAssignment } from '@/lib/db-team.functions';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/schedule/new')({
  component: AddSchedulePage,
});

function AddSchedulePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    service_id: '',
    member_id: '',
    role: '',
    status: 'Pending',
    notes: ''
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services-upcoming-schedule'],
    queryFn: () => getServices()
  });

  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team-members-schedule'],
    queryFn: getTeamMembers
  });

  const mutation = useMutation({
    mutationFn: createAssignment,
    onMutate: async (newAssignment: any) => {
      await queryClient.cancelQueries({ queryKey: ['service-assignments'] });
      const previousAssignments = queryClient.getQueryData(['service-assignments']);
      
      const optimisticAssignment = {
        id: crypto.randomUUID(),
        ...newAssignment,
        status: newAssignment.status || 'Pending',
        created_at: new Date().toISOString()
      };

      queryClient.setQueryData(['service-assignments'], (old: any[]) => [optimisticAssignment, ...(old || [])]);
      
      return { previousAssignments };
    },
    onSuccess: () => {
      toast.success('Assignment created successfully');
      navigate({ to: '/dashboard/schedule' });
    },
    onError: (error: any, newAssignment, context: any) => {
      queryClient.setQueryData(['service-assignments'], context.previousAssignments);
      toast.error('Failed to create assignment: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['service-assignments'] });
    }
  });

  const handleSubmit = () => {
    if (!formData.service_id || !formData.member_id || !formData.role) {
      toast.error('Service, member, and role are required');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Personnel Planning
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Schedule Team</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">
            Assign ministry members to upcoming services. Roster updates reflect instantly on team dashboards.
          </p>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Send Invites
        </Button>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Service Context</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Service</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={formData.service_id} onValueChange={(v) => setFormData(prev => ({ ...prev, service_id: v }))}>
                  <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Select Service..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title} ({s.serviceDate})</SelectItem>
                    ))}
                    {services.length === 0 && <SelectItem value="none" disabled>No upcoming services</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Individual Assignment</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Member</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={formData.member_id} onValueChange={(v) => setFormData(prev => ({ ...prev, member_id: v }))}>
                  <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Search Member..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {team.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assignment Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v }))}>
                  <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Assign Role..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Worship Leader">Worship Leader</SelectItem>
                    <SelectItem value="Vocalist">Vocalist</SelectItem>
                    <SelectItem value="Acoustic Guitar">Acoustic Guitar</SelectItem>
                    <SelectItem value="Electric Guitar">Electric Guitar</SelectItem>
                    <SelectItem value="Bass Guitar">Bass Guitar</SelectItem>
                    <SelectItem value="Drums">Drums</SelectItem>
                    <SelectItem value="Keys / Synth">Keys / Synth</SelectItem>
                    <SelectItem value="ProPresenter">ProPresenter</SelectItem>
                    <SelectItem value="Sound Engineer">Sound Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 bg-muted/20 border border-accent/5 space-y-3">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent">Notification</h3>
               <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                 An automated email and system notification will be sent to the member upon saving this assignment, requesting their confirmation.
               </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


