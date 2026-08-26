import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Query key prefixes that depend on a given table. Both public-site and
// admin-dashboard caches are listed so either side refreshes instantly.
const TABLE_KEYS: Record<string, string[]> = {
  songs: ["songs-public", "songs", "song", "song-versions", "setlist", "setlists-public", "dashboard-stats"],
  services: ["upcoming-service-public", "services", "service", "setlists", "setlists-public", "setlist", "dashboard-stats"],
  service_items: ["upcoming-service-public", "setlist", "setlists", "setlists-public", "service"],
  service_assignments: ["upcoming-service-public", "assignments", "schedule", "service", "setlist"],
  profiles: ["team-public", "team", "profiles", "profile"],
  worship_resources: ["resources-public", "resources", "resource"],
  media_items: ["media-public", "media"],
  media_albums: ["media-public", "media"],
  ministry_settings: ["homepage-sections-public", "ministry-settings", "settings"],
};

const TABLES = Object.keys(TABLE_KEYS);

function invalidate(queryClient: QueryClient, table: string) {
  const prefixes = TABLE_KEYS[table] ?? [];
  void queryClient.invalidateQueries({
    refetchType: "active",
    predicate: (query) => {
      const root = query.queryKey[0];
      return typeof root === "string" && prefixes.includes(root);
    },
  });
}

/**
 * Keeps every React Query cache in sync with database changes in real time.
 * Mounted once at the app root so the public site and the admin dashboard
 * both react to writes immediately (no 30s staleness window).
 */
export function usePublicRealtime() {
  const queryClient = useQueryClient();
  const clientRef = useRef(queryClient);
  clientRef.current = queryClient;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let channel = subscribe();

    function subscribe() {
      const ch = supabase.channel(`content-sync-${Math.random().toString(36).slice(2)}`);
      for (const table of TABLES) {
        ch.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          invalidate(clientRef.current, payload.table);
        });
      }
      ch.subscribe();
      return ch;
    }

    // Reconnect + catch up after the tab wakes or the network returns.
    const resync = () => {
      if (document.visibilityState === "hidden") return;
      for (const table of TABLES) invalidate(clientRef.current, table);
    };
    window.addEventListener("online", resync);
    document.addEventListener("visibilitychange", resync);

    return () => {
      window.removeEventListener("online", resync);
      document.removeEventListener("visibilitychange", resync);
      void supabase.removeChannel(channel);
    };
  }, []);
}

export const useContentRealtime = usePublicRealtime;
