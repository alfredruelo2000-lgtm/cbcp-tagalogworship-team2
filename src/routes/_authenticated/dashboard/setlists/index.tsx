import { useMemo, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Archive, Copy, Edit, Eye, EyeOff, ListMusic, MoreVertical, Music, Plus, Search, ShieldCheck, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DEFAULT_SETLIST_PERMISSIONS, duplicateSetlist, getSetlistPermissions, getSetlists,
  saveSetlistPermissions, updateSetlist, type SetlistPermissions,
} from '@/lib/db-setlists.functions';
import { SETLIST_KEYS } from '@/components/setlists/setlist-hooks';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/setlists/')({
  component: SetlistManagementPage,
});

function SetlistManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'official' | 'personal' | 'archived'>('official');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: setlists = [], isLoading } = useQuery({ queryKey: SETLIST_KEYS.all, queryFn: getSetlists });
  const { data: permissions = DEFAULT_SETLIST_PERMISSIONS } = useQuery({ queryKey: SETLIST_KEYS.permissions, queryFn: getSetlistPermissions });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.all });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const savePermissions = useMutation({
    mutationFn: (next: SetlistPermissions) => saveSetlistPermissions(next),
    onMutate: (next) => { queryClient.setQueryData(SETLIST_KEYS.permissions, next); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.permissions }); toast.success('Permissions updated'); },
    onError: (error: any) => { queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.permissions }); toast.error(error?.message || 'Could not save permissions'); },
  });

  const patch = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Parameters<typeof updateSetlist>[1] }) => updateSetlist(id, values),
    onSuccess: () => { invalidate(); toast.success('Setlist updated'); },
    onError: (error: any) => toast.error(error?.message || 'Could not update setlist'),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => duplicateSetlist(id),
    onSuccess: () => { invalidate(); toast.success('Setlist duplicated'); },
    onError: (error: any) => toast.error(error?.message || 'Could not duplicate setlist'),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return setlists
      .filter((s) => (scope === 'archived' ? s.status === 'Archived' : s.status !== 'Archived' && (scope === 'official' ? s.is_official : !s.is_official)))
      .filter((s) => !q || [s.title, s.theme, s.service_type, s.service_date].filter(Boolean).join(' ').toLowerCase().includes(q))
      .sort((a, b) => b.service_date.localeCompare(a.service_date));
  }, [setlists, scope, search]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 md:space-y-10 md:py-12">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:flex md:items-end md:justify-between">
        <div className="min-w-0 space-y-1.5 md:space-y-3">
          <Badge variant="outline" className="rounded-none border-accent/20 text-[10px] uppercase tracking-widest text-accent">Planning &amp; Content</Badge>
          <h1 className="truncate font-serif text-2xl text-foreground sm:text-4xl md:text-5xl">Setlist Management</h1>
          <p className="hidden max-w-2xl text-sm text-muted-foreground sm:block">
            One shared source of truth — official setlists publish straight to the public Setlists page.
          </p>
        </div>
        <Button className="h-11 shrink-0 rounded-none bg-accent px-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-accent/90 sm:px-6" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">New Setlist</span>
        </Button>
      </header>

      {/* Public permissions */}
      <section className="border border-accent/10 p-4 md:p-6" aria-label="Public setlist permissions">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-accent">Public permissions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {([
            ['allowPublicCreation', 'Allow public setlist creation'],
            ['allowDuplicateOfficial', 'Allow duplicating official setlists'],
            ['allowEditingOfficial', 'Allow editing official setlists'],
          ] as [keyof SetlistPermissions, string][]).map(([key, label]) => (
            <div key={key} className="flex min-h-11 items-center justify-between gap-3 border border-accent/10 px-3">
              <Label htmlFor={`perm-${key}`} className="text-xs text-muted-foreground">{label}</Label>
              <Switch id={`perm-${key}`} checked={Boolean(permissions[key])} onCheckedChange={(checked) => savePermissions.mutate({ ...permissions, [key]: checked })} />
            </div>
          ))}
        </div>
      </section>

      {/* Search & scope */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search setlists" placeholder="Search setlists, themes, dates…" className="h-11 rounded-none pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Setlist scope">
          {([['official', 'Official'], ['personal', 'Personal'], ['archived', 'Archive']] as const).map(([key, label]) => (
            <button key={key} role="tab" aria-selected={scope === key} onClick={() => setScope(key)}
              className={cn('h-9 shrink-0 whitespace-nowrap border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors',
                scope === key ? 'border-accent bg-accent text-primary' : 'border-accent/15 text-muted-foreground hover:border-accent/40 hover:text-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Setlists */}
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-muted/30" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-accent/20 py-14 text-center">
          <ListMusic className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No setlists in this view.</p>
        </div>
      ) : (
        <ul className="divide-y divide-accent/10 border-y border-accent/10">
          {filtered.map((setlist) => (
            <li key={setlist.id} className="flex items-center gap-2 py-2.5">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border border-accent/15 bg-primary/5 text-accent">
                <span className="text-[9px] font-bold uppercase tracking-widest">{new Date(setlist.service_date).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="font-serif text-base leading-none">{new Date(setlist.service_date).getDate()}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate font-serif text-[15px] leading-snug sm:text-lg">{setlist.title}</h3>
                  {setlist.is_official ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Official" /> : <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-label="Personal" />}
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                  <Music className="h-3 w-3 shrink-0 text-accent/60" />{setlist.service_items.length} song{setlist.service_items.length === 1 ? '' : 's'}
                  <span className="h-1 w-1 shrink-0 rounded-full bg-accent/30" />{setlist.status}
                  {setlist.theme ? <><span className="hidden h-1 w-1 shrink-0 rounded-full bg-accent/30 sm:inline-block" /><span className="hidden truncate sm:inline">{setlist.theme}</span></> : null}
                </p>
              </div>

              {setlist.is_official && (
                <Button
                  variant="outline" size="sm"
                  className={cn('hidden h-11 rounded-none px-2.5 text-[10px] font-bold uppercase tracking-widest sm:inline-flex', setlist.is_public && 'border-green-500/40 text-green-700')}
                  onClick={() => patch.mutate({ id: setlist.id, values: { isPublic: !setlist.is_public } })}
                >
                  {setlist.is_public ? <><Eye className="mr-1.5 h-3.5 w-3.5" /> Published</> : <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Hidden</>}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 rounded-none text-accent/60 hover:text-accent" aria-label={`Options for ${setlist.title}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none border-accent/10">
                  <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-accent/60">Options</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="cursor-pointer text-[11px] font-bold uppercase tracking-widest">
                    <Link to="/setlists/$id" params={{ id: setlist.id }}><Eye className="mr-2 h-3.5 w-3.5" /> Open / Plan</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-[11px] font-bold uppercase tracking-widest">
                    <Link to="/dashboard/setlists/$id" params={{ id: setlist.id }}><Edit className="mr-2 h-3.5 w-3.5" /> Service details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase tracking-widest" onClick={() => duplicate.mutate(setlist.id)}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  {setlist.is_official && (
                    <>
                      <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase tracking-widest" onClick={() => patch.mutate({ id: setlist.id, values: { isPublic: !setlist.is_public } })}>
                        {setlist.is_public ? <><EyeOff className="mr-2 h-3.5 w-3.5" /> Unpublish</> : <><Eye className="mr-2 h-3.5 w-3.5" /> Publish</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-[11px] font-bold uppercase tracking-widest" onClick={() => patch.mutate({ id: setlist.id, values: { allowPublicDuplicate: !setlist.allow_public_duplicate } })}>
                        <Copy className="mr-2 h-3.5 w-3.5" /> {setlist.allow_public_duplicate ? 'Block copying' : 'Allow copying'}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-accent/10" />
                  <DropdownMenuItem
                    className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-destructive"
                    onClick={() => {
                      if (!window.confirm(setlist.status === 'Archived' ? 'Restore this setlist to Draft?' : 'Archive this setlist?')) return;
                      patch.mutate({ id: setlist.id, values: { status: setlist.status === 'Archived' ? 'Draft' : 'Archived' } });
                    }}
                  >
                    <Archive className="mr-2 h-3.5 w-3.5" /> {setlist.status === 'Archived' ? 'Restore' : 'Archive'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <SetlistFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(id) => { invalidate(); patch.mutate({ id, values: { isOfficial: true } }); }} />
    </div>
  );
}
