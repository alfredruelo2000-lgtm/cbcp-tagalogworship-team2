import { supabase } from '@/integrations/supabase/client';

export const logAuditAction = async (
  action: string,
  entityType: string,
  entityId?: string,
  summary?: string,
  metadata?: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Using a direct Supabase call for now, assuming types might not be perfectly in sync
    // or the 'audit_logs' table was just created and not yet in the generated types.
    const { error } = await supabase
      .from('audit_logs' as any)
      .insert({
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        summary,
        metadata
      } as any);

    if (error) throw error;
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
};
