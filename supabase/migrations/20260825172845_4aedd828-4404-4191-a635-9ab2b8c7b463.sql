ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_public_duplicate boolean NOT NULL DEFAULT true;

UPDATE public.services SET is_official = true WHERE is_official IS NOT TRUE;

CREATE INDEX IF NOT EXISTS services_owner_id_idx ON public.services(owner_id);
CREATE INDEX IF NOT EXISTS service_items_service_id_idx ON public.service_items(service_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_items TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.service_items TO anon;
GRANT ALL ON public.services TO service_role;
GRANT ALL ON public.service_items TO service_role;

-- Clean up over-permissive legacy policies
DROP POLICY IF EXISTS "Admins can do everything on services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Public read for services" ON public.services;
DROP POLICY IF EXISTS "Public read for public services" ON public.services;
DROP POLICY IF EXISTS "Public read for ready services" ON public.services;
DROP POLICY IF EXISTS "Public can view public services" ON public.services;
DROP POLICY IF EXISTS "Admin/Leader write for services" ON public.services;

DROP POLICY IF EXISTS "Admins can do everything on service_items" ON public.service_items;
DROP POLICY IF EXISTS "Admins can manage service items" ON public.service_items;
DROP POLICY IF EXISTS "Public read for service items" ON public.service_items;
DROP POLICY IF EXISTS "Admin/Leader write for service items" ON public.service_items;

CREATE OR REPLACE FUNCTION public.is_worship_planner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','ministry_admin','worship_pastor','worship_director','worship_leader')
  )
$$;

REVOKE ALL ON FUNCTION public.is_worship_planner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_worship_planner(uuid) TO authenticated, service_role;

-- services
CREATE POLICY "Visitors read published official setlists"
ON public.services FOR SELECT TO anon
USING (is_official = true AND is_public = true AND status <> 'Archived'::setlist_status);

CREATE POLICY "Members read official and own setlists"
ON public.services FOR SELECT TO authenticated
USING (is_official = true OR owner_id = auth.uid());

CREATE POLICY "Members create own setlists"
ON public.services FOR INSERT TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND (is_official = false OR public.is_worship_planner(auth.uid()))
);

CREATE POLICY "Owners and planners update setlists"
ON public.services FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_worship_planner(auth.uid()))
WITH CHECK (
  (owner_id = auth.uid() AND is_official = false)
  OR public.is_worship_planner(auth.uid())
);

CREATE POLICY "Owners and planners delete setlists"
ON public.services FOR DELETE TO authenticated
USING ((owner_id = auth.uid() AND is_official = false) OR public.is_worship_planner(auth.uid()));

-- service_items
CREATE POLICY "Visitors read items of published official setlists"
ON public.service_items FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_items.service_id));

CREATE POLICY "Members read visible setlist items"
ON public.service_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_items.service_id));

CREATE POLICY "Owners and planners write setlist items"
ON public.service_items FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.id = service_items.service_id
    AND (s.owner_id = auth.uid() OR public.is_worship_planner(auth.uid()))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.id = service_items.service_id
    AND (s.owner_id = auth.uid() OR public.is_worship_planner(auth.uid()))
));