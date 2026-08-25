import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Mail, User, Shield, Lock } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/dashboard/users/new')({
  component: AddUserPage,
});

function AddUserPage() {
  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            System Administration
          </Badge>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-accent rounded-none" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-serif text-5xl text-foreground">Register User</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl ml-14">
            Create a new system account. Users will receive an email invitation to set their password.
          </p>
        </div>
        <Button className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
          <Save className="w-4 h-4 mr-2" /> Send Invitation
        </Button>
      </header>

      <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 ml-14">
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Account Identity</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Full Name" className="pl-10 rounded-none border-accent/10 bg-background" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="email@example.com" className="pl-10 rounded-none border-accent/10 bg-background" />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent border-b border-accent/10 pb-2">Permissions</h3>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Select>
                  <SelectTrigger className="pl-10 rounded-none border-accent/10 bg-background">
                    <SelectValue placeholder="Assign Role..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="ministry_admin">Ministry Admin</SelectItem>
                    <SelectItem value="worship_director">Worship Director</SelectItem>
                    <SelectItem value="worship_leader">Worship Leader</SelectItem>
                    <SelectItem value="team_member">Team Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 bg-muted/20 border border-accent/5 space-y-4">
               <div className="flex items-center gap-3 text-accent">
                 <Lock className="w-4 h-4" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest">Security Notice</h3>
               </div>
               <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                 New accounts are created in 'Pending' status. The user must verify their email address before they can access the dashboard. 
                 Admins can manually approve or suspend accounts at any time.
               </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

