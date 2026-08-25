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

export async function getMediaItems() {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMediaItem(input: { data: any } | any) {
  const payload = ((input as any)?.data ?? input) as any;
  if (!payload?.title) throw new Error("Title is required");
  if (!payload?.file_url) throw new Error("A file URL is required");

  const insertData: any = {
    title: payload.title,
    file_url: payload.file_url,
    media_type: payload.media_type ?? 'Photo',
    category: payload.category ?? null,
    description: payload.description ?? null,
    thumbnail_url: payload.thumbnail_url ?? null,
    visibility: payload.visibility ?? 'Public',
  };

  const { data, error } = await supabase
    .from("media_items")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}
