import { supabase } from '@/integrations/supabase/client';

export const MEDIA_BUCKET = 'song-resources';
export const MEDIA_MAX_BYTES = 50 * 1024 * 1024;

/** Storage buckets are private, so viewers read files through the public proxy route. */
export function mediaProxyUrl(path: string) {
  return `/api/public/media/${MEDIA_BUCKET}/${path}`;
}

export function detectMediaType(file: File): 'Photo' | 'Video' | 'Audio' | 'Document' {
  if (file.type.startsWith('image/')) return 'Photo';
  if (file.type.startsWith('video/')) return 'Video';
  if (file.type.startsWith('audio/')) return 'Audio';
  return 'Document';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface UploadedMediaFile {
  url: string;
  path: string;
  mediaType: 'Photo' | 'Video' | 'Audio' | 'Document';
  fileSize: string;
  fileType: string;
}

export async function uploadMediaFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedMediaFile> {
  if (file.size > MEDIA_MAX_BYTES) throw new Error('File must be 50MB or smaller');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `media/${crypto.randomUUID()}-${safeName}`;

  // Supabase JS has no upload progress event; report a coarse indeterminate ramp.
  let ticker: ReturnType<typeof setInterval> | undefined;
  if (onProgress) {
    let fake = 8;
    onProgress(fake);
    ticker = setInterval(() => {
      fake = Math.min(90, fake + Math.random() * 12);
      onProgress(fake);
    }, 400);
  }

  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
    if (error) throw error;
    onProgress?.(100);
    return {
      url: mediaProxyUrl(path),
      path,
      mediaType: detectMediaType(file),
      fileSize: formatFileSize(file.size),
      fileType: (safeName.split('.').pop() || '').toUpperCase(),
    };
  } finally {
    if (ticker) clearInterval(ticker);
  }
}
