import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  analyzeAppDesign, designAnalyzeSchema, designConceptSchema, designRefineSchema,
  generateAppDesignConcepts, refineAppDesignConcept,
} from './design-ai.server';

export const analyzeDesign = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => designAnalyzeSchema.parse(input))
  .handler(async ({ data }) => analyzeAppDesign(data));

export const generateDesignConcepts = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => designConceptSchema.parse(input))
  .handler(async ({ data }) => generateAppDesignConcepts(data));

export const refineDesignConcept = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => designRefineSchema.parse(input))
  .handler(async ({ data }) => refineAppDesignConcept(data));
