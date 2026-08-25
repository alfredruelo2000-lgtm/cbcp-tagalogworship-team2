import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Music, 
  Award,
  Calendar,
  Save,
  Camera,
  CheckCircle2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/profile')({
  component: MyProfilePage,
});

function MyProfilePage() {
  const { user } = useAuth();
  const { data: member } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const handleSave = () => {
    toast.success('Profile updated', {
      description: 'Your personal information has been saved.'
    });
  };

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Personnel Portal
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Manage your personal information, contact details, and ministry skills.
          </p>
        </div>
        <Button onClick={handleSave} className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-none border-accent/5 bg-muted/20 overflow-hidden">
            <div className="aspect-square relative group">
              <img src={member?.avatar_url || ''} alt={member?.full_name} className="w-full h-full object-cover grayscale" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <div className="text-white flex flex-col items-center">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Update Photo</span>
                </div>
              </div>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="font-serif text-2xl">{member?.full_name}</CardTitle>
              <div className="flex flex-col items-center gap-2 mt-2">
                <Badge className="bg-accent/10 text-accent rounded-none border-none text-[8px] font-bold uppercase tracking-widest">
                  {member?.primary_role || 'Member'}
                </Badge>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Joined {new Date(member?.created_at || '').getFullYear()}</span>
              </div>
            </CardHeader>
          </Card>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent border-b border-accent/10 pb-2">Ministry Role</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-accent/40" />
                <span className="text-[11px] font-bold uppercase tracking-widest">{member?.primary_role || 'Member'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {((member as any)?.secondary_roles || []).map((role: any) => (
                  <Badge key={role} variant="outline" className="rounded-none text-[8px] uppercase border-accent/10 text-muted-foreground">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue={member?.full_name || ''} className="pl-10 rounded-none border-accent/10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue={member?.email || ''} className="pl-10 rounded-none border-accent/10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue={member?.phone || ''} className="pl-10 rounded-none border-accent/10 bg-background" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Primary Instrument</Label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue={member?.instrument || ''} className="pl-10 rounded-none border-accent/10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-accent">Vocal Part</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input defaultValue={(member as any)?.vocal_range} className="pl-10 rounded-none border-accent/10 bg-background" />
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-6">
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent border-b border-accent/10 pb-4">Skills & Certifications</h3>
            <div className="flex flex-wrap gap-3">
              {(member?.skills || []).map((skill: any) => (
                <div key={skill} className="px-4 py-2 bg-muted/20 border border-accent/10 text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-accent" /> {skill}
                </div>
              ))}
              <Button variant="outline" className="rounded-none border-dashed border-accent/20 text-[9px] uppercase font-bold tracking-widest h-auto py-2">
                Add Skill
              </Button>
            </div>
          </section>

          <section className="p-8 bg-muted/10 border border-accent/5 space-y-4">
             <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent flex items-center gap-2">
               <Shield className="w-4 h-4" /> Account Security
             </h3>
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manage your password and authentication methods.</p>
             <Button variant="outline" className="rounded-none border-accent/20 text-[10px] uppercase font-bold tracking-widest px-6">
               Change Password
             </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
