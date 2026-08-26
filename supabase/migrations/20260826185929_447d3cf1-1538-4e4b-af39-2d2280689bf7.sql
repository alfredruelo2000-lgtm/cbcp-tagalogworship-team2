-- audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- user_roles
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

-- ministry_settings
DROP POLICY IF EXISTS "Admins can update settings" ON public.ministry_settings;
CREATE POLICY "Admins can insert ministry settings" ON public.ministry_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'ministry_admin'::app_role));
CREATE POLICY "Admins can delete ministry settings" ON public.ministry_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'ministry_admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'ministry_admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'ministry_admin'::app_role));

-- media
DROP POLICY IF EXISTS "Admins can do everything on media_albums" ON public.media_albums;
DROP POLICY IF EXISTS "Admins can manage media items" ON public.media_items;

-- service_assignments
DROP POLICY IF EXISTS "Admins can do everything on service_assignments" ON public.service_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.service_assignments;

-- songs
DROP POLICY IF EXISTS "Admins can do everything on songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can manage songs" ON public.songs;

-- song_versions
DROP POLICY IF EXISTS "Admins can delete song versions" ON public.song_versions;
CREATE POLICY "Admins can delete song versions" ON public.song_versions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'ministry_admin'::app_role));

-- worship_resources
DROP POLICY IF EXISTS "Admins can manage resources" ON public.worship_resources;

-- service_items visibility
DROP POLICY IF EXISTS "Members read visible setlist items" ON public.service_items;
CREATE POLICY "Members read visible setlist items" ON public.service_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_items.service_id
      AND (s.is_official = true OR s.owner_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Visitors read items of published official setlists" ON public.service_items;
CREATE POLICY "Visitors read items of published official setlists" ON public.service_items FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.services s
    WHERE s.id = service_items.service_id
      AND s.is_official = true
      AND s.is_public = true
      AND s.status <> 'Archived'::setlist_status
  ));