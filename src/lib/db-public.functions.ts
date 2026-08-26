import { supabase } from "@/integrations/supabase/client";
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
  const ids = rows.map((song) => song.id).filter(Boolean);
  let artworkById = new Map<string, string>();

  if (ids.length > 0) {
    const { data: artworkRows } = await supabase
      .from("songs")
      .select("id, artwork_url")
      .in("id", ids)
      .not("artwork_url", "is", null)
      .not("artwork_url", "like", "data:%");
    artworkById = new Map((artworkRows ?? []).map((row: any) => [row.id, row.artwork_url]));
  }

  return rows.map((row) => mapSongRow({ ...row, artwork_url: artworkById.get(row.id) }));
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
