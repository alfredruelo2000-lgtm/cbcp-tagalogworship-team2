import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, User, Mail, Shield, Music, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMember } from '@/lib/db-team.functions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/team_new')({
  component: AddTeamMemberPage,
});

function AddTeamMemberPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    primary_role: '',
    instruments: '',
    status: 'Active' as const,
    is_public: true,
    avatar_url: ''
  });

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      toast.success('Personnel profile created successfully.');
      // Invalidate all relevant queries to ensure instant sync
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-public'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // Small delay to ensure DB sync before navigation
      setTimeout(() => {
        navigate({ to: '/dashboard/team' });
      }, 500);
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to add member';
      toast.error(message);
      setErrors({ root: message });
    }
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name) newErrors['full_name'] = 'Full name is required';
    if (!formData.email) newErrors['email'] = 'Email address is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors['email'] = 'Invalid email format';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    mutation.mutate({ data: formData });
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Worship Team Personnel Profile
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => navigate({ to: '/dashboard/team' })}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Add Team Profile</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">
            Create a ministry personnel profile (vocalist, musician, tech). This profile represents a team member's role and skills, independent of their system login account.
          </p>
        </div>
        <Button 
          onClick={() => handleSubmit()}
          disabled={mutation.isPending}
          className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Create Profile
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Profile Image</h3>
            <div className="max-w-[200px]">
              <ImageUpload 
                value={formData.avatar_url}
                onChange={(url) => {
                  setFormData(prev => ({ ...prev, avatar_url: url }));
                  setErrors(prev => {
                    const next = { ...prev };
                    delete next['avatar'];
                    return next;
                  });
                }}
                bucket="personnel-avatars"
              />
              {errors['avatar'] && <p className="mt-2 text-[9px] text-red-500 uppercase tracking-widest font-bold">{errors['avatar']}</p>}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Personal Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="full_name_input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="full_name_input"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="John Doe" 
                  className={cn("pl-10 rounded-none border-accent/10 bg-background", errors['full_name'] && "border-red-500")}
                  autoComplete="off"
                />
              </div>
              {errors['full_name'] && <p className="text-[9px] text-red-500 uppercase tracking-widest font-bold">{errors['full_name']}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email_input"
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com" 
                  className={cn("pl-10 rounded-none border-accent/10 bg-background", errors['email'] && "border-red-500")}
                  autoComplete="off"
                />
              </div>
              {errors['email'] && <p className="text-[9px] text-red-500 uppercase tracking-widest font-bold">{errors['email']}</p>}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Ministry Assignment</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select value={formData.primary_role} onValueChange={(v) => setFormData(prev => ({ ...prev, primary_role: v }))}>
                  <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background text-[11px] uppercase tracking-wider">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="instruments_input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Instrument / Skill</Label>
              <div className="relative">
                <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="instruments_input"
                  name="instruments"
                  value={formData.instruments}
                  onChange={(e) => setFormData(prev => ({ ...prev, instruments: e.target.value }))}
                  placeholder="e.g. Acoustic Guitar, Soprano, ProPresenter" 
                  className="pl-10 rounded-none border-accent/10 bg-background" 
                  autoComplete="off"
                />
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
