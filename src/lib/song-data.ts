import type { WorshipSong, SongLanguage, SongStatus, SongType } from '@/types/songs';

export const songKeys = {
  adminList: ['songs'] as const,
  publicList: ['songs-public'] as const,
  detail: (id: string) => ['song', id] as const,
  publicDetail: (id: string) => ['song-public', id] as const,
};

// Keep bulk song reads small. Existing embedded base64 cover images can be
// multiple megabytes each, so artwork is loaded only when it is a normal URL.
export const SONG_LIST_SELECT = [
  'id', 'title', 'artist', 'songwriter', 'default_key', 'bpm', 'time_signature',
  'language', 'themes', 'scripture_references', 'song_type', 'status', 'sections',
  'flow', 'worship_leader_notes', 'copyright_owner', 'copyright_year', 'ccli_number',
  'public_domain', 'created_at', 'updated_at', 'is_public', 'featured', 'audio_url',
  'sheet_music_url', 'external_resources', 'lyrics', 'chords',
].join(',');

export const SONG_DETAIL_SELECT = '*';

export function mapSongRow(row: Record<string, any>): WorshipSong {
  return {
    ...row,
    language: row.language as SongLanguage,
    songType: row.song_type as SongType,
    status: row.status as SongStatus,
    visibility: row.is_public ? 'Public' : 'Team Only',
    scriptureReferences: row.scripture_references ?? [],
    defaultKey: row.default_key,
    timeSignature: row.time_signature,
    isPublic: Boolean(row.is_public),
    featured: Boolean(row.featured),
    artworkUrl: row.artwork_url,
    audioUrl: row.audio_url,
    sheetMusicUrl: row.sheet_music_url,
    externalResources: row.external_resources,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as WorshipSong;
}

export function isPublicSong(song: Partial<WorshipSong>) {
  return song.status === 'Active' && (song.isPublic === true || song.visibility === 'Public');
}