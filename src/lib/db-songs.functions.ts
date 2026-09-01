import { supabase } from "@/integrations/supabase/client";
import { WorshipSong, SongLanguage, SongType, SongStatus } from "@/types/songs";
import { mapSongRow, SONG_DETAIL_SELECT, SONG_LIST_SELECT } from '@/lib/song-data';
import { formatSongText } from '@/lib/song-format';

export interface SongVersion {
  id: string;
  song_id: string;
  version_number: number;
  title: string;
  lyrics: string;
  chords: string;
  metadata: any;
  created_at: string;
  created_by: string;
}

export async function getSongs(): Promise<WorshipSong[]> {
  const { data, error } = await supabase
    .from('songs')
    .select(SONG_LIST_SELECT)
    .order('title');

  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, any>[];
  return rows.map((row) => mapSongRow(row));
}


export async function getSongById(id: string): Promise<WorshipSong | null> {
  const { data, error } = await supabase.from('songs').select(SONG_DETAIL_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapSongRow(data as Record<string, any>) : null;
}

export async function archiveSong(input: { data: string } | string) {
  const id = typeof input === 'string' ? input : input.data;
  const { error } = await supabase
    .from('songs')
    .update({ status: 'Archived' })
    .eq('id', id);

  if (error) throw error;
}

export async function createSong(input: { data: Partial<WorshipSong> } | Partial<WorshipSong>) {
  const song = ((input as any)?.data ?? input) as Partial<WorshipSong>;
  
  const insertData: any = {
    title: song.title,
    artist: song.artist || 'Unknown Artist',
    songwriter: song.songwriter,
    default_key: song.defaultKey,
    bpm: song.bpm,
    time_signature: song.timeSignature,
    language: song.language,
    themes: song.themes,
    scripture_references: song.scriptureReferences,
    song_type: song.songType,
    status: song.status,
    is_public: song.visibility === 'Public' || song.isPublic,
    featured: song.featured,
    audio_url: (song as any).audioUrl,
    sheet_music_url: (song as any).sheetMusicUrl,
     external_resources: (song as any).externalResources,
     artwork_url: song.artworkUrl,
    ccli_number: song.ccliNumber,
    lyrics: song.lyrics ? formatSongText(song.lyrics) : song.lyrics,
    chords: song.chords ? formatSongText(song.chords) : song.chords,
  };

  // Remove undefined properties to satisfy exactOptionalPropertyTypes
  Object.keys(insertData).forEach(key => insertData[key] === undefined && delete insertData[key]);

  const { data, error } = await supabase
    .from('songs')
    .insert([insertData])
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Song could not be created. Please try again.');
  return mapSongRow(data as Record<string, any>);
}

export async function updateSong(input: { data: { id: string, song: Partial<WorshipSong> } } | { id: string, song: Partial<WorshipSong> }) {
  const { id, song } = ((input as any)?.data ?? input);

  const updateData: any = {
    title: song.title,
    artist: song.artist,
    songwriter: song.songwriter,
    default_key: song.defaultKey,
    bpm: song.bpm,
    time_signature: song.timeSignature,
    language: song.language,
    themes: song.themes,
    scripture_references: song.scriptureReferences,
    song_type: song.songType,
    status: song.status,
    // Visibility is authoritative when present: switching to Team Only/Private must
    // unpublish, so never OR it with the previous isPublic value.
    is_public: song.visibility !== undefined ? song.visibility === 'Public' : song.isPublic,
    featured: song.featured === undefined ? undefined : Boolean(song.featured),
    audio_url: (song as any).audioUrl || song.externalResources?.audioUrl,
    sheet_music_url: (song as any).sheetMusicUrl || song.externalResources?.sheetMusicUrl,
     external_resources: song.externalResources,
     artwork_url: song.artworkUrl,
    ccli_number: song.ccliNumber,
    lyrics: song.lyrics ? formatSongText(song.lyrics) : song.lyrics,
    chords: song.chords ? formatSongText(song.chords) : song.chords,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined properties to satisfy exactOptionalPropertyTypes
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  const { data, error } = await supabase
    .from('songs')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Song could not be updated. Please refresh and try again.');
  return mapSongRow(data as Record<string, any>);
}

export async function deleteSong(input: { data: string } | string) {
  const id = typeof input === 'string' ? input : input.data;
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSongVersions(songId: string): Promise<SongVersion[]> {
  const { data, error } = await supabase
    .from('song_versions' as any)
    .select('*')
    .eq('song_id', songId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data as any[] || [];
}

export async function restoreSongVersion(songId: string, version: Partial<SongVersion>) {
  const updateData: any = {
    lyrics: version.lyrics,
    chords: version.chords,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined properties
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  const { error } = await supabase
    .from('songs')
    .update(updateData)
    .eq('id', songId);

  if (error) throw error;
  return true;
}
