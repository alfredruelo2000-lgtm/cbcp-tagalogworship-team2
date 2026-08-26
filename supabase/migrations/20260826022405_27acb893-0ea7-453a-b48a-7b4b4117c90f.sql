DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['songs','services','service_items','service_assignments','profiles','worship_resources','media_items','media_albums','ministry_settings']
  LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;