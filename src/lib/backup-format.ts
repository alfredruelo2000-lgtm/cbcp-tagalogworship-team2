/**
 * Shared (client-safe) backup format definitions.
 * Versioned so future app releases can inspect a backup before restoring it.
 */

export const BACKUP_FORMAT_VERSION = 1;
export const APP_VERSION = "1.0.0";
export const APP_ID = "cbcp-worship";
/** Bumped whenever the tables/columns this backup understands change. */
export const SCHEMA_VERSION = "2026-08-31";

export type ModuleKey =
  | "songs"
  | "setlists"
  | "services"
  | "team"
  | "users"
  | "media"
  | "albums"
  | "resources"
  | "branding"
  | "themes"
  | "navigation"
  | "roles"
  | "settings";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  hint: string;
  /** Postgres tables exported for this module, in dependency order. */
  tables: string[];
  /** ministry_settings keys exported for this module. */
  settingKeys?: string[];
  /** Modules that must exist (in the backup or the destination) for a clean restore. */
  dependsOn?: ModuleKey[];
  /** Storage buckets whose files belong to this module. */
  buckets?: string[];
  destructive?: boolean;
}

export const BACKUP_MODULES: ModuleDefinition[] = [
  {
    key: "songs",
    label: "Songs",
    hint: "Titles, lyrics, chords, original keys, metadata, version history",
    tables: ["songs", "song_versions"],
    buckets: ["song-resources"],
  },
  {
    key: "services",
    label: "Services / Schedule",
    hint: "Service plans, rehearsal details, team assignments",
    tables: ["services", "service_assignments"],
  },
  {
    key: "setlists",
    label: "Setlists",
    hint: "Setlist song order and setlist-specific keys",
    tables: ["service_items"],
    dependsOn: ["services", "songs"],
  },
  {
    key: "team",
    label: "Team / Personnel Profiles",
    hint: "Public and internal member profiles",
    tables: ["profiles"],
    buckets: ["personnel-avatars"],
  },
  {
    key: "users",
    label: "User Profiles",
    hint: "Account status and provider metadata (no credentials)",
    tables: ["profiles"],
  },
  {
    key: "roles",
    label: "Roles / Permissions",
    hint: "Role assignments per user",
    tables: ["user_roles"],
    settingKeys: ["setlist_permissions"],
  },
  {
    key: "albums",
    label: "Albums",
    hint: "Media album groupings and covers",
    tables: ["media_albums"],
  },
  {
    key: "media",
    label: "Media",
    hint: "Photos, videos, audio, documents and their storage files",
    tables: ["media_items"],
    dependsOn: ["albums"],
    buckets: ["song-resources"],
  },
  {
    key: "resources",
    label: "Resources",
    hint: "Worship resources, devotionals, training library",
    tables: ["worship_resources"],
  },
  {
    key: "branding",
    label: "Branding",
    hint: "Logos, palette, motion, published + draft brand config and history",
    tables: [],
    settingKeys: ["branding", "branding_draft", "branding_versions"],
  },
  {
    key: "themes",
    label: "Themes / Design System",
    hint: "Design tokens, AI design concepts, published theme and history",
    tables: [],
    settingKeys: ["design_theme", "design_theme_drafts", "design_theme_versions"],
  },
  {
    key: "navigation",
    label: "Navigation",
    hint: "Homepage section visibility and ordering",
    tables: [],
    settingKeys: ["homepage_sections"],
  },
  {
    key: "settings",
    label: "App Settings",
    hint: "Any remaining ministry / application configuration",
    tables: [],
    settingKeys: ["*"],
  },
];

export const ALL_MODULE_KEYS = BACKUP_MODULES.map((m) => m.key);

export function moduleDef(key: ModuleKey): ModuleDefinition | undefined {
  return BACKUP_MODULES.find((m) => m.key === key);
}

export interface StorageFileEntry {
  bucket: string;
  path: string;
  name: string;
  mimeType?: string;
  size?: number;
  checksum?: string;
  relatedRecordId?: string;
  /** false => "FILE NOT INCLUDED", manifest entry only. */
  included: boolean;
  /** Path inside the ZIP when included. */
  zipPath?: string;
  reason?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type BackupRow = Record<string, any>;

export interface ModulePayload {
  module: ModuleKey;
  tables: Record<string, BackupRow[]>;
  settings: Record<string, any>;
  recordCount: number;
}

export interface BackupManifest {
  backupFormatVersion: number;
  appId: string;
  appVersion: string;
  schemaVersion: string;
  backupId: string;
  createdAt: string;
  createdBy: string;
  kind: "full" | "selective";
  includedModules: ModuleKey[];
  excludedModules: { module: string; reason: string }[];
  recordCounts: Record<string, number>;
  tableCounts: Record<string, number>;
  fileCount: number;
  filesIncluded: number;
  filesManifestOnly: number;
  totalFileBytes: number;
  checksums: Record<string, string>;
  compatibility: {
    minFormatVersion: number;
    maxFormatVersion: number;
    requires: string[];
  };
  migrationRequirements: string[];
  portable: boolean;
  secretsExcluded: true;
  verification?: VerificationResult;
}

export interface VerificationResult {
  verified: boolean;
  checkedAt: string;
  checks: { name: string; ok: boolean; detail: string }[];
}

export interface BackupHistoryEntry {
  backupId: string;
  name: string;
  createdAt: string;
  createdBy: string;
  kind: "full" | "selective";
  modules: ModuleKey[];
  sizeBytes: number;
  verified: boolean;
  status: string;
  recordCounts: Record<string, number>;
  fileCount: number;
  purpose?: "backup" | "migration" | "recovery-point";
}

export const BACKUP_HISTORY_KEY = "backup_history";

/** Settings keys that belong to a specific module (so "App Settings" can exclude them). */
export const CLAIMED_SETTING_KEYS = BACKUP_MODULES.flatMap((m) =>
  (m.settingKeys ?? []).filter((k) => k !== "*"),
);

export function backupFileName(kind: "full" | "selective" | "migration", date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  const label =
    kind === "full" ? "FullBackup" : kind === "migration" ? "MigrationPackage" : "SelectiveBackup";
  return `CBCP-Worship-${label}-${stamp}.zip`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** SHA-256 hex checksum; works in browser and worker runtimes. */
export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const view = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", view.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
