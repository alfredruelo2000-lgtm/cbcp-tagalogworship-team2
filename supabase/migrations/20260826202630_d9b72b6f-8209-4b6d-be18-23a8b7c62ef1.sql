DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'ministry_admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR public.has_role(auth.uid(), 'ministry_admin'::public.app_role)
);