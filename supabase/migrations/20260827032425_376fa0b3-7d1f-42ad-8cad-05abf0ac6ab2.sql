-- Missing Data API grants (media was unreachable from the app)
GRANT SELECT ON public.media_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;

GRANT SELECT ON public.media_albums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_albums TO authenticated;
GRANT ALL ON public.media_albums TO service_role;

-- Album public flag + media ordering
ALTER TABLE public.media_albums ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.media_albums ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Public visitors: only public albums
DROP POLICY IF EXISTS "Public can view featured albums" ON public.media_albums;
CREATE POLICY "Public can view public albums"
ON public.media_albums FOR SELECT TO anon
USING (is_public = true);

-- Worship leaders may manage albums too
DROP POLICY IF EXISTS "Admin write for albums" ON public.media_albums;
CREATE POLICY "Planners can manage albums"
ON public.media_albums FOR ALL TO authenticated
USING (public.is_worship_planner(auth.uid()))
WITH CHECK (public.is_worship_planner(auth.uid()));

-- Remove duplicate anon policy on media_items
DROP POLICY IF EXISTS "Public read for public media" ON public.media_items;

-- Keep album timestamps fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_media_albums_updated_at ON public.media_albums;
CREATE TRIGGER update_media_albums_updated_at
BEFORE UPDATE ON public.media_albums
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();