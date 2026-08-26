import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  UserX,
  Shield,
  ArrowRight,
  Archive,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { deleteMember } from '@/lib/db-team.functions';
import { MEMBER_STATUSES, TEAM_ROLES, initials, memberDisplayName, normalizeRole } from '@/lib/team-roles';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/dashboard/team')({
  component: TeamManagementPage,
});

function TeamManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: team = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('display_order', { ascending: true })
        .order('full_name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_assignments').select('user_id');
      if (error) throw error;
      return data ?? [];
    },
  });

  const assignmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assignments as any[]) {
      if (a.user_id) counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1);
    }
    return counts;
  }, [assignments]);

  const ordered = useMemo(() => (team as any[]).slice(), [team]);

  const duplicates = useMemo(() => {
    const byName = new Map<string, any[]>();
    for (const m of ordered) {
      const key = (m.full_name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key) continue;
      byName.set(key, [...(byName.get(key) ?? []), m]);
    }
    return Array.from(byName.values()).filter((group) => group.length > 1);
  }, [ordered]);

  const filteredTeam = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ordered.filter((member: any) => {
      if (statusFilter !== 'all' && member.status !== statusFilter) return false;
      if (roleFilter !== 'all' && normalizeRole(member.primary_role) !== roleFilter) return false;
      if (!q) return true;
      const haystack = [member.full_name, member.public_name, member.email, member.primary_role, member.instrument, ...(member.skills ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [ordered, searchQuery, statusFilter, roleFilter]);

  const invalidateTeam = () => {
    queryClient.invalidateQueries({ queryKey: ['team'] });
    queryClient.invalidateQueries({ queryKey: ['team-full'] });
    queryClient.invalidateQueries({ queryKey: ['team-public'] });
  };

  const navigateToMember = (id: string) => {
    navigate({ to: '/dashboard/team/$id', params: { id } });
  };

  const navigateToMemberEdit = (id: string) => {
    navigate({ to: '/dashboard/team/edit/$id', params: { id } });
  };

  const reorderMutation = useMutation({
    mutationFn: async (rows: Array<{ id: string; display_order: number }>) => {
      await Promise.all(
        rows.map(({ id, display_order }) =>
          supabase
            .from('profiles')
            .update({ display_order })
            .eq('id', id)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
    },
    onSuccess: () => {
      invalidateTeam();
    },
    onError: (error: any) => toast.error('Failed to reorder: ' + error.message),
  });

  const isReordering = reorderMutation.isPending;
  const canReorder = statusFilter === 'all' && roleFilter === 'all' && !searchQuery.trim();

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = index + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.slice();
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    // Renumber everyone so ordering never collides on equal/duplicate values.
    reorderMutation.mutate(next.map((m: any, i: number) => ({ id: m.id, display_order: i + 1 })));
  };

  const updateMemberField = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('profiles').update(updates as never).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['team'] });
      await queryClient.cancelQueries({ queryKey: ['team-full'] });
      const previousTeam = queryClient.getQueryData<any[]>(['team']);
      const previousTeamFull = queryClient.getQueryData<any[]>(['team-full']);
      const applyPatch = (rows?: any[]) => rows?.map((row) => (row.id === id ? { ...row, ...updates } : row));
      if (previousTeam) queryClient.setQueryData(['team'], applyPatch(previousTeam));
      if (previousTeamFull) queryClient.setQueryData(['team-full'], applyPatch(previousTeamFull));
      return { previousTeam, previousTeamFull };
    },
    onSuccess: () => {
      invalidateTeam();
      toast.success('Profile updated');
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousTeam) queryClient.setQueryData(['team'], context.previousTeam);
      if (context?.previousTeamFull) queryClient.setQueryData(['team-full'], context.previousTeamFull);
      toast.error('Update failed: ' + error.message);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => deleteMember({ id }),
    onSuccess: () => {
      invalidateTeam();
      toast.success('Member deleted');
    },
    onError: (error: any) => toast.error('Failed to delete member: ' + error.message),
  });

  const handleArchive = (id: string) => {
    if (confirm('Archive this team member? They will be removed from the public directory.')) {
      updateMemberField.mutate({ id, updates: { status: 'Archived', is_public: false } });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Permanently delete this personnel profile? This cannot be undone.')) {
      deleteMemberMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Worship Personnel Profiles</p>
          <h1 className="font-serif text-2xl leading-tight text-foreground sm:text-4xl">Worship Team Management</h1>
          <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm">
            Manage profiles, roles, ordering and visibility on the public Team page.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 rounded-none bg-accent px-4 py-5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90 sm:px-8 sm:py-6"
        >
          <Link to="/dashboard/team_new">
            <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Team Member</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      </header>

      {duplicates.length > 0 && (
        <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0 space-y-1 text-xs">
            <p className="font-bold uppercase tracking-widest text-amber-500">Possible duplicate profiles</p>
            <p className="text-muted-foreground">
              {duplicates.map((group) => group[0].full_name).join(', ')} — review and hide or delete the extra entry so the
              public directory shows each person once.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3 border border-accent/5 bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_170px_170px]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members, roles or skills..."
            className="h-10 rounded-none border-accent/10 bg-background pl-9 text-sm focus-visible:ring-accent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-10 rounded-none border-accent/10 bg-background text-[10px] font-bold uppercase tracking-widest">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All roles</SelectItem>
            {TEAM_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
            <SelectItem value="Team Member">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 rounded-none border-accent/10 bg-background text-[10px] font-bold uppercase tracking-widest">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">All statuses</SelectItem>
            {MEMBER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!canReorder && (
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Clear search and filters to reorder members.
        </p>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 lg:hidden">
        {isLoading ? (
          <p className="py-12 text-center text-[10px] uppercase tracking-widest text-accent">Loading team...</p>
        ) : filteredTeam.length === 0 ? (
          <p className="py-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
            No team members found.
          </p>
        ) : (
          filteredTeam.map((member: any) => {
            const index = ordered.findIndex((m: any) => m.id === member.id);
            return (
              <div key={member.id} className="border border-accent/5 bg-background p-3">
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <MemberAvatar member={member} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base leading-tight">{memberDisplayName(member)}</p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-accent">
                      {normalizeRole(member.primary_role)}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{member.email || 'No email linked'}</p>
                  </div>
                  <RowMenu
                    member={member}
                    busy={updateMemberField.isPending || deleteMemberMutation.isPending}
                    onView={navigateToMember}
                    onEdit={navigateToMemberEdit}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onToggleVisibility={() =>
                      updateMemberField.mutate({ id: member.id, updates: { is_public: !member.is_public } })
                    }
                    onSetStatus={(status) => updateMemberField.mutate({ id: member.id, updates: { status } })}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={member.status} />
                  <VisibilityBadge isPublic={member.is_public} />
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                    {assignmentCounts.get(member.id) ?? 0} assignments
                  </span>
                  {canReorder && (
                    <span className="ml-auto flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-none border-accent/10"
                        disabled={index === 0 || isReordering}
                        onClick={() => handleMove(index, 'up')}
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-none border-accent/10"
                        disabled={index === ordered.length - 1 || isReordering}
                        onClick={() => handleMove(index, 'down')}
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-accent/5 bg-background lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-accent/5 hover:bg-transparent">
              <TableHead className="w-[60px] px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">
                Order
              </TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Member</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Primary Role</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Skills</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Assignments</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Public</TableHead>
              <TableHead className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-accent/50">Status</TableHead>
              <TableHead className="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-accent/50">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-[10px] uppercase tracking-widest text-accent">
                  <Loader2 className="mr-2 inline h-3 w-3 animate-spin" /> Loading team members...
                </TableCell>
              </TableRow>
            ) : filteredTeam.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTeam.map((member: any) => {
                const index = ordered.findIndex((m: any) => m.id === member.id);
                return (
                  <TableRow key={member.id} className="group border-accent/5 transition-colors hover:bg-muted/10">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none text-accent/30 hover:bg-accent/5 hover:text-accent disabled:opacity-20"
                          onClick={() => handleMove(index, 'up')}
                          disabled={!canReorder || index === 0 || isReordering}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none text-accent/30 hover:bg-accent/5 hover:text-accent disabled:opacity-20"
                          onClick={() => handleMove(index, 'down')}
                          disabled={!canReorder || index === ordered.length - 1 || isReordering}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <MemberAvatar member={member} className="h-10 w-10" />
                        <div className="min-w-0">
                          <h3 className="truncate font-serif text-lg leading-tight">{memberDisplayName(member)}</h3>
                          <p className="truncate text-[9px] uppercase tracking-widest text-muted-foreground">
                            {member.email || 'No email linked'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-accent/40" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">
                          {normalizeRole(member.primary_role)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(member.skills ?? []).slice(0, 2).map((skill: string) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="rounded-none border-accent/10 text-[8px] uppercase tracking-tight text-muted-foreground"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {(member.skills ?? []).length > 2 && (
                          <span className="text-[8px] text-accent">+{(member.skills ?? []).length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        {assignmentCounts.get(member.id) ?? 0} total
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => updateMemberField.mutate({ id: member.id, updates: { is_public: !member.is_public } })}
                      >
                        <VisibilityBadge isPublic={member.is_public} />
                      </button>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <StatusSelect
                        status={member.status}
                        disabled={updateMemberField.isPending}
                        onChange={(status) => updateMemberField.mutate({ id: member.id, updates: { status } })}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <RowMenu
                        member={member}
                        busy={updateMemberField.isPending || deleteMemberMutation.isPending}
                        onView={navigateToMember}
                        onEdit={navigateToMemberEdit}
                        onArchive={handleArchive}
                        onDelete={handleDelete}
                        onToggleVisibility={() =>
                          updateMemberField.mutate({ id: member.id, updates: { is_public: !member.is_public } })
                        }
                        onSetStatus={(status) => updateMemberField.mutate({ id: member.id, updates: { status } })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MemberAvatar({ member, className }: { member: any; className?: string }) {
  const name = memberDisplayName(member);
  if (!member.avatar_url) {
    return (
      <div className={cn('grid shrink-0 place-items-center border border-accent/10 bg-accent/10 font-serif text-accent', className)}>
        {initials(name)}
      </div>
    );
  }
  return (
    <div className={cn('shrink-0 overflow-hidden border border-accent/10', className)}>
      <img src={member.avatar_url} alt={name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge
      className={cn(
        'rounded-none border-none text-[8px] font-bold uppercase tracking-widest',
        status === 'Active' || status === 'Available'
          ? 'bg-green-500/10 text-green-500'
          : status === 'On Break' || status === 'Limited Availability'
            ? 'bg-amber-500/10 text-amber-500'
            : 'bg-red-500/10 text-red-500',
      )}
    >
      {status || 'Unknown'}
    </Badge>
  );
}

function VisibilityBadge({ isPublic }: { isPublic?: boolean | null }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-none border text-[8px] font-bold uppercase tracking-widest',
        isPublic ? 'border-green-500/20 text-green-500' : 'border-accent/10 text-muted-foreground',
      )}
    >
      {isPublic ? <Eye className="mr-1 h-2.5 w-2.5" /> : <EyeOff className="mr-1 h-2.5 w-2.5" />}
      {isPublic ? 'Public' : 'Hidden'}
    </Badge>
  );
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: {
  status?: string | null;
  disabled?: boolean;
  onChange: (status: string) => void;
}) {
  const value = status && (MEMBER_STATUSES as readonly string[]).includes(status) ? status : 'Active';

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-[150px] rounded-none border-accent/10 bg-background px-2 text-[9px] font-bold uppercase tracking-widest shadow-none focus:ring-accent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-none">
        {MEMBER_STATUSES.map((nextStatus) => (
          <SelectItem key={nextStatus} value={nextStatus} className="text-[11px]">
            {nextStatus}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RowMenu({
  member,
  busy,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onToggleVisibility,
  onSetStatus,
}: {
  member: any;
  busy?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: () => void;
  onSetStatus: (status: string) => void;
}) {
  const currentStatus = member.status || 'Active';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none text-accent/50 hover:text-accent" disabled={busy}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none border-accent/10 bg-primary text-primary-foreground">
        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-accent/50">Options</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => onView(member.id)}
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest focus:bg-accent focus:text-primary"
        >
          <ArrowRight className="mr-2 h-3 w-3" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onEdit(member.id)}
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest focus:bg-accent focus:text-primary"
        >
          <Edit className="mr-2 h-3 w-3" /> Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onToggleVisibility}
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest focus:bg-accent focus:text-primary"
        >
          {member.is_public ? <EyeOff className="mr-2 h-3 w-3" /> : <Eye className="mr-2 h-3 w-3" />}
          {member.is_public ? 'Hide from public' : 'Show on public page'}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-accent/10" />
        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-accent/50">Set status</DropdownMenuLabel>
        {MEMBER_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => onSetStatus(status)}
            className="cursor-pointer text-[10px] font-bold uppercase tracking-widest focus:bg-accent focus:text-primary"
          >
            {currentStatus === status ? <Check className="mr-2 h-3 w-3" /> : <UserX className="mr-2 h-3 w-3" />}
            {status}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => onArchive(member.id)}
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-red-400 focus:bg-red-400/10 focus:text-red-400"
        >
          <Archive className="mr-2 h-3 w-3" /> Archive member
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(member.id)}
          className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-red-500 focus:bg-red-500 focus:text-white"
        >
          <Trash2 className="mr-2 h-3 w-3" /> Delete permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
