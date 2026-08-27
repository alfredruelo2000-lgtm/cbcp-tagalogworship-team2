import { supabase } from "@/integrations/supabase/client";
import { PUBLIC_VISIBLE_STATUSES } from "@/lib/team-roles";
import { mapSongRow, SONG_DETAIL_SELECT, SONG_LIST_SELECT } from "@/lib/song-data";


export async function getSongsPublic() {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_LIST_SELECT)
    .eq("status", "Active")
    .eq("is_public", true)
    .order("title");

  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, any>[];
  return rows.map((row) => mapSongRow(row));
}


export async function getSongPublicById(id: string) {
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_DETAIL_SELECT)
    .eq("id", id)
    .eq("status", "Active")
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSongRow(data as Record<string, any>) : null;
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
      id, title, description, media_type, file_url, thumbnail_url, category,
      album_id, event_date, tags, duration, featured, sort_order, created_at,
      media_albums ( id, title )
    `)
    .eq("visibility", "Public")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMediaAlbumsPublic() {
  const { data, error } = await supabase
    .from("media_albums")
    .select("id, title, description, cover_image_url, album_date, category, featured")
    .eq("is_public", true)
    .order("album_date", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

const TEAM_PUBLIC_SELECT =
  'id, full_name, public_name, avatar_url, primary_role, bio, instrument, skills, vocal_range, email, show_public_contact, featured, is_public, display_order, status, date_joined, created_at';

export async function getTeamPublic() {
  const { data, error } = await supabase
    .from("profiles")
    .select(TEAM_PUBLIC_SELECT)
    .eq("is_public", true)
    .in("status", [...PUBLIC_VISIBLE_STATUSES])
    .order("display_order", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getTeamMemberPublic(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(TEAM_PUBLIC_SELECT)
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  return data;
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
