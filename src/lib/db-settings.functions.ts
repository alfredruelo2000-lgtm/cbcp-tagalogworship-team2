import { supabase } from "@/integrations/supabase/client";

export async function getSettings() {
  const { data, error } = await supabase
    .from("ministry_settings")
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function updateSetting(input: { data: { key: string; value: any } } | { key: string; value: any }) {
  const payload = ((input as any)?.data ?? input) as { key: string; value: any };
  const { error } = await supabase
    .from("ministry_settings")
    .upsert({
      key: payload.key,
      value: payload.value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

  if (error) throw error;
  return { success: true };
}

export async function getSettingByKey(input: { data: string } | string) {
  const key = typeof input === 'string' ? input : input.data;
  const { data, error } = await supabase
    .from("ministry_settings")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error) throw error;
  return data;
}
