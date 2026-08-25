import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTeamMembers, updateMember } from '@/lib/db-team.functions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Calendar, User, Shield, ExternalLink, Edit } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/team/$id')({
  component: MemberDetailsPage,
});

function MemberDetailsPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  
  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team-full'],
    queryFn: () => getTeamMembers(),
  });

  const member = team.find((m: any) => m.id === id);

  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateMember({ data: { id: id as string, updates } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-full'] });
      toast.success('Member updated successfully');
    },
    onError: () => {
      toast.error('Failed to update member');
    }
  });

  if (isLoading) return <div className="p-24 text-center text-[10px] uppercase tracking-widest text-accent animate-pulse">Retrieving profile...</div>;
  if (!member) return <div className="p-24 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Profile not found</div>;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-accent/5 pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 bg-accent/10 border border-accent/20 flex items-center justify-center font-serif text-accent text-5xl shrink-0">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover grayscale" />
            ) : (
              member.full_name.charAt(0)
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="rounded-none bg-accent/10 text-accent border-none uppercase text-[9px] tracking-widest">
                {member.status || 'Active'}
              </Badge>
              {member.is_public && (
                <Badge variant="outline" className="rounded-none text-muted-foreground border-accent/10 uppercase text-[8px]">Public Bio</Badge>
              )}
            </div>
            <h1 className="font-serif text-5xl text-foreground">{member.full_name}</h1>
            <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <span className="flex items-center gap-2"><Shield className="w-3 h-3 text-accent" /> {member.primary_role || 'No Role Assigned'}</span>
              <span className="flex items-center gap-2"><User className="w-3 h-3 text-accent" /> {member.instrument || 'Vocalist'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-none border-accent/20 px-8 py-6 font-bold text-[10px] uppercase tracking-widest" asChild>
            <Link to="/dashboard/team">
              <ArrowLeft className="w-4 h-4 mr-2" /> All Members
            </Link>
          </Button>
          <Button className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl" asChild>
            <Link to="/dashboard/team/edit/$id" params={{ id: member.id }}>
              <Edit className="w-4 h-4 mr-2" /> Update Profile
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Biography</h3>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {member.bio || 'No public biography has been provided for this team member.'}
            </p>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Internal Notes</h3>
            <div className="p-8 bg-muted/20 border border-accent/5">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                {member.internal_notes || 'No administrative notes recorded.'}
              </p>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="p-8 bg-muted/10 border border-accent/5 space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Email Address</p>
                  <p className="text-sm">{member.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-sm">{member.phone || 'Not Provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Date Joined</p>
                  <p className="text-sm">{member.date_joined ? new Date(member.date_joined).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 border border-accent/5 space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent">Availability Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-accent/5">
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Current Status</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-accent">{member.status || 'Active'}</span>
              </div>
              <Button variant="ghost" className="w-full justify-start rounded-none text-[8px] uppercase tracking-[0.2em] h-10 hover:bg-accent/5">
                <ExternalLink className="w-3 h-3 mr-2" /> View Full Schedule
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}