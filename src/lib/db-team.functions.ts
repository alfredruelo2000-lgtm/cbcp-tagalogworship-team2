import { supabase } from "@/integrations/supabase/client";

export async function getProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) throw error;
  return data || [];
}

export async function getTeamMembers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) throw error;
  return (data || []).map(profile => ({
    ...profile,
    // Ensure primary_role and other fields are mapped consistently
    primaryRole: profile.primary_role,
    dateJoined: profile.date_joined,
    internalNotes: profile.internal_notes,
    authProvider: profile.auth_provider,
    isPublic: profile.is_public,
  }));
}

export async function createMember(input: { data: any } | any) {
  const payload = ((input as any)?.data ?? input) as any;
  if (!payload?.full_name) throw new Error("Full name is required");
  if (!payload?.email) throw new Error("Email is required");

  // Map camelCase to snake_case for Supabase
  const insertData: any = {
    id: payload.id || crypto.randomUUID(),
    full_name: payload.full_name,
    email: payload.email,
    primary_role: payload.primary_role || payload.primaryRole || null,
    skills: payload.instruments || payload.skills
      ? (Array.isArray(payload.instruments || payload.skills)
          ? (payload.instruments || payload.skills)
          : String(payload.instruments || payload.skills).split(',').map((s: string) => s.trim()).filter(Boolean))
      : null,
    is_public: payload.is_public !== undefined ? payload.is_public : (payload.isPublic !== undefined ? payload.isPublic : true),
    status: payload.status || 'Active',
    bio: payload.bio ?? null,
    avatar_url: payload.avatar_url || payload.avatarUrl || null,
    instrument: payload.instruments && !Array.isArray(payload.instruments) ? payload.instruments : null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMember(input: { data: { id: string; updates: any } } | { id: string; updates: any }) {
  const { id, updates } = ((input as any)?.data ?? input) as { id: string; updates: any };

  // Map camelCase to snake_case for Supabase updates
  const updateData: any = { ...updates };
  if (updates.primaryRole) updateData.primary_role = updates.primaryRole;
  if (updates.avatarUrl) updateData.avatar_url = updates.avatarUrl;
  if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
  
  // Clean camelCase keys that were mapped
  delete updateData.primaryRole;
  delete updateData.avatarUrl;
  delete updateData.isPublic;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMember(input: { data: { id: string } } | { id: string }) {
  const { id } = ((input as any)?.data ?? input) as { id: string };

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}

export async function getAssignments() {
  const { data, error } = await supabase
    .from("service_assignments")
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function createAssignment(input: { data: any } | any) {
  const payload = ((input as any)?.data ?? input) as any;
  if (!payload?.service_id) throw new Error("A service is required");
  if (!payload?.member_id) throw new Error("A team member is required");

  const { data: existing, error: existingError } = await supabase.from("service_assignments").select("id").eq("service_id", payload.service_id).eq("user_id", payload.member_id).maybeSingle();
  if (existingError) throw existingError;
  if (existing) throw new Error("This team member is already assigned to this service");

  const insertData: any = {
    service_id: payload.service_id,
    user_id: payload.user_id || payload.member_id,
    role: payload.role ?? null,
    status: payload.status ?? 'Pending',
    notes: payload.notes ?? null,
    call_time: payload.call_time ?? null,
  };

  const { data, error } = await supabase
    .from("service_assignments")
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAssignmentStatus(input: { data: { id: string; status: string } } | { id: string; status: string }) {
  const { id, status } = ((input as any)?.data ?? input) as { id: string; status: string };

  const { data, error } = await supabase
    .from("service_assignments")
    .update({ status: status as any })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
