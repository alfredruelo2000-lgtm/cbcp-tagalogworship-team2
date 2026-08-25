import { supabase } from "@/integrations/supabase/client";

export type SetlistPermissions = {
  allowPublicCreation: boolean;
  allowDuplicateOfficial: boolean;
  allowEditingOfficial: boolean;
};

export const DEFAULT_SETLIST_PERMISSIONS: SetlistPermissions = {
  allowPublicCreation: true,
  allowDuplicateOfficial: true,
  allowEditingOfficial: false,
};

export const SETLIST_PERMISSIONS_KEY = "setlist_permissions";

const SETLIST_SELECT = `
  id, title, service_date, service_time, service_type, theme, notes, status,
  is_public, is_official, owner_id, allow_public_duplicate, worship_leader_id,
  rehearsal_date, rehearsal_time, rehearsal_location, created_at, updated_at,
  service_items (
    id, service_id, song_id, sort_order, item_type, title, selected_key,
    category, duration, notes, assigned_person, transition_note
  )
`;

export type SetlistItem = {
  id: string;
  service_id: string;
  song_id: string | null;
  sort_order: number;
  item_type: string;
  title: string;
  selected_key: string | null;
  category: string | null;
  duration: number | null;
  notes: string | null;
  assigned_person: string | null;
  transition_note: string | null;
};

export type Setlist = {
  id: string;
  title: string;
  service_date: string;
  service_time: string;
  service_type: string;
  theme: string | null;
  notes: string | null;
  status: string;
  is_public: boolean;
  is_official: boolean;
  owner_id: string | null;
  allow_public_duplicate: boolean;
  worship_leader_id: string | null;
  created_at: string;
  updated_at: string | null;
  service_items: SetlistItem[];
};

const sortItems = (rows: any[]): SetlistItem[] =>
  [...(rows || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

export async function getSetlistPermissions(): Promise<SetlistPermissions> {
  const { data, error } = await supabase
    .from("ministry_settings")
    .select("value")
    .eq("key", SETLIST_PERMISSIONS_KEY)
    .maybeSingle();

  if (error) return DEFAULT_SETLIST_PERMISSIONS;
  return { ...DEFAULT_SETLIST_PERMISSIONS, ...((data?.value as any) || {}) };
}

export async function saveSetlistPermissions(value: SetlistPermissions) {
  const { error } = await supabase
    .from("ministry_settings")
    .upsert({ key: SETLIST_PERMISSIONS_KEY, value: value as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
  return value;
}

/** All setlists visible to the caller (RLS decides: official + own personal). */
export async function getSetlists(): Promise<Setlist[]> {
  const { data, error } = await supabase
    .from("services")
    .select(SETLIST_SELECT)
    .order("service_date", { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({ ...row, service_items: sortItems(row.service_items) })) as Setlist[];
}

export async function getSetlist(id: string): Promise<Setlist | null> {
  const { data, error } = await supabase
    .from("services")
    .select(SETLIST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...(data as any), service_items: sortItems((data as any).service_items) } as Setlist;
}

export type SetlistInput = {
  title: string;
  serviceDate: string;
  serviceTime?: string;
  serviceType?: string;
  theme?: string | null;
  notes?: string | null;
  worshipLeaderId?: string | null;
  status?: string;
  isOfficial?: boolean;
  isPublic?: boolean;
};

export async function createSetlist(input: SetlistInput) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Please sign in to create a setlist.");

  const { data, error } = await supabase
    .from("services")
    .insert([{
      title: input.title.trim() || "New Setlist",
      service_date: input.serviceDate,
      service_time: input.serviceTime || "10:00",
      service_type: (input.serviceType || "Sunday Worship") as any,
      theme: input.theme || null,
      notes: input.notes || null,
      worship_leader_id: input.worshipLeaderId || null,
      status: (input.status || "Draft") as any,
      owner_id: userId,
      is_official: input.isOfficial ?? false,
      is_public: input.isPublic ?? false,
    }])
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSetlist(id: string, patch: Partial<SetlistInput> & { allowPublicDuplicate?: boolean }) {
  const update: Record<string, any> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.serviceDate !== undefined) update.service_date = patch.serviceDate;
  if (patch.serviceTime !== undefined) update.service_time = patch.serviceTime;
  if (patch.serviceType !== undefined) update.service_type = patch.serviceType;
  if (patch.theme !== undefined) update.theme = patch.theme || null;
  if (patch.notes !== undefined) update.notes = patch.notes || null;
  if (patch.worshipLeaderId !== undefined) update.worship_leader_id = patch.worshipLeaderId || null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.isPublic !== undefined) update.is_public = patch.isPublic;
  if (patch.isOfficial !== undefined) update.is_official = patch.isOfficial;
  if (patch.allowPublicDuplicate !== undefined) update.allow_public_duplicate = patch.allowPublicDuplicate;

  const { error } = await supabase.from("services").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteSetlist(id: string) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateSetlist(id: string, overrides?: { title?: string; serviceDate?: string }) {
  const source = await getSetlist(id);
  if (!source) throw new Error("Setlist not found");

  const created = await createSetlist({
    title: overrides?.title || `${source.title} (Copy)`,
    serviceDate: overrides?.serviceDate || source.service_date,
    serviceTime: source.service_time,
    serviceType: source.service_type,
    theme: source.theme,
    notes: source.notes,
    worshipLeaderId: source.worship_leader_id,
    status: "Draft",
  });

  if (source.service_items.length) {
    const { error } = await supabase.from("service_items").insert(
      source.service_items.map((item, index) => ({
        service_id: created.id,
        song_id: item.song_id,
        sort_order: index,
        item_type: item.item_type,
        title: item.title,
        selected_key: item.selected_key,
        category: item.category,
        duration: item.duration,
        notes: item.notes,
        assigned_person: item.assigned_person,
        transition_note: item.transition_note,
      })) as any,
    );
    if (error) throw error;
  }

  return created;
}

export async function addSongToSetlist(params: {
  setlistId: string;
  songId: string;
  title: string;
  selectedKey?: string | null;
  allowDuplicate?: boolean;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("service_items")
    .select("id, sort_order, song_id")
    .eq("service_id", params.setlistId);
  if (existingError) throw existingError;

  const duplicate = (existing || []).some((row: any) => row.song_id === params.songId);
  if (duplicate && !params.allowDuplicate) {
    return { duplicate: true as const };
  }

  const nextOrder = (existing || []).reduce((max: number, row: any) => Math.max(max, row.sort_order ?? 0), -1) + 1;

  const { error } = await supabase.from("service_items").insert([{
    service_id: params.setlistId,
    song_id: params.songId,
    sort_order: nextOrder,
    item_type: "Song",
    title: params.title,
    selected_key: params.selectedKey || null,
  }] as any);

  if (error) throw error;
  return { duplicate: false as const };
}

export async function addCustomItemToSetlist(params: { setlistId: string; title: string; notes?: string }) {
  const { data: existing } = await supabase
    .from("service_items")
    .select("sort_order")
    .eq("service_id", params.setlistId);
  const nextOrder = (existing || []).reduce((max: number, row: any) => Math.max(max, row.sort_order ?? 0), -1) + 1;

  const { error } = await supabase.from("service_items").insert([{
    service_id: params.setlistId,
    sort_order: nextOrder,
    item_type: "Custom",
    title: params.title,
    notes: params.notes || null,
  }] as any);
  if (error) throw error;
}

export async function updateSetlistItem(id: string, patch: Partial<Pick<SetlistItem, "selected_key" | "notes" | "assigned_person" | "transition_note" | "title" | "sort_order">>) {
  const { error } = await supabase.from("service_items").update(patch as any).eq("id", id);
  if (error) throw error;
}

export async function removeSetlistItem(id: string) {
  const { error } = await supabase.from("service_items").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderSetlistItems(ids: string[]) {
  await Promise.all(
    ids.map((id, index) => supabase.from("service_items").update({ sort_order: index }).eq("id", id)),
  );
}
