import type { QueryClient } from '@tanstack/react-query';
import type { WorshipSong, SongLanguage, SongStatus, SongType } from '@/types/songs';

export const songKeys = {
  adminList: ['songs'] as const,
  publicList: ['songs-public'] as const,
  detail: (id: string) => ['song', id] as const,
  publicDetail: (id: string) => ['song-public', id] as const,
};

// Keep bulk song reads small. Cover art is stored in storage and referenced by
// a short proxy URL, so it is safe to include in list queries.
export const SONG_LIST_SELECT = [
  'id', 'title', 'artist', 'songwriter', 'default_key', 'bpm', 'time_signature',
  'language', 'themes', 'scripture_references', 'song_type', 'status', 'sections',
  'flow', 'worship_leader_notes', 'copyright_owner', 'copyright_year', 'ccli_number',
  'public_domain', 'created_at', 'updated_at', 'is_public', 'featured', 'audio_url',
  'sheet_music_url', 'external_resources', 'lyrics', 'chords', 'artwork_url',
].join(',');

export const SONG_DETAIL_SELECT = '*';


export function mapSongRow(row: Record<string, any>): WorshipSong {
  return {
    ...row,
    language: row['language'] as SongLanguage,
    songType: row['song_type'] as SongType,
    status: row['status'] as SongStatus,
    visibility: row['is_public'] ? 'Public' : 'Team Only',
    scriptureReferences: row['scripture_references'] ?? [],
    defaultKey: row['default_key'],
    timeSignature: row['time_signature'],
    isPublic: Boolean(row['is_public']),
    featured: Boolean(row['featured']),
    artworkUrl: row['artwork_url'],
    audioUrl: row['audio_url'],
    sheetMusicUrl: row['sheet_music_url'],
    externalResources: row['external_resources'],
    createdAt: row['created_at'],
    updatedAt: row['updated_at'],
  } as WorshipSong;
}

export function isPublicSong(song: Partial<WorshipSong>) {
  return song.status === 'Active' && (song.isPublic === true || song.visibility === 'Public');
}

function withoutEmbeddedArtwork(song: WorshipSong): WorshipSong {
  if (!song.artworkUrl?.startsWith('data:')) return song;
  const { artworkUrl: _artworkUrl, ...rest } = song;
  return rest as WorshipSong;
}

function upsertSorted(list: WorshipSong[] | undefined, song: WorshipSong) {
  const next = [...(list ?? []).filter((item) => item.id !== song.id), withoutEmbeddedArtwork(song)];
  return next.sort((a, b) => a.title.localeCompare(b.title));
}

/** Reconciles every in-memory song surface after a canonical database write. */
export function syncSongCaches(queryClient: QueryClient, song: WorshipSong) {
  queryClient.setQueryData<WorshipSong[]>(songKeys.adminList, (old) => upsertSorted(old, song));
  queryClient.setQueryData(songKeys.detail(song.id), song);
  if (isPublicSong(song)) {
    queryClient.setQueryData<WorshipSong[]>(songKeys.publicList, (old) => upsertSorted(old, song));
    queryClient.setQueryData(songKeys.publicDetail(song.id), song);
  } else {
    queryClient.setQueryData<WorshipSong[]>(songKeys.publicList, (old) => old?.filter((item) => item.id !== song.id));
    queryClient.removeQueries({ queryKey: songKeys.publicDetail(song.id), exact: true });
  }
}

export function removeSongFromCaches(queryClient: QueryClient, id: string) {
  queryClient.setQueryData<WorshipSong[]>(songKeys.adminList, (old) => old?.filter((item) => item.id !== id));
  queryClient.setQueryData<WorshipSong[]>(songKeys.publicList, (old) => old?.filter((item) => item.id !== id));
  queryClient.removeQueries({ queryKey: songKeys.detail(id), exact: true });
  queryClient.removeQueries({ queryKey: songKeys.publicDetail(id), exact: true });
}