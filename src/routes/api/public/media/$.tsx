import { createFileRoute } from '@tanstack/react-router';

// Public, cacheable image proxy for private storage buckets.
// Buckets in this project are private, so anonymous visitors read cover art
// and avatars through this allowlisted, read-only endpoint.
const ALLOWED_BUCKETS = new Set(['song-resources', 'personnel-avatars']);

export const Route = createFileRoute('/api/public/media/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = (params as Record<string, string>)['_splat'] ?? '';
        const [bucket, ...rest] = splat.split('/');
        const path = rest.join('/');

        if (!bucket || !ALLOWED_BUCKETS.has(bucket) || !path || path.includes('..')) {
          return new Response('Not found', { status: 404 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
        if (error || !data) return new Response('Not found', { status: 404 });

        return new Response(data, {
          headers: {
            'Content-Type': data.type || 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      },
    },
  },
});
