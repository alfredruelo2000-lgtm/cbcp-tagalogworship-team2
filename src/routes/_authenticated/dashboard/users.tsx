import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Users,
  Search,
  MoreVertical,
  Shield,
  UserCheck,
  Loader2,
  Lock,
  Unlock,
  UserX,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

const ROLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'viewer', label: 'Member' },
  { value: 'team_member', label: 'Worship Team' },
  { value: 'worship_leader', label: 'Leader' },
  { value: 'worship_director', label: 'Worship Director' },
  { value: 'worship_pastor', label: 'Worship Pastor' },
  { value: 'ministry_admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const roleLabel = (role?: string) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? (role ?? 'member').replace(/_/g, ' ');

type TabKey = 'pending' | 'approved' | 'rejected';

const APPROVED_STATUSES = ['Active', 'Available', 'Limited Availability', 'On Break'];
const REJECTED_STATUSES = ['Suspended', 'Inactive', 'Archived'];

const tabOf = (status: string | null): TabKey => {
  if (status && REJECTED_STATUSES.includes(status)) return 'rejected';
  if (status && APPROVED_STATUSES.includes(status)) return 'approved';
  return 'pending';
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function UserManagementPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);

      if (profileError) throw profileError;
      if (roleError) throw roleError;

      setUsers(
        (profiles as UserProfile[] ?? []).map((profile) => ({
          ...profile,
          role: (roles ?? []).find((r) => r.user_id === profile.id)?.role || 'viewer',
        })),
      );
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Newly registered accounts appear without a manual refresh.
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin-user-accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => void fetchUsers())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchUsers]);

  const updateStatus = async (userId: string, newStatus: string, message: string) => {
    setBusyId(userId);
    // Optimistic: reflect the new state immediately, then confirm against the database.
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus as any }).eq('id', userId);
      if (error) throw error;
      toast.success(message);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
      await fetchUsers();
    } finally {
      setBusyId(null);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    setBusyId(userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (deleteError) throw deleteError;
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      if (error) throw error;
      toast.success(`Role set to ${roleLabel(role)}`);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
      console.error(error);
      await fetchUsers();
    } finally {
      setBusyId(null);
    }
  };

  const counts = useMemo(
    () =>
      users.reduce(
        (acc, u) => {
          acc[tabOf(u.status)] += 1;
          return acc;
        },
        { pending: 0, approved: 0, rejected: 0 } as Record<TabKey, number>,
      ),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (tabOf(user.status) !== tab) return false;
      if (!q) return true;
      return (
        (user.full_name?.toLowerCase().includes(q) ?? false) ||
        (user.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, tab, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <Lock className="w-12 h-12 text-accent mx-auto mb-6 opacity-20" />
        <h2 className="font-serif text-3xl mb-4">Access Restricted</h2>
        <p className="text-muted-foreground">Only Super Admins can manage system users.</p>
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected / Disabled' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-8 space-y-8 sm:px-6 lg:py-12 animate-in fade-in duration-500">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            System Administration
          </Badge>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl lg:text-5xl">User Accounts</h1>
          <p className="text-muted-foreground text-sm">
            Approve new sign-ups, assign roles, and manage ministry access.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => void fetchUsers()}
            className="h-11 w-11 rounded-none border-accent/20 text-accent"
            aria-label="Refresh users"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button asChild className="h-11 rounded-none bg-accent px-5 font-bold text-[10px] uppercase tracking-widest text-primary hover:bg-accent/90">
            <Link to="/dashboard/users/new">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Link>
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex min-h-[44px] shrink-0 items-center gap-2 border px-4 text-[10px] font-bold uppercase tracking-widest transition-colors',
              tab === t.key
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-accent/10 text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <span className="rounded-none bg-muted/40 px-1.5 py-0.5 text-[10px] tabular-nums">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="h-12 rounded-none border-accent/10 bg-background pl-10 text-[11px] uppercase tracking-wider focus-visible:ring-accent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-accent/40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Retrieving Users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <p className="border border-accent/5 bg-background py-16 text-center text-sm italic text-muted-foreground">
          No accounts in this list.
        </p>
      ) : (
        <ul className="divide-y divide-accent/5 border border-accent/5 bg-background">
          {filteredUsers.map((user) => (
            <li key={user.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" loading="lazy" className="h-10 w-10 shrink-0 border border-accent/10 object-cover" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center border border-accent/10 bg-muted/20 text-accent/40">
                    <Users className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-base leading-tight">{user.full_name || 'Anonymous'}</h3>
                  <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-none text-[8px] uppercase tracking-widest',
                        user.auth_provider === 'google'
                          ? 'border-blue-400/30 text-blue-500'
                          : 'border-accent/20 text-accent/70',
                      )}
                    >
                      {user.auth_provider === 'google' ? 'Google' : 'Email'}
                    </Badge>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      Joined {formatDate(user.created_at)}
                    </span>
                    <Badge
                      className={cn(
                        'rounded-none border-none text-[8px] font-bold uppercase tracking-widest',
                        tabOf(user.status) === 'approved'
                          ? 'bg-green-500/10 text-green-600'
                          : tabOf(user.status) === 'rejected'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-accent/10 text-accent',
                      )}
                    >
                      {user.status || 'Pending'}
                    </Badge>
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Shield className="h-3 w-3 text-accent/40" /> {roleLabel(user.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Select value={user.role} onValueChange={(role) => void updateRole(user.id, role)} disabled={busyId === user.id}>
                  <SelectTrigger className="hidden h-11 w-[150px] rounded-none border-accent/10 text-[10px] font-bold uppercase tracking-widest sm:flex">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-[11px] uppercase tracking-wider">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none text-accent/50 hover:text-accent">
                      {busyId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-none border-accent/10 bg-primary text-primary-foreground">
                    <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-accent/50">
                      Manage Account
                    </DropdownMenuLabel>

                    {tabOf(user.status) !== 'approved' && (
                      <DropdownMenuItem
                        onClick={() => void updateStatus(user.id, 'Active', 'Account approved')}
                        className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-green-400 focus:bg-green-400/10 focus:text-green-400"
                      >
                        <Unlock className="mr-2 h-3 w-3" /> Approve
                      </DropdownMenuItem>
                    )}

                    {tabOf(user.status) !== 'rejected' && (
                      <DropdownMenuItem
                        onClick={() => void updateStatus(user.id, 'Suspended', 'Account rejected / disabled')}
                        className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-400/10 focus:text-red-400"
                      >
                        <UserX className="mr-2 h-3 w-3" /> Reject / Disable
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-accent/10" />
                    <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-accent/50">
                      Assign Role
                    </DropdownMenuLabel>
                    {ROLE_OPTIONS.map((r) => (
                      <DropdownMenuItem
                        key={r.value}
                        onClick={() => void updateRole(user.id, r.value)}
                        className={cn(
                          'cursor-pointer text-[10px] font-bold uppercase tracking-widest focus:bg-accent focus:text-primary',
                          user.role === r.value && 'text-accent',
                        )}
                      >
                        <UserCheck className="mr-2 h-3 w-3" /> {r.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
