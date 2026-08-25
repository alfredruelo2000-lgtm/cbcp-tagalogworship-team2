import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSetlist, updateSetlist, type Setlist } from "@/lib/db-setlists.functions";
import { SETLIST_KEYS } from "./setlist-hooks";

const SERVICE_TYPES = ["Sunday Worship", "Prayer Meeting", "Youth Worship", "Midweek Service", "Communion", "Special Event", "Conference", "Fellowship"];
const STATUSES = ["Draft", "Ready", "Completed"];

const today = () => new Date().toISOString().slice(0, 10);

export function SetlistFormDialog({
  open,
  onOpenChange,
  setlist,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setlist?: Setlist | null;
  onSaved?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    serviceDate: today(),
    serviceTime: "10:00",
    serviceType: SERVICE_TYPES[0]!,
    theme: "",
    leader: "",
    notes: "",
    status: "Draft",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: setlist?.title ?? "",
      serviceDate: setlist?.service_date ?? today(),
      serviceTime: (setlist?.service_time ?? "10:00").slice(0, 5),
      serviceType: setlist?.service_type ?? SERVICE_TYPES[0]!,
      theme: setlist?.theme ?? "",
      leader: "",
      notes: setlist?.notes ?? "",
      status: setlist?.status ?? "Draft",
    });
  }, [open, setlist]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Please give your setlist a name.");
      if (setlist) {
        await updateSetlist(setlist.id, {
          title: form.title.trim(),
          serviceDate: form.serviceDate,
          serviceTime: form.serviceTime,
          serviceType: form.serviceType,
          theme: form.theme,
          notes: form.notes,
          status: form.status,
        });
        return setlist.id;
      }
      const created = await createSetlist({
        title: form.title.trim(),
        serviceDate: form.serviceDate,
        serviceTime: form.serviceTime,
        serviceType: form.serviceType,
        theme: form.theme,
        notes: form.notes,
        status: form.status,
      });
      return created.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(setlist ? "Setlist updated" : "Setlist created");
      onOpenChange(false);
      onSaved?.(id);
    },
    onError: (error: any) => toast.error(error?.message || "Could not save setlist"),
  });

  const field = "h-11 rounded-none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{setlist ? "Edit setlist" : "New setlist"}</DialogTitle>
          <DialogDescription className="text-xs">
            e.g. “August 30 Worship Service”. Personal setlists stay private to you.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="setlist-title" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input id="setlist-title" className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="August 30 Worship Service" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="setlist-date" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Date</Label>
              <Input id="setlist-date" type="date" className={field} value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setlist-time" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Time</Label>
              <Input id="setlist-time" type="time" className={field} value={form.serviceTime} onChange={(e) => setForm({ ...form, serviceTime: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="setlist-type" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Service</Label>
              <select id="setlist-type" className="h-11 w-full border border-input bg-background px-2 text-sm" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setlist-status" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
              <select id="setlist-status" className="h-11 w-full border border-input bg-background px-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setlist-theme" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Theme <span className="font-normal normal-case tracking-normal">(optional)</span></Label>
            <Input id="setlist-theme" className={field} value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} placeholder="Faithful God" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setlist-notes" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Notes <span className="font-normal normal-case tracking-normal">(optional)</span></Label>
            <Textarea id="setlist-notes" className="min-h-20 rounded-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Rehearsal 8:00 AM, leader notes…" />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-none" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="h-11 rounded-none" disabled={save.isPending}>
              {save.isPending ? "Saving…" : setlist ? "Save changes" : "Create setlist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
