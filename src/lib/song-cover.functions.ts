import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const coverSchema = z.object({
  image: z.string().min(16).max(12_000_000),
});

/** Persists a generated/base64 cover in storage and returns its public URL. */
export const storeSongCover = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => coverSchema.parse(input))
  .handler(async ({ data }) => {
    const { storeCoverDataUrl } = await import('./song-cover.server');
    return { url: await storeCoverDataUrl(data.image) };
  });

/** Repairs legacy songs whose cover art was stored inline in the database. */
export const migrateSongCovers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'super_admin',
    });
    if (!isAdmin) throw new Error('Forbidden');
    const { migrateEmbeddedCovers } = await import('./song-cover.server');
    return migrateEmbeddedCovers();
  });
