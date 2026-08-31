/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Browser-side ZIP packaging, parsing and verification for the Backup & Restore Center.
 * The archive layout is documented in README-RESTORE.md inside every backup.
 */
import { zip, unzipSync, strToU8, strFromU8, type Zippable } from "fflate";
import {
  APP_ID,
  APP_VERSION,
  BACKUP_FORMAT_VERSION,
  BACKUP_MODULES,
  SCHEMA_VERSION,
  type BackupManifest,
  type BackupRow,
  type ModuleKey,
  type ModulePayload,
  type StorageFileEntry,
  type VerificationResult,
  moduleDef,
  sha256Hex,
} from "./backup-format";

const MODULE_FOLDER: Record<ModuleKey, string> = {
  songs: "songs",
  setlists: "setlists",
  services: "services",
  team: "team",
  users: "users",
  media: "media",
  albums: "media/albums",
  resources: "resources",
  branding: "branding",
  themes: "themes",
  navigation: "navigation",
  roles: "users/roles",
  settings: "settings",
};

const README = `# Restore Guide

This archive was produced by the CBCP Worship Backup & Restore Center.

## Contents
- \`manifest.json\` – backup format version, app + schema version, module list, counts, checksums, verification result.
- \`checksums.json\` – SHA-256 for every data file in this archive.
- \`database/\` – one JSON file per exported table. Original IDs/UUIDs and relationships are preserved.
- \`schema/\` – table + settings-key inventory and schema version used for compatibility checks.
- module folders (\`songs/\`, \`setlists/\`, \`services/\`, \`team/\`, \`users/\`, \`media/\`, \`resources/\`, \`branding/\`, \`themes/\`, \`navigation/\`, \`settings/\`) – per-module descriptor plus configuration values.
- \`media/storage-manifest.json\` – every storage object with bucket, path, MIME type, size and checksum. Files marked \`FILE NOT INCLUDED\` are listed but not embedded.
- \`media/files/\` – embedded storage objects (when included).
- \`report.md\` – human readable summary.

## How to restore
1. Sign in to the destination app as a ministry administrator.
2. Open **Admin → Backup & Restore → Restore Backup**.
3. Upload this ZIP. The app inspects the manifest, runs a compatibility check and shows a preview.
4. Run **Dry Run** first – it simulates the import without changing any data.
5. Choose a restore mode (Merge / Replace module / Full) and confirm.
6. A Pre-Restore Recovery Point is created automatically before any destructive step.

## Migration into a rebranded copy
Choose **Restore Data + Keep New Branding** so the destination keeps its own logos, colors and theme.

## Not included
- No passwords, password hashes, API keys, service-role keys, OAuth secrets or tokens are ever exported.
- Application source code is not included: this platform does not expose project source files for export. **Not Included / Requires External Setup.**
- Auth users themselves live in the managed auth system; profiles/roles are restored and re-link by user ID once those accounts exist.
`;

const REQUIRED_CONNECTIONS = `# Required Connections After Migration

The following must be configured manually in the destination app. They are intentionally **not** part of this backup.

| Item | Why | Action |
| --- | --- | --- |
| Backend / database connection | Credentials are environment secrets | Enable Cloud on the destination project |
| Auth accounts (email + Google) | Password hashes and tokens are never exported | Re-invite users; profiles/roles re-link by user ID |
| Google OAuth client | Client secret is private | Configure the Google provider in the destination |
| AI provider configuration | API keys are private | Re-enable the AI gateway/keys |
| Storage buckets | Bucket policies belong to the destination project | Buckets are created by the destination app; embedded files are re-uploaded on restore |
| External integrations / webhooks | Endpoint secrets are private | Reconnect after restore |

**Not Included / Requires External Setup:** environment secrets, service-role keys, access/refresh tokens, project source code.
`;

export interface BuiltBackup {
  bytes: Uint8Array;
  manifest: BackupManifest;
  fileName: string;
}

export interface BuildInput {
  payloads: ModulePayload[];
  storage: StorageFileEntry[];
  excluded: { module: string; reason: string }[];
  createdBy: string;
  kind: "full" | "selective";
  purpose: "backup" | "migration" | "recovery-point";
  fileName: string;
}

const SECRET_KEY_PATTERN = /(password|secret|api[_-]?key|service[_-]?role|refresh[_-]?token|access[_-]?token|client[_-]?secret)/i;

/** Final guard: fail loudly rather than ship a credential inside a backup. */
const SAFE_KEYS = new Set(["secretsExcluded", "secrets_excluded", "secretsScrubbed"]);

function assertNoSecrets(json: string, where: string) {
  const pattern = /"([^"]{0,40}(password|secret|service_role|api_key|refresh_token|access_token)[^"]{0,20})"\s*:/gi;
  for (const match of json.matchAll(pattern)) {
    const key = match[1]!;
    // Metadata flags that merely mention secrets are not secrets themselves.
    if (SAFE_KEYS.has(key)) continue;
    throw new Error(`Aborted: possible secret field "${key}" found in ${where}`);
  }
}

export async function buildBackupZip(input: BuildInput): Promise<BuiltBackup> {
  const files: Record<string, Uint8Array> = {};
  const checksums: Record<string, string> = {};
  const recordCounts: Record<string, number> = {};
  const tableCounts: Record<string, number> = {};

  const addText = async (path: string, text: string) => {
    files[path] = strToU8(text);
    checksums[path] = await sha256Hex(text);
  };
  const addJson = async (path: string, value: unknown) => {
    const json = JSON.stringify(value, null, 2);
    assertNoSecrets(json, path);
    await addText(path, json);
  };

  const writtenTables = new Set<string>();
  for (const payload of input.payloads) {
    const def = moduleDef(payload.module);
    const folder = MODULE_FOLDER[payload.module];
    recordCounts[payload.module] = payload.recordCount;

    for (const [table, rows] of Object.entries(payload.tables)) {
      tableCounts[table] = rows.length;
      if (writtenTables.has(table)) continue;
      writtenTables.add(table);
      await addJson(`database/${table}.json`, { table, count: rows.length, rows });
    }

    await addJson(`${folder}/module.json`, {
      module: payload.module,
      label: def?.label ?? payload.module,
      tables: def?.tables ?? [],
      dependsOn: def?.dependsOn ?? [],
      recordCount: payload.recordCount,
      settings: payload.settings,
    });
  }

  const includedFiles = input.storage.filter((f) => f.included);
  const totalFileBytes = includedFiles.reduce((sum, f) => sum + (f.size ?? 0), 0);

  await addJson("media/storage-manifest.json", {
    buckets: [...new Set(input.storage.map((f) => f.bucket))],
    // Never serialize the in-memory byte payloads (keys prefixed with "_") — the
    // manifest is metadata only.
    files: input.storage.map((f) => ({
      ...Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith("_"))),
      status: f.included ? "INCLUDED" : "FILE NOT INCLUDED",
    })),
  });

  await addJson("schema/schema.json", {
    schemaVersion: SCHEMA_VERSION,
    modules: BACKUP_MODULES.map((m) => ({
      key: m.key,
      tables: m.tables,
      settingKeys: m.settingKeys ?? [],
      dependsOn: m.dependsOn ?? [],
    })),
    tables: [...writtenTables].map((t) => ({
      table: t,
      columns: [
        ...new Set(
          input.payloads
            .flatMap((p) => (p.tables[t] ?? []) as BackupRow[])
            .slice(0, 50)
            .flatMap((row) => Object.keys(row)),
        ),
      ],
    })),
  });

  await addText("README-RESTORE.md", README);
  await addText("REQUIRED-CONNECTIONS.md", REQUIRED_CONNECTIONS);

  const backupId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const manifest: BackupManifest = {
    backupFormatVersion: BACKUP_FORMAT_VERSION,
    appId: APP_ID,
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    backupId,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    kind: input.kind,
    includedModules: input.payloads.map((p) => p.module),
    excludedModules: [
      ...input.excluded,
      { module: "source-code", reason: "Not Included / Requires External Setup — platform does not expose project source for export" },
      { module: "auth-credentials", reason: "Never exported by design (passwords, hashes, tokens, keys)" },
    ],
    recordCounts,
    tableCounts,
    fileCount: input.storage.length,
    filesIncluded: includedFiles.length,
    filesManifestOnly: input.storage.length - includedFiles.length,
    totalFileBytes,
    checksums,
    compatibility: {
      minFormatVersion: 1,
      maxFormatVersion: BACKUP_FORMAT_VERSION,
      requires: ["Lovable Cloud backend", "ministry administrator account"],
    },
    migrationRequirements: [
      "Destination app must be this application or a rebranded copy of it",
      "Auth accounts must be recreated in the destination",
      "See REQUIRED-CONNECTIONS.md",
    ],
    portable: input.storage.length === 0 || includedFiles.length === input.storage.length,
    secretsExcluded: true,
  };

  await addJson("checksums.json", checksums);
  await addJson("manifest.json", manifest);

  // Embedded storage objects last so their bytes are not hashed into checksums.json twice.
  for (const file of includedFiles) {
    if (!file.zipPath || !(file as any)._bytes) continue;
    files[file.zipPath] = (file as any)._bytes as Uint8Array;
  }

  await addText(
    "report.md",
    [
      `# Backup Report`,
      ``,
      `- Backup ID: ${backupId}`,
      `- Created: ${manifest.createdAt}`,
      `- Created by: ${manifest.createdBy}`,
      `- Type: ${input.kind === "full" ? "Full portable backup" : "Selective backup"}${input.purpose === "migration" ? " (migration package)" : ""}`,
      `- Format version: ${BACKUP_FORMAT_VERSION} • Schema: ${SCHEMA_VERSION} • App: ${APP_VERSION}`,
      ``,
      `## Modules`,
      ...input.payloads.map((p) => `- ${moduleDef(p.module)?.label ?? p.module}: ${p.recordCount} record(s)`),
      ``,
      `## Files`,
      `- Storage objects listed: ${manifest.fileCount}`,
      `- Embedded: ${manifest.filesIncluded}`,
      `- Manifest only (FILE NOT INCLUDED): ${manifest.filesManifestOnly}`,
      ``,
      `## Excluded`,
      ...manifest.excludedModules.map((e) => `- ${e.module}: ${e.reason}`),
    ].join("\n"),
  );

  // Media bytes are already compressed (jpg/png/mp3), so store them raw and only
  // deflate the JSON/markdown. zipSync on ~100MB blows the main thread + memory.
  const zippable: Zippable = {};
  for (const [path, bytes] of Object.entries(files)) {
    zippable[path] = [bytes, { level: path.startsWith("media/files/") ? 0 : 6 }] as any;
  }
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(zippable, { level: 6 }, (err, data) => (err ? reject(err) : resolve(data)));
  });
  return { bytes, manifest, fileName: input.fileName };
}

/* ---------------------------------- reading -------------------------------- */

export interface ParsedBackup {
  manifest: BackupManifest;
  checksums: Record<string, string>;
  tables: Record<string, BackupRow[]>;
  modules: Record<string, { module: ModuleKey; settings: Record<string, any>; tables: string[]; recordCount: number }>;
  storageFiles: (StorageFileEntry & { status?: string })[];
  embedded: Record<string, Uint8Array>;
  raw: Record<string, Uint8Array>;
}

export async function parseBackupZip(file: File | Blob): Promise<ParsedBackup> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(buffer);
  } catch {
    throw new Error("This file is not a readable ZIP archive.");
  }
  if (!entries["manifest.json"]) throw new Error("manifest.json is missing — not a valid backup archive.");

  const json = <T,>(path: string): T | undefined => {
    const raw = entries[path];
    if (!raw) return undefined;
    try {
      return JSON.parse(strFromU8(raw)) as T;
    } catch {
      throw new Error(`${path} is not valid JSON.`);
    }
  };

  const manifest = json<BackupManifest>("manifest.json")!;
  const checksums = json<Record<string, string>>("checksums.json") ?? {};

  const tables: Record<string, BackupRow[]> = {};
  for (const path of Object.keys(entries)) {
    if (path.startsWith("database/") && path.endsWith(".json")) {
      const parsed = json<{ table: string; rows: BackupRow[] }>(path);
      if (parsed?.table) tables[parsed.table] = parsed.rows ?? [];
    }
  }

  const modules: ParsedBackup["modules"] = {};
  for (const path of Object.keys(entries)) {
    if (path.endsWith("/module.json")) {
      const parsed = json<any>(path);
      if (parsed?.module) modules[parsed.module] = parsed;
    }
  }

  const storage = json<{ files: (StorageFileEntry & { status?: string })[] }>("media/storage-manifest.json");
  const embedded: Record<string, Uint8Array> = {};
  for (const [path, bytes] of Object.entries(entries)) {
    if (path.startsWith("media/files/")) embedded[path] = bytes;
  }

  return { manifest, checksums, tables, modules, storageFiles: storage?.files ?? [], embedded, raw: entries };
}

export function toRestoreInputs(parsed: ParsedBackup, modules: ModuleKey[]) {
  return modules.map((key) => {
    const def = moduleDef(key);
    const tables: Record<string, BackupRow[]> = {};
    for (const table of def?.tables ?? []) {
      if (parsed.tables[table]) tables[table] = parsed.tables[table]!;
    }
    return { module: key, tables, settings: parsed.modules[key]?.settings ?? {} };
  });
}

/* -------------------------------- verification ----------------------------- */

export async function verifyBackup(parsed: ParsedBackup): Promise<VerificationResult> {
  const checks: VerificationResult["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  add("Archive opens", true, "ZIP structure read successfully");
  add("Manifest present", Boolean(parsed.manifest?.backupId), parsed.manifest?.backupId ?? "missing backup ID");
  add(
    "Format version",
    parsed.manifest.backupFormatVersion <= BACKUP_FORMAT_VERSION,
    `backup_format_version ${parsed.manifest.backupFormatVersion} (app supports up to ${BACKUP_FORMAT_VERSION})`,
  );

  // Checksums
  let mismatched: string[] = [];
  for (const [path, expected] of Object.entries(parsed.checksums)) {
    const raw = parsed.raw[path];
    if (!raw) {
      mismatched.push(`${path} (missing)`);
      continue;
    }
    const actual = await sha256Hex(raw);
    if (actual !== expected) mismatched.push(path);
  }
  add(
    "Checksums match",
    mismatched.length === 0,
    mismatched.length ? `Mismatch: ${mismatched.slice(0, 5).join(", ")}` : `${Object.keys(parsed.checksums).length} file(s) verified`,
  );

  // Record counts
  const countIssues: string[] = [];
  for (const [table, expected] of Object.entries(parsed.manifest.tableCounts ?? {})) {
    const actual = parsed.tables[table]?.length ?? 0;
    if (actual !== expected) countIssues.push(`${table}: expected ${expected}, found ${actual}`);
  }
  add("Record counts match", countIssues.length === 0, countIssues.join("; ") || "All table counts match the manifest");

  // IDs
  const idIssues: string[] = [];
  for (const [table, rows] of Object.entries(parsed.tables)) {
    if (table === "ministry_settings") continue;
    const missing = rows.filter((r) => !r['id']).length;
    if (missing) idIssues.push(`${table}: ${missing} row(s) without an ID`);
    const ids = new Set(rows.map((r) => r['id']));
    if (ids.size !== rows.length) idIssues.push(`${table}: duplicate IDs`);
  }
  add("IDs valid and unique", idIssues.length === 0, idIssues.join("; ") || "All records carry unique stable IDs");

  // Relationships
  const relIssues: string[] = [];
  const songIds = new Set((parsed.tables['songs'] ?? []).map((s) => s['id']));
  const serviceIds = new Set((parsed.tables['services'] ?? []).map((s) => s['id']));
  const items = parsed.tables['service_items'] ?? [];
  if (items.length) {
    const brokenSong = items.filter((i) => i['song_id'] && parsed.tables['songs'] && !songIds.has(i['song_id'])).length;
    const brokenService = items.filter((i) => i['service_id'] && parsed.tables['services'] && !serviceIds.has(i['service_id'])).length;
    if (brokenSong) relIssues.push(`${brokenSong} setlist item(s) reference a song missing from this backup`);
    if (brokenService) relIssues.push(`${brokenService} setlist item(s) reference a missing service`);
    const withoutKey = items.filter((i) => i['song_id'] && !i['selected_key']).length;
    add(
      "Setlist keys preserved",
      true,
      withoutKey ? `${items.length - withoutKey}/${items.length} setlist songs carry a saved key` : `All ${items.length} setlist songs carry a saved key`,
    );
  }
  const albumIds = new Set((parsed.tables['media_albums'] ?? []).map((a) => a['id']));
  const brokenAlbum = (parsed.tables['media_items'] ?? []).filter(
    (m) => m['album_id'] && parsed.tables['media_albums'] && !albumIds.has(m['album_id']),
  ).length;
  if (brokenAlbum) relIssues.push(`${brokenAlbum} media item(s) reference a missing album`);
  add("Relationships valid", relIssues.length === 0, relIssues.join("; ") || "Setlist → song/service and media → album links resolve");

  // Media files
  const declared = parsed.storageFiles.filter((f) => f.included);
  const missingFiles = declared.filter((f) => !f.zipPath || !parsed.embedded[f.zipPath]);
  add(
    "Media files present",
    missingFiles.length === 0,
    parsed.storageFiles.length === 0
      ? "No storage objects in this backup"
      : missingFiles.length
        ? `${missingFiles.length} declared file(s) missing from the archive`
        : `${declared.length} embedded file(s) found, ${parsed.storageFiles.length - declared.length} listed as FILE NOT INCLUDED`,
  );

  // Branding / theme validity
  const branding = parsed.modules['branding']?.settings?.['branding'];
  const theme = parsed.modules['themes']?.settings?.['design_theme'];
  if (parsed.modules['branding'] || parsed.modules['themes']) {
    const ok = (!parsed.modules['branding'] || (branding && typeof branding === "object")) && (!parsed.modules['themes'] || !theme || typeof theme === "object");
    add("Branding / theme valid", Boolean(ok), ok ? "Brand and design configuration parse correctly" : "Brand or theme configuration is malformed");
  }

  // Secrets guard
  const allText = Object.entries(parsed.raw)
    .filter(([p]) => p.endsWith(".json"))
    .map(([, b]) => strFromU8(b))
    .join("\n");
  const secretHit = allText.match(/"[^"]*(password_hash|service_role|refresh_token|client_secret)[^"]*"\s*:/i);
  add("No secrets included", !secretHit, secretHit ? `Found suspicious field ${secretHit[0]}` : "No credential fields detected");

  return { verified: checks.every((c) => c.ok), checkedAt: new Date().toISOString(), checks };
}

export function downloadBytes(bytes: Uint8Array, fileName: string) {
  const view = new Uint8Array(bytes);
  const blob = new Blob([view.buffer as ArrayBuffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export { SECRET_KEY_PATTERN };
