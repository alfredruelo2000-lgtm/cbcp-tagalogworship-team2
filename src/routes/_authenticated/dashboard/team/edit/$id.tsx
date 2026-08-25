import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Mail, Shield, Music, Loader2, Trash2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { updateMember, getTeamMembers, deleteMember } from '@/lib/db-team.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/team/edit/$id')({
  component: EditTeamMemberPage,
});

function EditTeamMemberPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: team = [], isLoading: isFetching } = useQuery({
    queryKey: ['team-full'],
    queryFn: () => getTeamMembers(),
  });

  const member = team.find((m: any) => m.id === id);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    primary_role: '',
    instruments: '',
    status: 'Active',
    is_public: true,
    avatar_url: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        email: member.email || '',
        primary_role: member.primary_role || '',
        instruments: Array.isArray(member.instrument) ? member.instrument.join(', ') : (member.instrument || ''),
        status: member.status || 'Active',
        is_public: member.is_public ?? true,
        avatar_url: member.avatar_url || ''
      });
    }
  }, [member]);

  const mutation = useMutation({
    mutationFn: (updates: any) => updateMember({ data: { id: id as string, updates } }),
    onSuccess: () => {
      toast.success('Personnel profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-full'] });
      queryClient.invalidateQueries({ queryKey: ['team-public'] });
      navigate({ to: '/dashboard/team/$id', params: { id } });
    },
    onError: (error) => {
      toast.error('Failed to update member: ' + (error as Error).message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMember({ id: id as string }),
    onSuccess: () => {
      toast.success('Personnel profile deleted permanently.');
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-full'] });
      queryClient.invalidateQueries({ queryKey: ['team-public'] });
      navigate({ to: '/dashboard/team' });
    },
    onError: (error) => {
      toast.error('Failed to delete profile: ' + (error as Error).message);
    }
  });

  const handleSubmit = () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    // Map instruments back to array for skills/instruments
    const instrumentArr = formData.instruments.split(',').map(s => s.trim()).filter(Boolean);
    const updates = {
      full_name: formData.full_name,
      email: formData.email,
      primary_role: formData.primary_role,
      status: formData.status,
      is_public: formData.is_public,
      avatar_url: formData.avatar_url,
      instrument: instrumentArr.join(', '), // DB column is text
      skills: instrumentArr // DB column is ARRAY
    };

    mutation.mutate(updates);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to PERMANENTLY delete this personnel profile? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isFetching) return <div className="p-24 text-center text-[10px] uppercase tracking-widest text-accent animate-pulse">Loading profile...</div>;
  if (!member) return <div className="p-24 text-center text-[10px] uppercase tracking-widest text-muted-foreground">Profile not found</div>;

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Update Personnel Profile
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Edit {member.full_name}</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || mutation.isPending}
            className="rounded-none border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Profile
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={mutation.isPending || deleteMutation.isPending}
            className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Profile Image</h3>
            <div className="max-w-[200px]">
              <ImageUpload 
                value={formData.avatar_url}
                onChange={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                bucket="personnel-avatars"
              />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Personal Information</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
              <Input 
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="rounded-none border-accent/10 bg-background" 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-none border-accent/10 bg-background" 
              />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Ministry Assignment</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Role</Label>
              <Select value={formData.primary_role} onValueChange={(v) => setFormData(prev => ({ ...prev, primary_role: v }))}>
                <SelectTrigger className="rounded-none border-accent/10 bg-background text-[11px] uppercase tracking-wider">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="vocalist" className="text-[11px] uppercase tracking-wider">Vocalist</SelectItem>
                  <SelectItem value="musician" className="text-[11px] uppercase tracking-wider">Musician (Instrumentalist)</SelectItem>
                  <SelectItem value="production" className="text-[11px] uppercase tracking-wider">Production / Technical Team</SelectItem>
                  <SelectItem value="leader" className="text-[11px] uppercase tracking-wider">Worship Leader</SelectItem>
                  <SelectItem value="multimedia" className="text-[11px] uppercase tracking-wider">Multimedia / Livestream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Instrument / Skill</Label>
              <Input 
                value={formData.instruments}
                onChange={(e) => setFormData(prev => ({ ...prev, instruments: e.target.value }))}
                placeholder="e.g. Acoustic Guitar, Soprano" 
                className="rounded-none border-accent/10 bg-background" 
              />
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Public Visibility</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                  className={`rounded-none text-[8px] uppercase tracking-widest font-bold ${formData.is_public ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-accent'}`}
                >
                  {formData.is_public ? 'Public' : 'Hidden'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
