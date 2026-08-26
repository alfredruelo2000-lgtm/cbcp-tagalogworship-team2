CREATE INDEX IF NOT EXISTS songs_public_active_title_idx
  ON public.songs (title)
  WHERE is_public = true AND status = 'Active'::public.song_status;

GRANT SELECT ON public.songs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.songs TO authenticated;
GRANT ALL ON public.songs TO service_role;

CREATE TABLE public.song_change_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  song_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  is_public boolean NOT NULL DEFAULT false,
  status public.song_status,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.song_change_events TO anon, authenticated;
GRANT ALL ON public.song_change_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.song_change_events_id_seq TO service_role;

ALTER TABLE public.song_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Song change events are publicly readable"
  ON public.song_change_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.broadcast_song_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  target_public boolean;
  target_status public.song_status;
BEGIN
  target_id := COALESCE(NEW.id, OLD.id);
  target_public := CASE WHEN TG_OP = 'DELETE' THEN false ELSE COALESCE(NEW.is_public, false) END;
  target_status := CASE WHEN TG_OP = 'DELETE' THEN OLD.status ELSE NEW.status END;

  INSERT INTO public.song_change_events (song_id, operation, is_public, status)
  VALUES (target_id, TG_OP, target_public, target_status);

  DELETE FROM public.song_change_events
  WHERE changed_at < now() - interval '7 days';

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.broadcast_song_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_song_change() TO service_role;

DROP TRIGGER IF EXISTS song_change_broadcast_trigger ON public.songs;
CREATE TRIGGER song_change_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.songs
FOR EACH ROW EXECUTE FUNCTION public.broadcast_song_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.song_change_events;