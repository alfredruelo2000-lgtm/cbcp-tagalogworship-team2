const BUCKET = 'song-resources';

export function mediaProxyUrl(bucket: string, path: string) {
  return `/api/public/media/${bucket}/${path}`;
}

function decodeDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) throw new Error('Unsupported image payload.');
  const contentType = match[1]!;
  const binary = atob(match[2]!);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
  return { bytes, contentType, ext };
}

/** Stores a base64 image in storage and returns a stable public proxy URL. */
export async function storeCoverDataUrl(dataUrl: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { bytes, contentType, ext } = decodeDataUrl(dataUrl);
  const path = `covers/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(error.message);

  return mediaProxyUrl(BUCKET, path);
}

/** One-time repair: move legacy embedded base64 covers into storage. */
export async function migrateEmbeddedCovers() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin
    .from('songs')
    .select('id, artwork_url')
    .like('artwork_url', 'data:%');
  if (error) throw new Error(error.message);

  let migrated = 0;
  const failures: string[] = [];
  for (const row of data ?? []) {
    try {
      const url = await storeCoverDataUrl(row.artwork_url as string);
      const { error: updateError } = await supabaseAdmin
        .from('songs')
        .update({ artwork_url: url })
        .eq('id', row.id);
      if (updateError) throw new Error(updateError.message);
      migrated += 1;
    } catch (e) {
      failures.push(`${row.id}: ${e instanceof Error ? e.message : 'unknown error'}`);
    }
  }
  return { migrated, failures };
}
