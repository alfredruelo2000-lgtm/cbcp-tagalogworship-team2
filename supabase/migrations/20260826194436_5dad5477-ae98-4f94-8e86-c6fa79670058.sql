CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u record;
  is_initial_admin boolean := false;
  result public.profiles;
  provider text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, email, raw_user_meta_data, raw_app_meta_data, created_at
    INTO u FROM auth.users WHERE id = uid;

  IF u.id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  provider := COALESCE(u.raw_app_meta_data->>'provider', 'email');

  SELECT EXISTS (
    SELECT 1 FROM public.initial_super_admin_setup WHERE lower(email) = lower(u.email)
  ) INTO is_initial_admin;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, status, auth_provider, created_at, updated_at)
  VALUES (
    uid,
    COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', ''), split_part(COALESCE(u.email, 'New Member'), '@', 1)),
    u.email,
    NULLIF(u.raw_user_meta_data->>'avatar_url', ''),
    CASE WHEN is_initial_admin THEN 'Active'::public.member_status ELSE 'Pending'::public.member_status END,
    provider,
    COALESCE(u.created_at, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    auth_provider = COALESCE(public.profiles.auth_provider, EXCLUDED.auth_provider),
    status = COALESCE(public.profiles.status, EXCLUDED.status),
    updated_at = now()
  RETURNING * INTO result;

  IF is_initial_admin THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = uid) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'viewer'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;