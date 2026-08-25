import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Shield, 
  UserCheck, 
  Mail,
  Loader2,
  Lock,
  Unlock,
  UserX,
  Link2,
  Plus

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/dashboard/users')({
  component: UserManagementPage,
});

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: string | null;
  auth_provider: string | null;
  team_member_id: string | null;
  created_at: string;
  role?: string;
};

function UserManagementPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch all roles to map them
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('*');

      if (roleError) throw roleError;

      const mappedUsers = (profiles as UserProfile[]).map(profile => ({
        ...profile,
        role: roles.find(r => r.user_id === profile.id)?.role || 'viewer'
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus as any })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRole = async (role: string) => {
    if (!selectedUser) return;
    setUpdating(true);
    try {
      // Delete old roles and insert new one
      await supabase.from('user_roles').delete().eq('user_id', selectedUser.id);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: role as any });

      if (error) throw error;
      
      toast.success('User role updated successfully');
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update role');
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <Lock className="w-12 h-12 text-accent mx-auto mb-6 opacity-20" />
        <h2 className="font-serif text-3xl mb-4">Access Restricted</h2>
        <p className="text-muted-foreground">Only Super Admins can manage system users.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            System Administration
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">User Accounts</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Manage system access, roles, and permissions. Link accounts to worship team profiles.
          </p>
        </div>
        <Button asChild className="rounded-none bg-accent text-primary hover:bg-accent/90 px-8 py-6 font-bold text-[10px] uppercase tracking-widest shadow-xl">
          <Link to="/dashboard/users/new">
            <Plus className="w-4 h-4 mr-2" /> Add New User
          </Link>
        </Button>
      </header>


      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/20 p-6 border border-accent/5">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 rounded-none border-accent/10 focus-visible:ring-accent bg-background text-[11px] uppercase tracking-wider"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] rounded-none border-accent/10 bg-background text-[10px] font-bold uppercase tracking-widest">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">All Roles</SelectItem>
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

      <div className="border border-accent/5 bg-background overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-accent/40">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Retrieving Users...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-accent/5">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">User</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Provider</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">System Role</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-accent/50 py-6 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic text-sm">
                    No users found matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group border-accent/5 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-none border border-accent/10" />
                        ) : (
                          <div className="w-10 h-10 bg-muted/20 flex items-center justify-center border border-accent/10 text-accent/40">
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-serif text-lg leading-tight">{user.full_name || 'Anonymous'}</h3>
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        {user.auth_provider === 'google' ? (
                          <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest border-blue-400/20 text-blue-400">
                            Google
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none text-[8px] uppercase tracking-widest border-accent/20 text-accent/60">
                            Email
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-accent/40" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-6">
                      <Badge className={cn(
                        "rounded-none border-none text-[8px] font-bold uppercase tracking-widest",
                        user.status === 'Active' ? "bg-green-500/10 text-green-500" : 
                        user.status === 'Pending' ? "bg-accent/10 text-accent" :
                        user.status === 'Suspended' ? "bg-red-500/10 text-red-500" :
                        "bg-muted-foreground/10 text-muted-foreground"
                      )}>
                        {user.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent/40 hover:text-accent rounded-none">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-none border-accent/10 bg-primary text-primary-foreground">
                          <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-accent/50 font-bold">Manage User</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRoleDialogOpen(true);
                            }}
                            className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 mr-2" /> Change Role
                          </DropdownMenuItem>
                          
                          {user.status === 'Pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(user.id, 'Active')}
                              className="text-[10px] uppercase tracking-widest font-bold text-green-400 focus:bg-green-400/10 focus:text-green-400 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3 mr-2" /> Approve User
                            </DropdownMenuItem>
                          )}

                          {user.status === 'Active' && (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(user.id, 'Suspended')}
                              className="text-[10px] uppercase tracking-widest font-bold text-red-400 focus:bg-red-400/10 focus:text-red-400 cursor-pointer"
                            >
                              <UserX className="w-3 h-3 mr-2" /> Suspend Account
                            </DropdownMenuItem>
                          )}

                          {user.status === 'Suspended' && (
                            <DropdownMenuItem 
                              onClick={() => handleUpdateStatus(user.id, 'Active')}
                              className="text-[10px] uppercase tracking-widest font-bold text-green-400 focus:bg-green-400/10 focus:text-green-400 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3 mr-2" /> Reactivate Account
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="bg-accent/10" />
                          <DropdownMenuItem className="text-[10px] uppercase tracking-widest font-bold focus:bg-accent focus:text-primary cursor-pointer">
                            <Link2 className="w-3 h-3 mr-2" /> Link to Team Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="rounded-none bg-primary border-accent/20 text-primary-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Change System Role</DialogTitle>
            <DialogDescription className="text-accent/60 text-[11px] uppercase tracking-widest">
              Update {selectedUser?.full_name}'s permissions
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <Select 
              value={selectedUser?.role as string} 
              onValueChange={handleUpdateRole}
              disabled={updating}
            >
              <SelectTrigger className="w-full rounded-none border-accent/10 bg-background text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="Select a role" />
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
            <p className="text-[10px] text-accent/40 leading-relaxed italic">
              Super Admins have full access to all system settings, user management, and ministry content.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRoleDialogOpen(false)}
              className="rounded-none border-accent/20 text-accent uppercase tracking-widest text-[9px] font-bold"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
