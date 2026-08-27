import { supabase } from "@/integrations/supabase/client";

export async function getResources() {
  const { data, error } = await supabase
    .from("worship_resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createResource(input: { data: any } | any) {
  const payload = ((input as any)?.data ?? input) as any;
  if (!payload?.title) throw new Error("Title is required");

  const isPublic = payload.is_public ?? (payload.visibility ? payload.visibility === 'Public' : false);

  const insertData: any = {
    title: payload.title,
    description: payload.description ?? null,
    category: payload.category ?? null,
    resource_type: payload.type ?? payload.resource_type ?? 'Article',
    content: payload.content ?? '',
    slug: `${String(payload.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`,
    tags: payload.tags ?? null,
    external_link: payload.external_link || null,
    is_public: isPublic,
    visibility: payload.visibility ?? (isPublic ? 'Public' : 'Private'),
    featured: payload.featured ?? false,
    status: payload.status ?? 'Published',
  };

  const { data, error } = await supabase
    .from("worship_resources")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ---------------------------------- Media --------------------------------- */

const unwrap = <T,>(input: { data: T } | T): T => ((input as any)?.data ?? input) as T;

export async function getMediaItems() {
  const { data, error } = await supabase
    .from("media_items")
    .select("*, media_albums ( id, title )")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMediaItem(input: { data: any } | any) {
  const payload = unwrap<any>(input);
  if (!payload?.title) throw new Error("Title is required");
  if (!payload?.file_url) throw new Error("A file URL is required");

  const insertData: any = {
    title: payload.title,
    file_url: payload.file_url,
    media_type: payload.media_type ?? 'Photo',
    category: payload.category ?? 'Worship Service',
    description: payload.description ?? null,
    thumbnail_url: payload.thumbnail_url ?? payload.file_url ?? null,
    visibility: payload.visibility ?? 'Public',
    featured: payload.featured ?? false,
    album_id: payload.album_id || null,
    event_date: payload.event_date || null,
    tags: payload.tags ?? null,
    file_size: payload.file_size ?? null,
    file_type: payload.file_type ?? null,
    sort_order: payload.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from("media_items")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMediaItem(input: { data: { id: string; patch: any } } | { id: string; patch: any }) {
  const { id, patch } = unwrap<{ id: string; patch: any }>(input as any);
  if (!id) throw new Error("Media id is required");

  const { data, error } = await supabase
    .from("media_items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMediaItem(input: { data: { id: string } } | { id: string } | string) {
  const raw = typeof input === 'string' ? { id: input } : unwrap<{ id: string }>(input as any);
  if (!raw?.id) throw new Error("Media id is required");

  const { error } = await supabase.from("media_items").delete().eq("id", raw.id);
  if (error) throw error;
  return { id: raw.id };
}

export async function getMediaAlbums() {
  const { data, error } = await supabase
    .from("media_albums")
    .select("*")
    .order("album_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMediaAlbum(input: { data: any } | any) {
  const payload = unwrap<any>(input);
  if (!payload?.title) throw new Error("Album title is required");

  const { data, error } = await supabase
    .from("media_albums")
    .insert([{
      title: payload.title,
      description: payload.description ?? null,
      cover_image_url: payload.cover_image_url ?? null,
      album_date: payload.album_date || null,
      category: payload.category ?? 'Worship Service',
      featured: payload.featured ?? false,
      is_public: payload.is_public ?? false,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMediaAlbum(input: { data: { id: string; patch: any } } | { id: string; patch: any }) {
  const { id, patch } = unwrap<{ id: string; patch: any }>(input as any);
  if (!id) throw new Error("Album id is required");

  const { data, error } = await supabase
    .from("media_albums")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMediaAlbum(input: { data: { id: string } } | { id: string } | string) {
  const raw = typeof input === 'string' ? { id: input } : unwrap<{ id: string }>(input as any);
  if (!raw?.id) throw new Error("Album id is required");

  const { error } = await supabase.from("media_albums").delete().eq("id", raw.id);
  if (error) throw error;
  return { id: raw.id };
}
