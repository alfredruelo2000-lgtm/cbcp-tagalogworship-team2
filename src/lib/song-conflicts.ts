// Optimistic-concurrency helpers for song edits.
// Shared by the update path in db-songs.functions.ts and the conflict dialog UI.

export const SONG_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  artist: 'Artist',
  songwriter: 'Songwriter',
  default_key: 'Default key',
  bpm: 'BPM',
  time_signature: 'Time signature',
  language: 'Language',
  themes: 'Themes',
  scripture_references: 'Scripture references',
  song_type: 'Song type',
  status: 'Status',
  is_public: 'Public visibility',
  featured: 'Featured',
  audio_url: 'Audio link',
  sheet_music_url: 'Sheet music link',
  external_resources: 'Extra resources',
  artwork_url: 'Cover art',
  lyrics: 'Lyrics / chord sheet',
  chords: 'Chords',
  ccli_number: 'CCLI number',
};

export interface SongFieldConflict {
  field: string;
  label: string;
  base: unknown;
  mine: unknown;
  theirs: unknown;
}

export class SongConflictError extends Error {
  conflicts: SongFieldConflict[];
  /** Full remote row as it exists now. */
  remote: Record<string, any>;
  /** The caller's pending changes, in database column shape. */
  mine: Record<string, any>;

  constructor(conflicts: SongFieldConflict[], remote: Record<string, any>, mine: Record<string, any>) {
    super('This song was changed by someone else while you were editing.');
    this.name = 'SongConflictError';
    this.conflicts = conflicts;
    this.remote = remote;
    this.mine = mine;
  }
}

export function isSongConflictError(error: unknown): error is SongConflictError {
  return error instanceof SongConflictError || (error as any)?.name === 'SongConflictError';
}

/** Stable comparison that treats null/undefined/'' as equal and compares objects structurally. */
export function sameValue(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) => {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return typeof v === 'number' ? String(v) : v;
  };
  return norm(a) === norm(b);
}

/** Database column keys the editor can change. */
export function changedFields(
  base: Record<string, any> | undefined,
  next: Record<string, any>,
): string[] {
  if (!base) return Object.keys(next);
  return Object.keys(next).filter((key) => !sameValue(base[key], next[key]));
}

export function describeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '(empty)';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}
