import { supabase } from "@/integrations/supabase/client";

export async function getSongsPublic() {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("status", "Active")
    .eq("is_public", true)
    .order("title");

  if (error) throw error;
  
  return (data || []).map((song: any) => ({
    ...song,
    defaultKey: song.default_key,
    timeSignature: song.time_signature,
    createdAt: song.created_at,
    updatedAt: song.updated_at,
    scriptureReferences: song.scripture_references || [],
    songType: song.song_type,
     externalResources: song.external_resources,
     artworkUrl: song.artwork_url,
  }));
}

export async function getResourcesPublic() {
  const { data, error } = await supabase
    .from("worship_resources")
    .select("*")
    .eq("status", "Published")
    .eq("is_public", true)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMediaPublic() {
  const { data, error } = await supabase
    .from("media_items")
    .select(`
      *,
      media_albums (
        title
      )
    `)
    .eq("visibility", "Public")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTeamPublic() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, primary_role, bio, featured, is_public, display_order")
    .eq("is_public", true)
    .eq("status", "Active")
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUpcomingServicePublic() {
  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      service_items (*),
      service_assignments (*)
    `)
    .eq("is_public", true)
    .eq("status", "Ready")
    .gte("service_date", new Date().toISOString().split("T")[0])
    .order("service_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
