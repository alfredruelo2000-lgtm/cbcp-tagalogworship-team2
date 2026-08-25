import { useMemo, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowDown, ArrowUp, Calendar, Copy, Edit3, ListPlus, Music, Pencil,
  Search, ShieldCheck, Trash2, User, Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getSongsPublic } from '@/lib/db-public.functions';
import {
  addSongToSetlist, deleteSetlist, duplicateSetlist, getSetlist, removeSetlistItem,
  reorderSetlistItems, updateSetlist, updateSetlistItem, type Setlist, type SetlistItem,
} from '@/lib/db-setlists.functions';
import { SETLIST_KEYS, useSetlistAbilities } from '@/components/setlists/setlist-hooks';
import { SetlistFormDialog } from '@/components/setlists/SetlistFormDialog';
import { KEYS } from '@/utils/transposition';
import { markSetlistSavedOffline, cacheSongsOffline, useOnlineStatus, useSyncStatus } from '@/lib/offline';
import { WifiOff, CloudOff, Download, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_public/setlists/$id')({
  head: () => ({ meta: [
    { title: 'Setlist Planning | CBCP Tagalog Worship Team' },
    { name: 'description', content: 'Plan the song order, performance keys, and notes for this worship service setlist.' },
    { property: 'og:title', content: 'Setlist Planning | CBCP Tagalog Worship Team' },
    { property: 'og:description', content: 'Song order, per-service keys, and leader notes for this worship setlist.' },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ]}),
  component: SetlistDetailPage,
});

const statusStyle = (status: string) =>
  status === 'Ready' ? 'border-green-500/30 bg-green-500/10 text-green-700'
  : status === 'Completed' ? 'border-blue-500/30 bg-blue-500/10 text-blue-700'
  : status === 'Archived' ? 'border-transparent bg-muted text-muted-foreground'
  : 'border-accent/30 bg-accent/10 text-accent';

function SetlistDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canEdit, canDuplicate } = useSetlistAbilities();

  const { data: setlist, isLoading, isError } = useQuery({
    queryKey: ['setlist', id],
    queryFn: () => getSetlist(id),
  });
  const { data: songs = [] } = useQuery({ queryKey: ['songs-public'], queryFn: getSongsPublic });

  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const editable = canEdit(setlist ?? null);
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['setlist', id] });
    queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.all });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const online = useOnlineStatus();
  const syncStatus = useSyncStatus();
  const [savedOffline, setSavedOffline] = useState(false);

  const saveOffline = async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({ queryKey: ['setlist', id], queryFn: () => getSetlist(id) }),
        queryClient.prefetchQuery({ queryKey: ['songs-public'], queryFn: getSongsPublic }),
      ]);
      // Store every chord sheet in this setlist so the reader works with no network.
      const list = queryClient.getQueryData<any>(['setlist', id]);
      const allSongs = queryClient.getQueryData<any[]>(['songs-public']) ?? [];
      const byId = new Map(allSongs.map((song: any) => [song.id, song]));
      const setlistSongs = ((list?.service_items ?? []) as any[])
        .map((item) => byId.get(item.song_id))
        .filter(Boolean);
      await cacheSongsOffline(setlistSongs);
      await markSetlistSavedOffline(id);
      setSavedOffline(true);
      toast.success('Saved for offline use — full chord sheets and keys stay on this device.');
    } catch {
      toast.error('Could not save this setlist offline.');
    }
  };

  const songById = useMemo(() => new Map((songs as any[]).map((s) => [s.id, s])), [songs]);

  const itemMutation = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    onSuccess: invalidate,
    onError: (error: any) => toast.error(error?.message || 'Could not save change'),
  });

  const duplicate = useMutation({
    mutationFn: () => duplicateSetlist(id),
    onSuccess: (created: any) => {
      invalidate();
      toast.success('Setlist duplicated');
      navigate({ to: '/setlists/$id', params: { id: created.id } });
    },
    onError: (error: any) => toast.error(error?.message || 'Could not duplicate setlist'),
  });

  if (isLoading) {
    return <main className="container mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="h-24 animate-pulse bg-muted/40" /><div className="mt-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse bg-muted/30" />)}</div></main>;
  }

  if (isError || !setlist) {
    return (
      <main className="container mx-auto px-4 py-16 text-center sm:px-6">
        <h1 className="font-serif text-3xl">Setlist not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may be private, archived, or removed.</p>
        <Button asChild className="mt-6 h-11 rounded-none"><Link to="/setlists">Back to setlists</Link></Button>
      </main>
    );
  }

  const items = setlist.service_items;

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    itemMutation.mutate(() => reorderSetlistItems(next.map((i) => i.id)));
  };

  const remove = (item: SetlistItem) => {
    if (!window.confirm(`Remove “${item.title}” from this setlist?`)) return;
    itemMutation.mutate(() => removeSetlistItem(item.id));
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 pb-14 pt-3 sm:px-6 md:pt-8">
      <Link to="/setlists" className="mb-3 inline-flex min-h-11 items-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-accent">
        <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Setlists
      </Link>

      <header className="border-y border-accent/10 py-3">
        <div className="flex items-start gap-2">
          <h1 className="min-w-0 flex-1 font-serif text-2xl leading-tight text-foreground sm:text-4xl">{setlist.title}</h1>
          <span className={cn('shrink-0 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest', statusStyle(setlist.status))}>{setlist.status}</span>
          {!online && <span className="inline-flex shrink-0 items-center gap-1 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700"><WifiOff className="h-3 w-3" /> Offline</span>}
          {online && syncStatus === 'pending' && <span className="inline-flex shrink-0 items-center gap-1 border border-accent/30 bg-accent/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent"><CloudOff className="h-3 w-3" /> Syncing</span>}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-accent/60" />{new Date(setlist.service_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {(setlist.service_time || '').slice(0, 5)}</span>
          <span className="inline-flex items-center gap-1.5">{setlist.is_official ? <><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Official ministry setlist</> : <><User className="h-3.5 w-3.5" /> Personal setlist</>}</span>
          <span className="inline-flex items-center gap-1.5"><Music className="h-3.5 w-3.5 text-accent/60" />{items.length} item{items.length === 1 ? '' : 's'}</span>
        </p>
        {setlist.theme && <p className="mt-1 text-xs italic text-muted-foreground">Theme: {setlist.theme}</p>}
        {setlist.notes && <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{setlist.notes}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {editable && <Button size="sm" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest" onClick={() => setPickerOpen(true)}><ListPlus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add song</span></Button>}
          <Button size="sm" variant="outline" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest" disabled={savedOffline} onClick={saveOffline}>
            {savedOffline ? <CheckCircle2 className="h-4 w-4 text-green-600 sm:mr-2" /> : <Download className="h-4 w-4 sm:mr-2" />}
            <span className="hidden sm:inline">{savedOffline ? 'Available offline' : 'Save offline'}</span>
          </Button>
          {editable && <Button size="sm" variant="outline" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest" onClick={() => setEditOpen(true)}><Edit3 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Edit</span></Button>}
          {canDuplicate(setlist) && <Button size="sm" variant="outline" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest" disabled={duplicate.isPending} onClick={() => duplicate.mutate()}><Copy className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Duplicate</span></Button>}
          {editable && setlist.status !== 'Archived' && (
            <Button size="sm" variant="outline" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest" onClick={() => {
              if (!window.confirm('Archive this setlist?')) return;
              itemMutation.mutate(() => updateSetlist(setlist.id, { status: 'Archived' }));
            }}><Archive className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Archive</span></Button>
          )}
          {editable && !setlist.is_official && (
            <Button size="sm" variant="ghost" className="h-11 rounded-none px-3 text-[11px] font-bold uppercase tracking-widest text-destructive" onClick={async () => {
              if (!window.confirm('Delete this setlist permanently?')) return;
              try {
                await deleteSetlist(setlist.id);
                invalidate();
                toast.success('Setlist deleted');
                navigate({ to: '/setlists' });
              } catch (error: any) { toast.error(error?.message || 'Could not delete setlist'); }
            }}><Trash2 className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Delete</span></Button>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="mt-6 border border-dashed border-accent/20 px-4 py-12 text-center">
          <Music className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No songs yet.</p>
          {editable && <Button variant="outline" className="mt-4 h-11 rounded-none" onClick={() => setPickerOpen(true)}><ListPlus className="mr-2 h-4 w-4" /> Add a song</Button>}
        </div>
      ) : (
        <ol className="mt-4 divide-y divide-accent/10 border-y border-accent/10">
          {items.map((item, index) => {
            const song = item.song_id ? songById.get(item.song_id) : null;
            const key = item.selected_key || song?.defaultKey || '';
            return (
              <li key={item.id} className="py-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 shrink-0 text-center font-serif text-sm text-accent/70">{index + 1}</span>
                  {item.song_id ? (
                    <Link
                      to="/songs/$id"
                      params={{ id: item.song_id }}
                      search={{ key, setlist: setlist.id } as never}
                      preload="intent"
                      className="min-w-0 flex-1 py-1.5"
                    >
                      <span className="block truncate font-serif text-[15px] leading-snug text-foreground hover:text-accent sm:text-lg">{song?.title || item.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{song?.artist || item.item_type}{item.transition_note ? ` · ${item.transition_note}` : ''}</span>
                    </Link>
                  ) : (
                    <div className="min-w-0 flex-1 py-1.5">
                      <span className="block truncate font-serif text-[15px] text-foreground sm:text-lg">{item.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{item.notes || 'Custom item'}</span>
                    </div>
                  )}

                  {item.song_id && (editable ? (
                    <select
                      aria-label={`Key for ${item.title}`}
                      className="h-9 w-16 shrink-0 border border-accent/20 bg-background px-1 text-center text-xs font-bold text-accent"
                      value={key}
                      onChange={(e) => itemMutation.mutate(() => updateSetlistItem(item.id, { selected_key: e.target.value }))}
                    >
                      {KEYS.map((k: string) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  ) : (
                    <span className="shrink-0 border border-accent/20 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-accent">{key}</span>
                  ))}

                  {editable && (
                    <div className="flex shrink-0 items-center">
                      <Button variant="ghost" size="icon" aria-label="Move up" className="h-11 w-9" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Move down" className="h-11 w-9" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" aria-label="Remove song" className="h-11 w-9 text-destructive" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>

                {editable && (
                  <div className="mt-1 flex items-center gap-2 pl-7">
                    <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    <input
                      aria-label={`Note for ${item.title}`}
                      defaultValue={item.transition_note ?? ''}
                      placeholder="Transition / leader note"
                      className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 text-[11px] text-muted-foreground outline-none focus:border-accent/40"
                      onBlur={(e) => {
                        if (e.target.value === (item.transition_note ?? '')) return;
                        itemMutation.mutate(() => updateSetlistItem(item.id, { transition_note: e.target.value || null }));
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <SetlistFormDialog open={editOpen} onOpenChange={setEditOpen} setlist={setlist as Setlist} onSaved={invalidate} />
      {pickerOpen && (
        <SongPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          songs={songs as any[]}
          onPick={async (song) => {
            try {
              const result = await addSongToSetlist({ setlistId: setlist.id, songId: song.id, title: song.title, selectedKey: song.defaultKey });
              if (result.duplicate) {
                if (!window.confirm(`“${song.title}” is already in this setlist. Add again?`)) return;
                await addSongToSetlist({ setlistId: setlist.id, songId: song.id, title: song.title, selectedKey: song.defaultKey, allowDuplicate: true });
              }
              invalidate();
              toast.success(`Added ${song.title}`);
            } catch (error: any) {
              toast.error(error?.message || 'Could not add song');
            }
          }}
        />
      )}
    </main>
  );
}

function SongPickerDialog({ open, onOpenChange, songs, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; songs: any[]; onPick: (song: any) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return songs.filter((s) => !q || [s.title, s.artist].filter(Boolean).join(' ').toLowerCase().includes(q)).slice(0, 60);
  }, [songs, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-hidden rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Add a song</DialogTitle>
          <DialogDescription className="text-xs">Songs are added in their default key — change it per setlist afterwards.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus aria-label="Search songs" placeholder="Search songs…" className="h-11 rounded-none pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ul className="max-h-[50dvh] divide-y divide-accent/10 overflow-y-auto border-y border-accent/10">
          {filtered.map((song) => (
            <li key={song.id}>
              <button type="button" className="flex min-h-[52px] w-full items-center gap-3 px-1 text-left hover:bg-muted/40 active:bg-muted/60" onClick={() => { onPick(song); onOpenChange(false); }}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{song.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{song.artist}</span>
                </span>
                <span className="shrink-0 border border-accent/20 px-1.5 text-[11px] font-bold text-accent">{song.defaultKey}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No songs found.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
