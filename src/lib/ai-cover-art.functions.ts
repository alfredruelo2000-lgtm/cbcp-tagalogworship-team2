import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { generateCoverArt } from './ai-cover-art.server';

const inputSchema = z.object({
  title: z.string().min(1).max(200), artist: z.string().max(200).optional(), songwriter: z.string().max(200).optional(),
  language: z.string().max(80).optional(), themes: z.array(z.string().max(80)).max(20).optional(), scripture: z.string().max(300).optional(),
  mood: z.string().max(80), style: z.string().max(100), direction: z.string().max(500).optional(),
});

export const generateSongCover = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => generateCoverArt(data));
