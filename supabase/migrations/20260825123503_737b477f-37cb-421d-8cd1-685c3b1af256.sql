INSERT INTO public.initial_super_admin_setup (email)
VALUES ('alfredkennethr@gmail.com')
ON CONFLICT DO NOTHING;

-- Retro-fit: if that account already exists, promote it now.
UPDATE public.profiles
SET status = 'Active'::public.member_status, updated_at = now()
WHERE lower(email) = 'alfredkennethr@gmail.com';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM public.profiles
WHERE lower(email) = 'alfredkennethr@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;