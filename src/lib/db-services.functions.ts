import { supabase } from "@/integrations/supabase/client";
import { WorshipSetlist, SetlistStatus, ServiceType, ServiceVisibility } from '@/types/setlists';

export async function getServices(): Promise<WorshipSetlist[]> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      service_items (*),
      service_assignments (*)
    `)
    .order('service_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((service: any) => ({
    ...service,
    serviceDate: service.service_date,
    serviceTime: service.service_time,
    serviceType: service.service_type as ServiceType,
    worshipLeader: service.worship_leader_id,
    status: service.status as SetlistStatus,
    visibility: service.visibility as ServiceVisibility,
    isPublic: service.is_public,
    songs: (service.service_items || [])
      .filter((item: any) => item.item_type === 'Song')
      .map((item: any) => ({
        id: item.id,
        songId: item.song_id,
        order: item.sort_order,
        selectedKey: item.selected_key,
        category: item.category,
        duration: item.duration,
        leaderNote: item.leader_note,
        transitionNote: item.transition_note,
        musicianNotes: item.musician_notes
      })),
    items: (service.service_items || []).map((item: any) => ({
      id: item.id,
      order: item.sort_order,
      type: item.item_type,
      title: item.title,
      assignedPerson: item.assigned_person,
      duration: item.duration,
      notes: item.notes,
      songId: item.song_id
    })),
    assignments: (service.service_assignments || []).map((as: any) => ({
      id: as.id,
      serviceId: as.service_id,
      memberId: as.member_id,
      role: as.role,
      status: as.status,
      callTime: as.call_time,
      notes: as.notes
    })),
    rehearsalDate: service.rehearsal_date,
    rehearsalTime: service.rehearsal_time,
    rehearsalLocation: service.rehearsal_location,
    rehearsalNotes: service.rehearsal_notes,
    estimatedDuration: service.estimated_duration,
    createdAt: service.created_at,
    updatedAt: service.updated_at
  })) as WorshipSetlist[];
}

export async function createService(input: { data: Partial<WorshipSetlist> } | Partial<WorshipSetlist>) {
  const service = ((input as any)?.data ?? input) as Partial<WorshipSetlist>;
  const insertData: any = {
    title: service.title || 'New Service',
    service_date: service.serviceDate || new Date().toISOString().split('T')[0],
    service_time: service.serviceTime || '10:00',
    service_type: service.serviceType || 'Sunday Worship',
    status: service.status || 'Draft',
    theme: service.theme || null,
    scripture_reference: service.scriptureReference || null,
    notes: service.notes || null,
    worship_leader_id: service.worshipLeader || null,
    rehearsal_date: service.rehearsalDate || null,
    rehearsal_time: service.rehearsalTime || null,
    rehearsal_location: service.rehearsalLocation || null,
    rehearsal_notes: service.rehearsalNotes || null,
    is_public: service.visibility === 'Public',
    visibility: service.visibility || 'Public'
  };

  const { data, error } = await supabase
    .from('services')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateService(input: { data: { id: string; service: Partial<WorshipSetlist> } } | { id: string; service: Partial<WorshipSetlist> }) {
  const { id, service } = ((input as any)?.data ?? input) as { id: string; service: Partial<WorshipSetlist> };
  const updateData: any = {};
  if (service.title !== undefined) updateData.title = service.title;
  if (service.serviceDate !== undefined) updateData.service_date = service.serviceDate;
  if (service.serviceTime !== undefined) updateData.service_time = service.serviceTime;
  if (service.serviceType !== undefined) updateData.service_type = service.serviceType;
  if (service.status !== undefined) updateData.status = service.status;
  if (service.theme !== undefined) updateData.theme = service.theme || null;
  if (service.scriptureReference !== undefined) updateData.scripture_reference = service.scriptureReference || null;
  if (service.notes !== undefined) updateData.notes = service.notes || null;
  if (service.worshipLeader !== undefined) updateData.worship_leader_id = service.worshipLeader || null;
  if (service.rehearsalDate !== undefined) updateData.rehearsal_date = service.rehearsalDate || null;
  if (service.rehearsalTime !== undefined) updateData.rehearsal_time = service.rehearsalTime || null;
  if (service.rehearsalLocation !== undefined) updateData.rehearsal_location = service.rehearsalLocation || null;
  if (service.rehearsalNotes !== undefined) updateData.rehearsal_notes = service.rehearsalNotes || null;
  if (service.visibility !== undefined) {
    updateData.visibility = service.visibility;
    updateData.is_public = service.visibility === 'Public';
  }

  const { data, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
