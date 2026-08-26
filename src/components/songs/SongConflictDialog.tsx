import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { describeValue, type SongFieldConflict } from '@/lib/song-conflicts';

type Choice = 'mine' | 'theirs';

interface Props {
  open: boolean;
  conflicts: SongFieldConflict[];
  saving?: boolean;
  onCancel: () => void;
  /** Discard local edits and reload the remote version. */
  onDiscard: () => void;
  /** Resolved values keyed by database column name. */
  onResolve: (resolved: Record<string, unknown>) => void;
}

export function SongConflictDialog({ open, conflicts, saving, onCancel, onDiscard, onResolve }: Props) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});

  useEffect(() => {
    if (open) {
      const next: Record<string, Choice> = {};
      conflicts.forEach((c) => { next[c.field] = 'mine'; });
      setChoices(next);
    }
  }, [open, conflicts]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-2xl rounded-none max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Someone else edited this song
          </DialogTitle>
          <DialogDescription className="text-xs">
            Your changes were kept safe. Choose which version to keep for each conflicting field —
            everything else you edited is merged automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {conflicts.map((c) => (
            <div key={c.field} className="border border-border p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['mine', 'theirs'] as Choice[]).map((side) => {
                  const active = choices[c.field] === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setChoices((prev) => ({ ...prev, [c.field]: side }))}
                      className={`text-left p-2 border text-xs transition-colors min-h-11 ${
                        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {side === 'mine' ? 'Your version' : 'Their version'}
                      </span>
                      <span className="block whitespace-pre-wrap break-words line-clamp-6">
                        {describeValue(side === 'mine' ? c.mine : c.theirs)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" className="rounded-none" onClick={onCancel} disabled={saving}>
            Keep editing
          </Button>
          <Button type="button" variant="outline" className="rounded-none" onClick={onDiscard} disabled={saving}>
            Discard mine &amp; reload
          </Button>
          <Button
            type="button"
            className="rounded-none bg-accent text-primary"
            disabled={saving}
            onClick={() => {
              const resolved: Record<string, unknown> = {};
              conflicts.forEach((c) => {
                resolved[c.field] = choices[c.field] === 'theirs' ? c.theirs : c.mine;
              });
              onResolve(resolved);
            }}
          >
            {saving ? 'Saving…' : 'Save merged version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
