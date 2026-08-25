import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addSongToSetlist, type Setlist } from "@/lib/db-setlists.functions";
import { KEYS } from "@/utils/transposition";
import { SETLIST_KEYS, useSetlistAbilities, useSetlists } from "./setlist-hooks";
import { SetlistFormDialog } from "./SetlistFormDialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  song: { id: string; title: string; defaultKey?: string | null };
};

export function AddToSetlistDialog({ open, onOpenChange, song }: Props) {
  const queryClient = useQueryClient();
  const { data: setlists = [], isLoading } = useSetlists();
  const { canEdit, canCreate, user } = useSetlistAbilities();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(song.defaultKey || "C");
  const [added, setAdded] = useState<string[]>([]);

  const editable = useMemo(
    () =>
      setlists
        .filter((s) => canEdit(s) && s.status !== "Archived")
        .sort((a, b) => (a.service_date < b.service_date ? 1 : -1)),
    [setlists, canEdit],
  );

  const add = useMutation({
    mutationFn: async ({ setlist, allowDuplicate }: { setlist: Setlist; allowDuplicate?: boolean }) => {
      const result = await addSongToSetlist({
        setlistId: setlist.id,
        songId: song.id,
        title: song.title,
        selectedKey,
        allowDuplicate,
      });
      return { result, setlist };
    },
    onSuccess: ({ result, setlist }) => {
      if (result.duplicate) {
        if (window.confirm(`“${song.title}” is already in ${setlist.title}. Add it again?`)) {
          add.mutate({ setlist, allowDuplicate: true });
        }
        return;
      }
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["setlist", setlist.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setAdded((prev) => [...prev, setlist.id]);
      toast.success(`Added to ${setlist.title} in ${selectedKey}`);
    },
    onError: (error: any) => toast.error(error?.message || "Could not add song"),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto rounded-none">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add “{song.title}” to…</DialogTitle>
            <DialogDescription className="text-xs">
              The performance key is stored for that setlist only — the library keeps {song.defaultKey || "its default"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border border-accent/15 bg-muted/30 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Key</span>
            <select
              aria-label="Performance key"
              className="h-9 flex-1 border border-input bg-background px-2 text-sm"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {KEYS.map((k: string) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {!user ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">Sign in to build your own setlists.</p>
              <Button asChild className="h-11 w-full rounded-none"><Link to="/login">Sign in</Link></Button>
            </div>
          ) : (
            <div className="space-y-2">
              {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading your setlists…</p>}
              {!isLoading && editable.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">You don’t have any editable setlists yet.</p>
              )}
              <ul className="divide-y divide-accent/10 border-y border-accent/10">
                {editable.map((setlist) => {
                  const isAdded = added.includes(setlist.id);
                  const pending = add.isPending && add.variables?.setlist.id === setlist.id;
                  return (
                    <li key={setlist.id}>
                      <button
                        type="button"
                        onClick={() => add.mutate({ setlist })}
                        className="flex min-h-[52px] w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-muted/40 active:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{setlist.title}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {new Date(setlist.service_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {setlist.service_items.length} song{setlist.service_items.length === 1 ? "" : "s"}
                            {setlist.is_official ? " · Official" : ""}
                          </span>
                        </span>
                        {pending ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" /> : isAdded ? <Check className="h-4 w-4 shrink-0 text-green-600" /> : <ListPlus className="h-4 w-4 shrink-0 text-accent/60" />}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {canCreate && (
                <Button variant="outline" className="h-11 w-full rounded-none" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create new setlist
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SetlistFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={async (id) => {
          const { addSongToSetlist: addSong } = await import("@/lib/db-setlists.functions");
          try {
            await addSong({ setlistId: id, songId: song.id, title: song.title, selectedKey });
            queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.all });
            setAdded((prev) => [...prev, id]);
            toast.success(`Added “${song.title}” in ${selectedKey}`);
          } catch (error: any) {
            toast.error(error?.message || "Could not add song");
          }
        }}
      />
    </>
  );
}

/** Small trigger button reusable across the library and song detail page. */
export function AddToSetlistButton({ song, className, label = "Add to Setlist", iconOnly = false }: { song: Props["song"]; className?: string; label?: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className ?? "h-9 rounded-none"}
        aria-label={`Add ${song.title} to a setlist`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <ListPlus className={iconOnly ? "h-4 w-4" : "h-4 w-4 sm:mr-1.5"} />
        {!iconOnly && <span className="hidden sm:inline">{label}</span>}
      </Button>
      {open && <AddToSetlistDialog open={open} onOpenChange={setOpen} song={song} />}
    </>
  );
}
