import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_QUERY_KEYS = [
  ["songs-public"],
  ["upcoming-service-public"],
  ["team-public"],
  ["resources-public"],
  ["media-public"],
  ["homepage-sections-public"],
] as const;


export function usePublicRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("public-content-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "songs" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_items" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_assignments" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "worship_resources" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "media_items" }, invalidatePublicQueries)
      .on("postgres_changes", { event: "*", schema: "public", table: "ministry_settings", filter: "key=eq.homepage_sections" }, invalidatePublicQueries)
      .subscribe();


    function invalidatePublicQueries() {
      for (const queryKey of PUBLIC_QUERY_KEYS) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
