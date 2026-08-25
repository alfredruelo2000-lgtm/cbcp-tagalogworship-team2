import { supabase } from "@/integrations/supabase/client";
import { WorshipSong, SongLanguage, SongType, SongStatus } from "@/types/songs";

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
    .select('*')
    .order('title');

  if (error) throw error;

  return (data || []).map((song: any) => ({
    ...song,
    language: song.language as SongLanguage,
    songType: song.song_type as SongType,
    status: song.status as SongStatus,
    visibility: song.is_public ? 'Public' : 'Team Only',
    scriptureReferences: song.scripture_references as any,
    defaultKey: song.default_key,
    lyrics: song.lyrics,
    chords: song.chords,
    isPublic: song.is_public,
     featured: song.featured,
     artworkUrl: song.artwork_url,
    createdAt: song.created_at,
    updatedAt: song.updated_at,
  })) as WorshipSong[];
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
    lyrics: song.lyrics,
    chords: song.chords,
  };

  // Remove undefined properties to satisfy exactOptionalPropertyTypes
  Object.keys(insertData).forEach(key => insertData[key] === undefined && delete insertData[key]);

  const { data, error } = await supabase
    .from('songs')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
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
    is_public: song.visibility === 'Public' || song.isPublic,
    featured: song.featured,
    audio_url: (song as any).audioUrl || song.externalResources?.audioUrl,
    sheet_music_url: (song as any).sheetMusicUrl || song.externalResources?.sheetMusicUrl,
     external_resources: song.externalResources,
     artwork_url: song.artworkUrl,
    lyrics: song.lyrics,
    chords: song.chords,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined properties to satisfy exactOptionalPropertyTypes
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  const { data, error } = await supabase
    .from('songs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
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

export function enhanceChordParsing(text: string): string {
  if (!text) return '';

  // Improved regex to handle common chord variations and inconsistent punctuation/spacing
  // Catches A, Am, A#maj7, G/B, Dsus4, etc. Even with trailing periods or commas.
  const chordPattern = '[A-G][#b]?(?:m|min|maj|dim|aug|sus|add|M|Δ)?[0-9]*(?:/[A-G][#b]?)?';
  const chordRegex = new RegExp('\\b' + chordPattern + '\\b', 'g');

  return text.split('\n').map(line => {
    // Skip already formatted lines to avoid double brackets
    if (line.includes('[') && line.includes(']')) return line;

    const trimmed = line.trim();
    if (!trimmed) return line;

    // Split by whitespace but keep punctuation attached to words for analysis
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    
    // Count how many "words" in the line look like chords
    const chordWordCount = words.filter(word => {
      // Clean word of common punctuation prefix/suffix for detection
      const cleanWord = word.replace(/^[.,()]+|[.,()]+$/g, '');
      return new RegExp('^' + chordPattern + '$').test(cleanWord);
    }).length;

    // Heuristic: If more than 40% of words are chords, or it's a very short line with at least one chord,
    // we treat it as a chord line.
    const isChordLine = chordWordCount / words.length > 0.4 || (words.length <= 3 && chordWordCount >= 1);

    if (isChordLine) {
      let result = line;
      // We want to replace chords with [Chord] while preserving punctuation and spacing.
      // We process words individually to handle punctuation correctly.
      const lineWords = line.split(/(\s+)/); // Keep delimiters (spaces)
      
      return lineWords.map(part => {
        if (/^\s+$/.test(part)) return part; // Keep spaces as is
        
        // Check if this word is a chord (potentially with punctuation)
        const prefix = part.match(/^[.,()]+/)?.[0] || '';
        const suffix = part.match(/[.,()]+$/)?.[0] || '';
        const core = part.slice(prefix.length, suffix.length ? -suffix.length : undefined);
        
        if (new RegExp('^' + chordPattern + '$').test(core)) {
          return `${prefix}[${core}]${suffix}`;
        }
        return part;
      }).join('');
    }

    return line;
  }).join('\n');
}
