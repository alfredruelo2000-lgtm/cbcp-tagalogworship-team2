import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { analyzeSchema, conceptSchema, analyzeLogo, generateLogoConcepts } from './brand-ai.server';

export const generateBrandConcepts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => conceptSchema.parse(input))
  .handler(async ({ data }) => generateLogoConcepts(data));

export const reviewBrandLogo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => analyzeSchema.parse(input))
  .handler(async ({ data }) => analyzeLogo(data));
