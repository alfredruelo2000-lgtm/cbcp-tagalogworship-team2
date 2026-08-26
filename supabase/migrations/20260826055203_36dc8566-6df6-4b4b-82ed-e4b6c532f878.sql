ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_name text,
  ADD COLUMN IF NOT EXISTS show_public_contact boolean NOT NULL DEFAULT false;