import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_MODULE_KEYS, type BackupHistoryEntry, type ModuleKey } from "./backup-format";

const moduleEnum = z.enum(ALL_MODULE_KEYS as [ModuleKey, ...ModuleKey[]]);
const modulesSchema = z.object({ modules: z.array(moduleEnum).min(1) });

const restoreModuleSchema = z.object({
  module: moduleEnum,
  tables: z.record(z.array(z.any())),
  settings: z.record(z.any()),
});

export const getBackupOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertBackupAdmin, readHistory } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    const history = await readHistory();
    return { history };
  });

export const checkBackupReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertBackupAdmin, backupHealthCheck } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    return backupHealthCheck();
  });

export const exportBackupModules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => modulesSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, exportModules, exportStorageManifest } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    const { payloads, excluded } = await exportModules(data.modules);
    const storage = await exportStorageManifest(data.modules);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      payloads,
      excluded,
      storage,
      createdBy: profile?.full_name || profile?.email || context.userId,
    };
  });

export const downloadStorageFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ files: z.array(z.object({ bucket: z.string(), path: z.string() })).max(40) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, fetchStorageBatch } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    return { files: await fetchStorageBatch(data.files) };
  });

export const saveBackupHistoryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ entry: z.any() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, readHistory, writeHistory } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    const history = await readHistory();
    const entry = data.entry as BackupHistoryEntry;
    const next = [entry, ...history.filter((h) => h.backupId !== entry.backupId)];
    return { history: await writeHistory(next, context.userId) };
  });

export const deleteBackupHistoryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ backupId: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, readHistory, writeHistory } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    const history = await readHistory();
    return {
      history: await writeHistory(
        history.filter((h) => h.backupId !== data.backupId),
        context.userId,
      ),
    };
  });

export const dryRunRestore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ inputs: z.array(restoreModuleSchema) }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, analyzeRestore } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    return { report: await analyzeRestore(data.inputs as never) };
  });

/** Returns the current state of the modules about to change, so the admin can roll back. */
export const createRecoveryPoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => modulesSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, buildRecoveryPoint } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    return { payloads: await buildRecoveryPoint(data.modules) };
  });

export const runRestore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        inputs: z.array(restoreModuleSchema),
        mode: z.enum(["merge", "replace"]),
        conflict: z.enum(["keep-existing", "use-backup", "skip"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, applyRestore } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    try {
      const results = await applyRestore(data.inputs as never, data.mode, data.conflict, context.userId);
      return { ok: true as const, results };
    } catch (error) {
      return {
        ok: false as const,
        results: [],
        error: error instanceof Error ? error.message : "Restore failed",
      };
    }
  });

export const restoreStorageFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        files: z
          .array(
            z.object({
              bucket: z.string(),
              path: z.string(),
              base64: z.string(),
              contentType: z.string().optional(),
            }),
          )
          .max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertBackupAdmin, uploadStorageObjects } = await import("./backup.server");
    await assertBackupAdmin(context.supabase, context.userId);
    return { results: await uploadStorageObjects(data.files) };
  });
