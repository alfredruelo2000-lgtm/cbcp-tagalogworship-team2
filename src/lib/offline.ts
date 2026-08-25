/**
 * Offline layer for Songs + Setlists.
 *
 * - React Query cache is persisted to IndexedDB, so song charts, setlists,
 *   per-setlist keys and notes survive refresh, restart and offline launches.
 * - Writes made while offline go into a small IndexedDB outbox and are replayed
 *   (newest change per record wins) as soon as the connection returns.
 */
import { useEffect, useState } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createStore, get, set, del } from "idb-keyval";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const store = createStore("cbcp-offline", "kv");
const CACHE_KEY = "react-query-cache";
const OUTBOX_KEY = "outbox";

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

  const persister = createAsyncStoragePersister({
    key: CACHE_KEY,
    throttleTime: 800,
    storage: {
      getItem: (key) => get<string>(key, store).then((value) => value ?? null),
      setItem: (key, value) => set(key, value, store),
      removeItem: (key) => del(key, store),
    },
  });

  void persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 60, // keep downloaded charts for 60 days
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const root = String(query.queryKey?.[0] ?? "");
        return ["songs-public", "setlists", "setlist", "setlist-permissions", "services"].includes(root);
      },
    },
  });

  const sync = () => void flushOutbox(queryClient);
  window.addEventListener("online", sync);
  window.addEventListener("offline", () => setStatus("offline"));
  void (async () => {
    setStatus(isOnline() ? ((await pendingWriteCount()) > 0 ? "pending" : "synced") : "offline");
    sync();
  })();
}

/** Marks a setlist as intentionally kept on this device (for the “Available offline” pill). */
export async function markSetlistSavedOffline(setlistId: string) {
  const saved = (await get<string[]>("saved-setlists", store)) ?? [];
  if (!saved.includes(setlistId)) await set("saved-setlists", [...saved, setlistId], store);
}

export async function getSavedOfflineSetlists(): Promise<string[]> {
  return (await get<string[]>("saved-setlists", store)) ?? [];
}
