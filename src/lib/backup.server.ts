/**
 * Server-only backup/restore engine.
 * Backup reads are strictly READ-ONLY: no production record is touched to create a backup.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BACKUP_HISTORY_KEY,
  BACKUP_MODULES,
  CLAIMED_SETTING_KEYS,
  type BackupHistoryEntry,
  type ModuleKey,
  type ModulePayload,
  type BackupRow,
  type StorageFileEntry,
  moduleDef,
} from "./backup-format";

type AnySupabase = { from: (t: string) => any };

const ADMIN_ROLES = ["super_admin", "ministry_admin"];

/** Verifies the caller is an authorized admin using their own (RLS-scoped) client. */
export async function assertBackupAdmin(supabase: AnySupabase, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(`Unable to verify permissions: ${error.message}`);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.some((r: string) => ADMIN_ROLES.includes(r))) {
    throw new Error("Forbidden: Backup & Restore is restricted to ministry administrators.");
  }
  return roles;
}

const SECRET_COLUMN_PATTERN =
  /(password|passwd|hash|secret|token|api[_-]?key|service[_-]?role|credential|private[_-]?key)/i;

/** Defensive scrub: never let a credential-shaped column reach an export. */
function scrubRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (SECRET_COLUMN_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out;
}

async function selectAll(table: string): Promise<Record<string, unknown>[]> {
  const pageSize = 500;
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from(table as never)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Failed reading ${table}: ${error.message}`);
    const page = (data ?? []) as Record<string, unknown>[];
    rows.push(...page.map(scrubRow));
    if (page.length < pageSize) break;
  }
  return rows;
}

async function readSettings(): Promise<{ key: string; value: unknown }[]> {
  const { data, error } = await supabaseAdmin.from("ministry_settings").select("key, value");
  if (error) throw new Error(`Failed reading settings: ${error.message}`);
  return (data ?? []) as { key: string; value: unknown }[];
}

export async function exportModules(modules: ModuleKey[]): Promise<{
  payloads: ModulePayload[];
  excluded: { module: string; reason: string }[];
}> {
  const settings = await readSettings();
  const tableCache = new Map<string, Record<string, unknown>[]>();
  const payloads: ModulePayload[] = [];
  const excluded: { module: string; reason: string }[] = [];

  for (const key of modules) {
    const def = moduleDef(key);
    if (!def) {
      excluded.push({ module: key, reason: "Unknown module in this app version" });
      continue;
    }
  const tables: Record<string, BackupRow[]> = {};
    let count = 0;
    for (const table of def.tables) {
      if (!tableCache.has(table)) tableCache.set(table, await selectAll(table));
      const rows = tableCache.get(table)!;
      tables[table] = rows;
      count += rows.length;
    }
    const moduleSettings: Record<string, any> = {};
    for (const skey of def.settingKeys ?? []) {
      if (skey === "*") {
        for (const row of settings) {
          if (row.key === BACKUP_HISTORY_KEY) continue;
          if (CLAIMED_SETTING_KEYS.includes(row.key)) continue;
          moduleSettings[row.key] = row.value;
          count += 1;
        }
      } else {
        const found = settings.find((s) => s.key === skey);
        if (found) {
          moduleSettings[skey] = found.value;
          count += 1;
        }
      }
    }
    payloads.push({ module: key, tables, settings: moduleSettings, recordCount: count });
  }

  return { payloads, excluded };
}

/** Storage manifest for the requested modules (bucket/path/size/mime/checksum-less listing). */
export async function exportStorageManifest(modules: ModuleKey[]): Promise<StorageFileEntry[]> {
  const buckets = new Set<string>();
  for (const key of modules) {
    for (const b of moduleDef(key)?.buckets ?? []) buckets.add(b);
  }
  const entries: StorageFileEntry[] = [];

  for (const bucket of buckets) {
    const walk = async (prefix: string, depth: number): Promise<void> => {
      if (depth > 4) return;
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
      if (error) return;
      for (const item of data ?? []) {
        const path = prefix ? `${prefix}/${item.name}` : item.name;
        const isFile = Boolean((item as { id?: string | null }).id);
        if (!isFile) {
          await walk(path, depth + 1);
          continue;
        }
        const meta = (item as { metadata?: { size?: number; mimetype?: string } }).metadata ?? {};
        entries.push({
          bucket,
          path,
          name: item.name,
          ...(meta.mimetype ? { mimeType: meta.mimetype } : {}),
          ...(typeof meta.size === "number" ? { size: meta.size } : {}),
          included: false,
          zipPath: `media/files/${bucket}/${path}`,
        });
      }
    };
    await walk("", 0);
  }

  return entries;
}

const MAX_BATCH_BYTES = 12 * 1024 * 1024;

/** Downloads a batch of storage objects as base64. Read-only. */
export async function fetchStorageBatch(
  files: { bucket: string; path: string }[],
): Promise<{ bucket: string; path: string; base64?: string; error?: string; size?: number }[]> {
  const out: { bucket: string; path: string; base64?: string; error?: string; size?: number }[] = [];
  let budget = MAX_BATCH_BYTES;
  for (const file of files) {
    if (budget <= 0) {
      out.push({ bucket: file.bucket, path: file.path, error: "Batch size limit reached" });
      continue;
    }
    const { data, error } = await supabaseAdmin.storage.from(file.bucket).download(file.path);
    if (error || !data) {
      out.push({ bucket: file.bucket, path: file.path, error: error?.message ?? "Download failed" });
      continue;
    }
    const buf = new Uint8Array(await data.arrayBuffer());
    budget -= buf.byteLength;
    let binary = "";
    for (let i = 0; i < buf.length; i += 0x8000) {
      binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    }
    out.push({ bucket: file.bucket, path: file.path, base64: btoa(binary), size: buf.byteLength });
  }
  return out;
}

/* ---------------------------------- health --------------------------------- */

export async function backupHealthCheck() {
  const issues: { severity: "warning" | "error"; message: string }[] = [];

  const [songs, items, services, media, albums, profiles, roles, settings] = await Promise.all([
    selectAll("songs"),
    selectAll("service_items"),
    selectAll("services"),
    selectAll("media_items"),
    selectAll("media_albums"),
    selectAll("profiles"),
    selectAll("user_roles"),
    readSettings(),
  ]);

  const songIds = new Set(songs.map((s) => s['id'] as string));
  const serviceIds = new Set(services.map((s) => s['id'] as string));
  const albumIds = new Set(albums.map((a) => a['id'] as string));

  const orphanItems = items.filter((i) => !serviceIds.has(i['service_id'] as string));
  if (orphanItems.length) {
    issues.push({ severity: "error", message: `${orphanItems.length} setlist item(s) reference a missing service.` });
  }
  const missingSongRefs = items.filter((i) => i['song_id'] && !songIds.has(i['song_id'] as string));
  if (missingSongRefs.length) {
    issues.push({ severity: "error", message: `${missingSongRefs.length} setlist item(s) reference a missing song.` });
  }
  const missingKeys = items.filter((i) => i['song_id'] && !i['selected_key']);
  if (missingKeys.length) {
    issues.push({ severity: "warning", message: `${missingKeys.length} setlist song(s) have no saved key (default key will be used).` });
  }
  const orphanMedia = media.filter((m) => m['album_id'] && !albumIds.has(m['album_id'] as string));
  if (orphanMedia.length) {
    issues.push({ severity: "warning", message: `${orphanMedia.length} media item(s) point to a missing album.` });
  }
  const brokenMedia = media.filter((m) => !m['file_url']);
  if (brokenMedia.length) {
    issues.push({ severity: "error", message: `${brokenMedia.length} media item(s) have no file reference.` });
  }
  const noId = [...songs, ...items, ...media, ...profiles].filter((r) => !r['id']);
  if (noId.length) issues.push({ severity: "error", message: `${noId.length} record(s) are missing an ID.` });

  const dupRoles = new Map<string, number>();
  for (const r of roles) {
    const k = `${r['user_id']}:${r['role']}`;
    dupRoles.set(k, (dupRoles.get(k) ?? 0) + 1);
  }
  const dupCount = [...dupRoles.values()].filter((n) => n > 1).length;
  if (dupCount) issues.push({ severity: "warning", message: `${dupCount} duplicate role assignment(s).` });

  const branding = settings.find((s) => s.key === "branding");
  if (!branding) issues.push({ severity: "warning", message: "No published branding configuration found." });

  let storageOk = true;
  const buckets = ["personnel-avatars", "song-resources"];
  for (const bucket of buckets) {
    const { error } = await supabaseAdmin.storage.from(bucket).list("", { limit: 1 });
    if (error) {
      storageOk = false;
      issues.push({ severity: "error", message: `Storage bucket "${bucket}" is unreachable: ${error.message}` });
    }
  }

  return {
    ready: !issues.some((i) => i.severity === "error"),
    storageOk,
    issues,
    counts: {
      songs: songs.length,
      services: services.length,
      setlistItems: items.length,
      media: media.length,
      albums: albums.length,
      profiles: profiles.length,
      roles: roles.length,
      settings: settings.length,
    },
  };
}

/* --------------------------------- history --------------------------------- */

export async function readHistory(): Promise<BackupHistoryEntry[]> {
  const { data } = await supabaseAdmin
    .from("ministry_settings")
    .select("value")
    .eq("key", BACKUP_HISTORY_KEY)
    .maybeSingle();
  const value = (data as { value?: unknown } | null)?.value;
  return Array.isArray(value) ? (value as BackupHistoryEntry[]) : [];
}

export async function writeHistory(entries: BackupHistoryEntry[], userId: string) {
  const trimmed = entries.slice(0, 60);
  const { error } = await supabaseAdmin.from("ministry_settings").upsert(
    {
      key: BACKUP_HISTORY_KEY,
      value: trimmed as never,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    } as never,
    { onConflict: "key" },
  );
  if (error) throw new Error(`Could not save backup history: ${error.message}`);
  return trimmed;
}

/* --------------------------------- restore --------------------------------- */

export type RestoreMode = "merge" | "replace";
export type ConflictStrategy = "keep-existing" | "use-backup" | "skip";

export interface RestoreModuleInput {
  module: ModuleKey;
  tables: Record<string, BackupRow[]>;
  settings: Record<string, any>;
}

export interface RestoreStepResult {
  module: ModuleKey;
  table: string;
  inserted: number;
  updated: number;
  skipped: number;
  deleted: number;
  notes: string[];
}

/** Snapshot of everything the restore is about to touch — the pre-restore recovery point. */
export async function buildRecoveryPoint(modules: ModuleKey[]) {
  const { payloads } = await exportModules(modules);
  return payloads;
}

async function existingIds(table: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin.from(table as never).select("id");
  if (error) return new Set();
  return new Set(((data ?? []) as { id: string }[]).map((r) => r.id));
}

export async function analyzeRestore(inputs: RestoreModuleInput[]) {
  const report: {
    module: ModuleKey;
    table: string;
    incoming: number;
    wouldAdd: number;
    wouldReplace: number;
    conflicts: string[];
    missingReferences: string[];
  }[] = [];

  const songIds = await existingIds("songs");
  const serviceIds = await existingIds("services");

  for (const input of inputs) {
    for (const [table, rows] of Object.entries(input.tables)) {
      const ids = await existingIds(table);
      const list = rows as Record<string, unknown>[];
      const wouldReplace = list.filter((r) => ids.has(r['id'] as string)).length;
      const conflicts: string[] = [];
      const missing: string[] = [];

      if (table === "profiles") {
        const { data } = await supabaseAdmin.from("profiles").select("id, email");
        const byEmail = new Map(((data ?? []) as { id: string; email: string }[]).map((p) => [p.email?.toLowerCase(), p.id]));
        for (const row of list) {
          const email = String(row['email'] ?? "").toLowerCase();
          const owner = byEmail.get(email);
          if (email && owner && owner !== row['id']) {
            conflicts.push(`Email ${email} already belongs to a different account.`);
          }
        }
      }
      if (table === "service_items") {
        for (const row of list) {
          const incomingSongs = new Set(
            (inputs.find((i) => i.module === "songs")?.tables['songs'] ?? []).map((s) => (s as { id: string }).id),
          );
          if (row['song_id'] && !songIds.has(row['song_id'] as string) && !incomingSongs.has(row['song_id'] as string)) {
            missing.push(`Setlist item "${row['title']}" references a song that is not present.`);
          }
          const incomingServices = new Set(
            (inputs.find((i) => i.module === "services")?.tables['services'] ?? []).map((s) => (s as { id: string }).id),
          );
          if (row['service_id'] && !serviceIds.has(row['service_id'] as string) && !incomingServices.has(row['service_id'] as string)) {
            missing.push(`Setlist item "${row['title']}" references a missing service.`);
          }
        }
      }

      report.push({
        module: input.module,
        table,
        incoming: list.length,
        wouldAdd: list.length - wouldReplace,
        wouldReplace,
        conflicts: [...new Set(conflicts)].slice(0, 20),
        missingReferences: [...new Set(missing)].slice(0, 20),
      });
    }
  }

  return report;
}

/** Restores modules. Rows are upserted by primary key, so stable IDs/UUIDs survive. */
export async function applyRestore(
  inputs: RestoreModuleInput[],
  mode: RestoreMode,
  conflict: ConflictStrategy,
  userId: string,
): Promise<RestoreStepResult[]> {
  const results: RestoreStepResult[] = [];

  // Dependency-safe ordering.
  const order = BACKUP_MODULES.map((m) => m.key);
  const sorted = [...inputs].sort((a, b) => order.indexOf(a.module) - order.indexOf(b.module));

  for (const input of sorted) {
    for (const table of moduleDef(input.module)?.tables ?? []) {
      const rows = (input.tables[table] ?? []) as Record<string, unknown>[];
      if (!rows.length) continue;
      const result: RestoreStepResult = {
        module: input.module,
        table,
        inserted: 0,
        updated: 0,
        skipped: 0,
        deleted: 0,
        notes: [],
      };
      const ids = await existingIds(table);

      let toWrite = rows.map(scrubRow);
      if (conflict === "keep-existing" || conflict === "skip") {
        const before = toWrite.length;
        toWrite = toWrite.filter((r) => !ids.has(r['id'] as string));
        result.skipped = before - toWrite.length;
      }

      if (mode === "replace") {
        const keep = new Set(rows.map((r) => r['id'] as string));
        const removable = [...ids].filter((id) => !keep.has(id));
        if (removable.length) {
          const { error } = await supabaseAdmin.from(table as never).delete().in("id", removable);
          if (error) {
            result.notes.push(`Could not remove ${removable.length} obsolete row(s): ${error.message}`);
          } else {
            result.deleted = removable.length;
          }
        }
      }

      // Chunked upsert keeps a partial network failure from taking the whole table down.
      for (let i = 0; i < toWrite.length; i += 100) {
        const chunk = toWrite.slice(i, i + 100);
        const { error } = await supabaseAdmin
          .from(table as never)
          .upsert(chunk as never, { onConflict: "id" });
        if (error) throw new Error(`Restore failed on ${table}: ${error.message}`);
        for (const row of chunk) {
          if (ids.has(row['id'] as string)) result.updated += 1;
          else result.inserted += 1;
        }
      }
      results.push(result);
    }

    const settingEntries = Object.entries(input.settings ?? {});
    if (settingEntries.length) {
      const result: RestoreStepResult = {
        module: input.module,
        table: "ministry_settings",
        inserted: 0,
        updated: 0,
        skipped: 0,
        deleted: 0,
        notes: [],
      };
      for (const [key, value] of settingEntries) {
        if (key === BACKUP_HISTORY_KEY) {
          result.skipped += 1;
          continue;
        }
        const { error } = await supabaseAdmin.from("ministry_settings").upsert(
          {
            key,
            value: value as never,
            updated_at: new Date().toISOString(),
            updated_by: userId,
          } as never,
          { onConflict: "key" },
        );
        if (error) throw new Error(`Restore failed on setting "${key}": ${error.message}`);
        result.updated += 1;
      }
      results.push(result);
    }
  }

  return results;
}

/** Restores embedded storage objects. Upsert semantics; never deletes destination files. */
export async function uploadStorageObjects(
  files: { bucket: string; path: string; base64: string; contentType?: string | undefined }[],
): Promise<{ path: string; ok: boolean; error?: string }[]> {
  const out: { path: string; ok: boolean; error?: string }[] = [];
  for (const file of files) {
    const binary = atob(file.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const { error } = await supabaseAdmin.storage.from(file.bucket).upload(file.path, bytes, {
      contentType: file.contentType || "application/octet-stream",
      upsert: true,
    });
    out.push(error ? { path: file.path, ok: false, error: error.message } : { path: file.path, ok: true });
  }
  return out;
}
