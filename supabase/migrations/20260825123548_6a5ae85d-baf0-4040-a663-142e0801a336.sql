-- 1. Pin search_path on the remaining trigger function.
ALTER FUNCTION public.handle_song_versioning() SET search_path = public;

-- 2. Trigger functions must never be callable from the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_song_versioning() FROM PUBLIC, anon, authenticated;

-- 3. has_role is used inside RLS policies, so signed-in users must keep EXECUTE.
--    Anonymous visitors have no need for it.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 4. Owner bootstrap table: RLS was on with no policy. Keep it closed to the
--    public API, and let super admins read it for transparency.
GRANT SELECT ON public.initial_super_admin_setup TO authenticated;
GRANT ALL ON public.initial_super_admin_setup TO service_role;

CREATE POLICY "Super admins can view owner setup"
ON public.initial_super_admin_setup
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));