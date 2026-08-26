/**
 * Offline layer for Songs + Setlists.
 *
 * - React Query cache is persisted to IndexedDB, so song charts, setlists,
 *   per-setlist keys and notes survive refresh, restart and offline launches.
 * - Writes made while offline go into a small IndexedDB outbox and are replayed
 *   (newest change per record wins) as soon as the connection returns.
 */
import { useEffect, useState } from "react";
import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import { createStore, get, set, del } from "idb-keyval";

const store = createStore("cbcp-offline", "kv");
const CACHE_KEY = "react-query-cache";
const OUTBOX_KEY = "outbox";
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 60; // keep downloaded charts for 60 days
const PERSISTED_ROOTS = ["songs-public", "setlists", "setlist", "setlist-permissions", "services"];


export type SyncStatus = "synced" | "offline" | "pending" | "syncing" | "saved-local";

let status: SyncStatus = "synced";
const listeners = new Set<(s: SyncStatus) => void>();

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener(status));
}

export function useSyncStatus(): SyncStatus {
  const [value, setValue] = useState<SyncStatus>(status);
  useEffect(() => {
    listeners.add(setValue);
    setValue(status);
    return () => { listeners.delete(setValue); };
  }, []);
  return value;
}

export function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline);
  useEffect(() => {
    const update = () => setOnline(isOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/* ------------------------------- outbox ---------------------------------- */

type OutboxEntry = {
  /** table + row + column scope, so repeated edits collapse to the newest value */
  id: string;
  table: "service_items" | "services";
  rowId: string;
  patch: Record<string, unknown>;
  updatedAt: number;
};

async function readOutbox(): Promise<OutboxEntry[]> {
  return (await get<OutboxEntry[]>(OUTBOX_KEY, store)) ?? [];
}

async function writeOutbox(entries: OutboxEntry[]) {
  if (entries.length === 0) await del(OUTBOX_KEY, store);
  else await set(OUTBOX_KEY, entries, store);
  setStatus(entries.length > 0 ? (isOnline() ? "pending" : "offline") : isOnline() ? "synced" : "offline");
}

export async function queueOfflineWrite(entry: Omit<OutboxEntry, "updatedAt">) {
  const entries = await readOutbox();
  const rest = entries.filter((existing) => existing.id !== entry.id);
  rest.push({ ...entry, updatedAt: Date.now() });
  await writeOutbox(rest);
}

export async function flushOutbox(queryClient?: QueryClient) {
  if (!isOnline()) { setStatus("offline"); return; }
  const entries = await readOutbox();
  if (entries.length === 0) { setStatus("synced"); return; }

  setStatus("syncing");
  const { supabase } = await import("@/integrations/supabase/client");
  const remaining: OutboxEntry[] = [];

  for (const entry of entries.sort((a, b) => a.updatedAt - b.updatedAt)) {
    const { error } = await supabase.from(entry.table).update(entry.patch as never).eq("id", entry.rowId);
    if (error) remaining.push(entry);
  }

  await writeOutbox(remaining);
  if (queryClient) await queryClient.invalidateQueries();
}

export async function pendingWriteCount() {
  return (await readOutbox()).length;
}

/* --------------------------- cache persistence --------------------------- */

export function setupOfflinePersistence(queryClient: QueryClient) {
  if (typeof window === "undefined") return;

  let restored = false;

  const persist = () => {
    if (!restored) return;
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && PERSISTED_ROOTS.includes(String(query.queryKey?.[0] ?? "")),
    });
    void set(CACHE_KEY, { savedAt: Date.now(), state: JSON.stringify(state) }, store);
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedulePersist = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(persist, 800);
  };

  void (async () => {
    try {
      const saved = await get<{ savedAt: number; state: string }>(CACHE_KEY, store);
      if (saved && Date.now() - saved.savedAt < CACHE_MAX_AGE) {
        hydrate(queryClient, JSON.parse(saved.state));
      } else if (saved) {
        await del(CACHE_KEY, store);
      }
    } catch {
      await del(CACHE_KEY, store).catch(() => undefined);
    }
    restored = true;
    queryClient.getQueryCache().subscribe(schedulePersist);

    setStatus(isOnline() ? ((await pendingWriteCount()) > 0 ? "pending" : "synced") : "offline");
    void flushOutbox(queryClient);
  })();

  window.addEventListener("online", () => void flushOutbox(queryClient));
  window.addEventListener("offline", () => setStatus("offline"));
  window.addEventListener("pagehide", persist);
}


/** Marks a setlist as intentionally kept on this device (for the “Available offline” pill). */
export async function markSetlistSavedOffline(setlistId: string) {
  const saved = (await get<string[]>("saved-setlists", store)) ?? [];
  if (!saved.includes(setlistId)) await set("saved-setlists", [...saved, setlistId], store);
}

export async function getSavedOfflineSetlists(): Promise<string[]> {
  return (await get<string[]>("saved-setlists", store)) ?? [];
}

/* --------------------------- chord sheet cache --------------------------- */

/** Everything the reader needs to render a chart with no network at all. */
export type CachedChart = {
  id: string;
  title?: string;
  artist?: string;
  defaultKey?: string;
  bpm?: number;
  timeSignature?: string;
  lyrics?: string;
  chords?: string;
  artworkUrl?: string;
  cachedAt: number;
};

const chartKey = (songId: string) => `chart-${songId}`;

/** Stores the full chord/lyric body of a song so the chart opens offline. */
export async function cacheSongChart(song: any): Promise<void> {
  if (!song?.id) return;
  const entry: CachedChart = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    defaultKey: song.defaultKey ?? song.default_key,
    bpm: song.bpm,
    timeSignature: song.timeSignature ?? song.time_signature,
    lyrics: song.lyrics ?? "",
    chords: song.chords ?? "",
    artworkUrl: song.artworkUrl ?? song.artwork_url,
    cachedAt: Date.now(),
  };
  await set(chartKey(entry.id), entry, store);
}

export async function getCachedSongChart(songId: string): Promise<CachedChart | undefined> {
  return await get<CachedChart>(chartKey(songId), store);
}

/** Removes a normal cached chart after deletion. Intentionally saved setlist
 * charts remain available through their persisted setlist/query snapshot. */
export async function removeCachedSongChart(songId: string): Promise<void> {
  await del(chartKey(songId), store);
}

/** Warms the service-worker asset cache for a song's artwork/audio (best effort). */
async function warmSongAssets(song: any) {
  if (typeof caches === "undefined") return;
  const urls = [song?.artworkUrl ?? song?.artwork_url, song?.audioUrl ?? song?.audio_url].filter(
    (url): url is string => typeof url === "string" && url.startsWith("http"),
  );
  if (urls.length === 0) return;
  try {
    const cache = await caches.open("cbcp-assets");
    await Promise.allSettled(urls.map((url) => cache.add(new Request(url, { mode: "no-cors" }))));
  } catch {
    /* asset warm-up is optional */
  }
}

/** Caches charts (and assets) for a list of songs — used by neighbour prefetch and Save offline. */
export async function cacheSongsOffline(songs: any[]): Promise<void> {
  await Promise.allSettled(
    songs.filter(Boolean).map(async (song) => {
      await cacheSongChart(song);
      await warmSongAssets(song);
    }),
  );
}
