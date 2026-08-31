/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  History,
  Loader2,
  PackageCheck,
  Rocket,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  ALL_MODULE_KEYS,
  APP_VERSION,
  BACKUP_FORMAT_VERSION,
  BACKUP_MODULES,
  SCHEMA_VERSION,
  backupFileName,
  formatBytes,
  moduleDef,
  sha256Hex,
  type BackupHistoryEntry,
  type ModuleKey,
  type StorageFileEntry,
  type VerificationResult,
} from "@/lib/backup-format";
import {
  base64ToBytes,
  buildBackupZip,
  downloadBytes,
  parseBackupZip,
  toRestoreInputs,
  verifyBackup,
  type ParsedBackup,
} from "@/lib/backup-zip";
import {
  checkBackupReadiness,
  createRecoveryPoint,
  deleteBackupHistoryEntry,
  downloadStorageFiles,
  dryRunRestore,
  exportBackupModules,
  getBackupOverview,
  restoreStorageFiles,
  runRestore,
  saveBackupHistoryEntry,
} from "@/lib/backup.functions";

type Stage = { label: string; state: "pending" | "active" | "done" | "failed" };

const BACKUP_STAGES = [
  "Preparing",
  "Exporting database",
  "Exporting songs",
  "Exporting setlists",
  "Collecting media",
  "Exporting branding",
  "Creating manifest",
  "Compressing",
  "Verifying",
  "Complete",
];

const RESTORE_STAGES = [
  "Inspecting backup",
  "Compatibility check",
  "Recovery snapshot",
  "Importing",
  "Rebuilding relationships",
  "Restoring assets",
  "Revalidating",
  "Complete",
];

function StageList({ stages }: { stages: Stage[] }) {
  const done = stages.filter((s) => s.state === "done").length;
  return (
    <div className="space-y-3">
      <Progress value={(done / stages.length) * 100} className="h-1.5" />
      <div className="grid gap-1.5 sm:grid-cols-2">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]">
            {stage.state === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
            {stage.state === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
            {stage.state === "failed" && <XCircle className="h-3.5 w-3.5 text-destructive" />}
            {stage.state === "pending" && <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
            <span className={cn(stage.state === "pending" ? "text-muted-foreground/60" : "text-foreground")}>{stage.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, hint, icon }: { label: string; value: string; hint?: string | undefined; icon: React.ReactNode }) {
  return (
    <Card className="rounded-none border-accent/15 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className="text-accent">{icon}</div>
      </div>
    </Card>
  );
}

function VerificationPanel({ result }: { result: VerificationResult }) {
  return (
    <div className="space-y-2 border border-accent/15 p-3">
      <div className="flex items-center gap-2">
        {result.verified ? (
          <Badge className="rounded-none bg-accent text-accent-foreground">Verified ✓</Badge>
        ) : (
          <Badge variant="destructive" className="rounded-none">Verification failed</Badge>
        )}
        <span className="text-[11px] text-muted-foreground">{new Date(result.checkedAt).toLocaleString()}</span>
      </div>
      <ul className="space-y-1">
        {result.checks.map((check) => (
          <li key={check.name} className="flex items-start gap-2 text-xs">
            {check.ok ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            ) : (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            <span className="min-w-0">
              <span className="font-medium">{check.name}:</span>{" "}
              <span className="text-muted-foreground break-words">{check.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BackupRestoreCenter() {
  const queryClient = useQueryClient();

  const overviewFn = useServerFn(getBackupOverview);
  const readinessFn = useServerFn(checkBackupReadiness);
  const exportFn = useServerFn(exportBackupModules);
  const filesFn = useServerFn(downloadStorageFiles);
  const saveHistoryFn = useServerFn(saveBackupHistoryEntry);
  const deleteHistoryFn = useServerFn(deleteBackupHistoryEntry);
  const dryRunFn = useServerFn(dryRunRestore);
  const recoveryFn = useServerFn(createRecoveryPoint);
  const restoreFn = useServerFn(runRestore);
  const restoreFilesFn = useServerFn(restoreStorageFiles);

  const overview = useQuery({ queryKey: ["backup-overview"], queryFn: () => overviewFn({}) });
  const history: BackupHistoryEntry[] = overview.data?.history ?? [];

  const readiness = useQuery({ queryKey: ["backup-readiness"], queryFn: () => readinessFn({}), enabled: false });

  /* ------------------------------ create backup ----------------------------- */
  const [selected, setSelected] = useState<ModuleKey[]>([...ALL_MODULE_KEYS]);
  const [includeFiles, setIncludeFiles] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [lastVerification, setLastVerification] = useState<VerificationResult | null>(null);
  const [busy, setBusy] = useState(false);

  const isFull = selected.length === ALL_MODULE_KEYS.length;

  const setStage = useCallback((index: number, state: Stage["state"], list = BACKUP_STAGES) => {
    setStages(
      list.map((label, i) => ({
        label,
        state: i < index ? "done" : i === index ? state : "pending",
      })),
    );
  }, []);

  const createBackup = useCallback(
    async (purpose: "backup" | "migration" = "backup") => {
      if (busy) return;
      if (!selected.length) {
        toast.error("Select at least one module to back up.");
        return;
      }
      setBusy(true);
      setLastVerification(null);
      try {
        setStage(0, "active");
        const exported = await exportFn({ data: { modules: selected } });
        setStage(1, "active");
        setStage(3, "active");

        const storage: StorageFileEntry[] = exported.storage as StorageFileEntry[];
        setStage(4, "active");
        if (includeFiles && storage.length) {
          const batches: StorageFileEntry[][] = [];
          for (let i = 0; i < storage.length; i += 8) batches.push(storage.slice(i, i + 8));
          // Fetch a few batches at a time so large libraries do not crawl.
          const CONCURRENCY = 4;
          for (let i = 0; i < batches.length; i += CONCURRENCY) {
            await Promise.all(
              batches.slice(i, i + CONCURRENCY).map(async (batch) => {
                const res = await filesFn({ data: { files: batch.map((f) => ({ bucket: f.bucket, path: f.path })) } });
                for (const item of res.files) {
                  const target = batch.find((f) => f.bucket === item.bucket && f.path === item.path);
                  if (!target) continue;
                  if (item.base64) {
                    const bytes = base64ToBytes(item.base64);
                    (target as any)._bytes = bytes;
                    target.included = true;
                    target.size = item.size ?? bytes.byteLength;
                    target.checksum = await sha256Hex(bytes);
                  } else {
                    target.included = false;
                    target.reason = item.error ?? "FILE NOT INCLUDED";
                  }
                }
              }),
            );
          }
        } else {
          for (const f of storage) {
            f.included = false;
            f.reason = includeFiles ? "No storage objects available" : "Media files excluded by admin choice";
          }
        }

        setStage(5, "active");
        setStage(6, "active");
        setStage(7, "active");
        const kind = isFull ? "full" : "selective";
        const built = await buildBackupZip({
          payloads: exported.payloads as any,
          storage,
          excluded: exported.excluded,
          createdBy: exported.createdBy,
          kind,
          purpose,
          fileName: backupFileName(purpose === "migration" ? "migration" : kind),
        });

        setStage(8, "active");
        const blob = new Blob([new Uint8Array(built.bytes).buffer as ArrayBuffer]);
        const parsed = await parseBackupZip(blob);
        const verification = await verifyBackup(parsed);
        setLastVerification(verification);

        if (!verification.verified) {
          setStage(8, "failed");
          toast.error("Backup incomplete / verification failed", {
            description: verification.checks.find((c) => !c.ok)?.detail,
          });
          return;
        }

        downloadBytes(built.bytes, built.fileName);
        setStage(9, "done");
        setStages(BACKUP_STAGES.map((label) => ({ label, state: "done" })));

        const entry: BackupHistoryEntry = {
          backupId: built.manifest.backupId,
          name: built.fileName,
          createdAt: built.manifest.createdAt,
          createdBy: built.manifest.createdBy,
          kind,
          modules: built.manifest.includedModules,
          sizeBytes: built.bytes.byteLength,
          verified: true,
          status: "Verified",
          recordCounts: built.manifest.recordCounts,
          fileCount: built.manifest.filesIncluded,
          purpose,
        };
        await saveHistoryFn({ data: { entry } });
        await queryClient.invalidateQueries({ queryKey: ["backup-overview"] });
        toast.success("Backup verified and downloaded", { description: built.fileName });
      } catch (error) {
        setStages((prev) => prev.map((s) => (s.state === "active" ? { ...s, state: "failed" } : s)));
        toast.error(error instanceof Error ? error.message : "Backup failed");
      } finally {
        setBusy(false);
      }
    },
    [busy, selected, includeFiles, isFull, exportFn, filesFn, saveHistoryFn, queryClient, setStage],
  );

  /* --------------------------------- restore -------------------------------- */
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedBackup | null>(null);
  const [restoreVerification, setRestoreVerification] = useState<VerificationResult | null>(null);
  const [restoreModules, setRestoreModules] = useState<ModuleKey[]>([]);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [conflict, setConflict] = useState<"keep-existing" | "use-backup" | "skip">("use-backup");
  const [restoreAssets, setRestoreAssets] = useState(true);
  const [dryReport, setDryReport] = useState<any[] | null>(null);
  const [restoreStages, setRestoreStages] = useState<Stage[]>([]);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BackupHistoryEntry | null>(null);

  const compatibility = useMemo(() => {
    if (!parsed) return null;
    const m = parsed.manifest;
    const problems: string[] = [];
    const warnings: string[] = [];
    if (m.backupFormatVersion > BACKUP_FORMAT_VERSION) {
      problems.push(`Backup format v${m.backupFormatVersion} is newer than this app (v${BACKUP_FORMAT_VERSION}). Update the app first.`);
    }
    if (m.appId && m.appId !== "cbcp-worship") {
      problems.push(`Backup was created by a different application ("${m.appId}").`);
    }
    if (m.schemaVersion !== SCHEMA_VERSION) {
      warnings.push(`Schema differs (backup ${m.schemaVersion}, app ${SCHEMA_VERSION}). Unknown columns are mapped by name and extra fields are ignored.`);
    }
    const unknown = m.includedModules.filter((k) => !ALL_MODULE_KEYS.includes(k));
    if (unknown.length) warnings.push(`Modules not present in this app version: ${unknown.join(", ")}`);
    if (m.filesManifestOnly > 0) warnings.push(`${m.filesManifestOnly} media file(s) are manifest-only (FILE NOT INCLUDED).`);
    for (const key of m.includedModules) {
      for (const dep of moduleDef(key)?.dependsOn ?? []) {
        if (!m.includedModules.includes(dep)) {
          warnings.push(`"${moduleDef(key)?.label}" depends on "${moduleDef(dep)?.label}", which is not in this backup — existing destination records will be used.`);
        }
      }
    }
    return { compatible: problems.length === 0, problems, warnings };
  }, [parsed]);

  const onPickFile = async (file: File) => {
    setParsed(null);
    setDryReport(null);
    setRestoreVerification(null);
    setRestoreStages(RESTORE_STAGES.map((label, i) => ({ label, state: i === 0 ? "active" : "pending" })));
    try {
      const result = await parseBackupZip(file);
      setParsed(result);
      setRestoreModules(result.manifest.includedModules.filter((k) => ALL_MODULE_KEYS.includes(k)));
      const verification = await verifyBackup(result);
      setRestoreVerification(verification);
      setRestoreStages(RESTORE_STAGES.map((label, i) => ({ label, state: i < 2 ? "done" : i === 2 ? "pending" : "pending" })));
    } catch (error) {
      setRestoreStages(RESTORE_STAGES.map((label, i) => ({ label, state: i === 0 ? "failed" : "pending" })));
      toast.error(error instanceof Error ? error.message : "Could not read that backup");
    }
  };

  const dryRun = useMutation({
    mutationFn: async () => {
      if (!parsed) throw new Error("Upload a backup first");
      const inputs = toRestoreInputs(parsed, restoreModules);
      return dryRunFn({ data: { inputs } });
    },
    onSuccess: (res) => {
      setDryReport(res.report);
      toast.success("Dry run complete — no data was changed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const performRestore = useCallback(async () => {
    if (!parsed) return;
    setBusy(true);
    const step = (i: number, state: Stage["state"] = "active") =>
      setRestoreStages(RESTORE_STAGES.map((label, idx) => ({ label, state: idx < i ? "done" : idx === i ? state : "pending" })));
    try {
      step(0);
      step(1);
      if (!compatibility?.compatible) throw new Error("Incompatible backup — restore stopped.");

      step(2);
      const recovery = await recoveryFn({ data: { modules: restoreModules } });
      const recoveryZip = await buildBackupZip({
        payloads: recovery.payloads as any,
        storage: [],
        excluded: [],
        createdBy: "Pre-restore recovery point",
        kind: "selective",
        purpose: "recovery-point",
        fileName: `CBCP-Worship-RecoveryPoint-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.zip`,
      });
      downloadBytes(recoveryZip.bytes, recoveryZip.fileName);
      await saveHistoryFn({
        data: {
          entry: {
            backupId: recoveryZip.manifest.backupId,
            name: recoveryZip.fileName,
            createdAt: recoveryZip.manifest.createdAt,
            createdBy: recoveryZip.manifest.createdBy,
            kind: "selective",
            modules: recoveryZip.manifest.includedModules,
            sizeBytes: recoveryZip.bytes.byteLength,
            verified: true,
            status: "Recovery point",
            recordCounts: recoveryZip.manifest.recordCounts,
            fileCount: 0,
            purpose: "recovery-point",
          } satisfies BackupHistoryEntry,
        },
      });

      step(3);
      const inputs = toRestoreInputs(parsed, restoreModules);
      const result = await restoreFn({ data: { inputs, mode: restoreMode, conflict } });
      if (!result.ok) throw new Error(result.error ?? "Restore failed");

      step(4);
      step(5);
      let assetsRestored = 0;
      if (restoreAssets) {
        const embedded = parsed.storageFiles.filter((f) => f.included && f.zipPath && parsed.embedded[f.zipPath!]);
        for (let i = 0; i < embedded.length; i += 10) {
          const batch = embedded.slice(i, i + 10);
          const payload = batch.map((f) => {
            const bytes = parsed.embedded[f.zipPath!]!;
            let binary = "";
            for (let j = 0; j < bytes.length; j += 0x8000) binary += String.fromCharCode(...bytes.subarray(j, j + 0x8000));
            return {
              bucket: f.bucket,
              path: f.path,
              base64: btoa(binary),
              ...(f.mimeType ? { contentType: f.mimeType } : {}),
            };
          });
          const res = await restoreFilesFn({ data: { files: payload } });
          assetsRestored += res.results.filter((r) => r.ok).length;
        }
      }

      step(6);
      const totals = result.results.reduce(
        (acc, r) => ({
          inserted: acc.inserted + r.inserted,
          updated: acc.updated + r.updated,
          skipped: acc.skipped + r.skipped,
          deleted: acc.deleted + r.deleted,
        }),
        { inserted: 0, updated: 0, skipped: 0, deleted: 0 },
      );
      setRestoreStages(RESTORE_STAGES.map((label) => ({ label, state: "done" })));
      await queryClient.invalidateQueries();
      toast.success("Restore complete", {
        description: `${totals.inserted} added • ${totals.updated} updated • ${totals.skipped} skipped • ${totals.deleted} removed • ${assetsRestored} file(s)`,
      });

      const report = [
        `# Restore Report`,
        ``,
        `- Backup ID: ${parsed.manifest.backupId}`,
        `- Restored: ${new Date().toISOString()}`,
        `- Mode: ${restoreMode} • Conflicts: ${conflict}`,
        `- Modules: ${restoreModules.join(", ")}`,
        ``,
        ...result.results.map(
          (r) => `- ${r.module}/${r.table}: +${r.inserted} added, ${r.updated} updated, ${r.skipped} skipped, ${r.deleted} removed${r.notes.length ? ` (${r.notes.join("; ")})` : ""}`,
        ),
        ``,
        `- Assets restored: ${assetsRestored}`,
        `- Recovery point: ${recoveryZip.fileName}`,
      ].join("\n");
      const url = URL.createObjectURL(new Blob([report], { type: "text/markdown" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `restore-report-${parsed.manifest.backupId}.md`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      setRestoreStages((prev) => prev.map((s) => (s.state === "active" ? { ...s, state: "failed" } : s)));
      toast.error(error instanceof Error ? error.message : "Restore failed", {
        description: "No further changes were applied. Use the downloaded recovery point to roll back if needed.",
      });
    } finally {
      setBusy(false);
    }
  }, [parsed, compatibility, restoreModules, restoreMode, conflict, restoreAssets, recoveryFn, restoreFn, restoreFilesFn, saveHistoryFn, queryClient]);

  /* -------------------------------- migration ------------------------------- */
  const migrationPresets: { key: string; label: string; hint: string; modules: ModuleKey[] }[] = [
    { key: "everything", label: "Restore Everything", hint: "Data, media, branding and design system", modules: [...ALL_MODULE_KEYS] },
    {
      key: "data-keep-branding",
      label: "Restore Data + Keep New Branding",
      hint: "Everything except branding, themes and navigation",
      modules: ALL_MODULE_KEYS.filter((k) => !["branding", "themes", "navigation"].includes(k)),
    },
    { key: "branding-only", label: "Restore Branding Only", hint: "Logos, palette, design system, navigation", modules: ["branding", "themes", "navigation"] },
    {
      key: "data-only",
      label: "Restore Data Only",
      hint: "Songs, setlists, services, team, media, resources",
      modules: ["songs", "services", "setlists", "team", "users", "roles", "albums", "media", "resources"],
    },
  ];

  const lastBackup = history[0];
  const lastFull = history.find((h) => h.kind === "full");
  const lastRestorePoint = history.find((h) => h.purpose === "recovery-point");
  const totalSize = history.reduce((sum, h) => sum + h.sizeBytes, 0);
  const health = readiness.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Last Backup"
          value={lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString() : "None yet"}
          hint={lastBackup?.name}
          icon={<Archive size={18} />}
        />
        <SummaryCard
          label="Last Full Backup"
          value={lastFull ? new Date(lastFull.createdAt).toLocaleDateString() : "None yet"}
          hint={lastFull ? formatBytes(lastFull.sizeBytes) : "Create a full portable backup"}
          icon={<PackageCheck size={18} />}
        />
        <SummaryCard
          label="Backup Health"
          value={health ? (health.ready ? "Ready" : "Needs attention") : "Not checked"}
          hint={health ? `${health.issues.length} finding(s)` : "Run readiness check"}
          icon={<ShieldCheck size={18} />}
        />
        <SummaryCard label="Backup Size" value={formatBytes(totalSize)} hint={`${history.length} archive(s) logged`} icon={<HardDrive size={18} />} />
        <SummaryCard label="Schema Version" value={SCHEMA_VERSION} hint="Database schema" icon={<Database size={18} />} />
        <SummaryCard label="Backup Format" value={`v${BACKUP_FORMAT_VERSION}`} hint={`App v${APP_VERSION}`} icon={<Archive size={18} />} />
        <SummaryCard
          label="Last Restore"
          value={lastRestorePoint ? new Date(lastRestorePoint.createdAt).toLocaleDateString() : "Never"}
          hint={lastRestorePoint ? "Recovery point saved" : "No restore performed"}
          icon={<RotateCcw size={18} />}
        />
        <SummaryCard
          label="Storage / Media"
          value={health ? (health.storageOk ? "Reachable" : "Unavailable") : "Unknown"}
          hint="personnel-avatars • song-resources"
          icon={<HardDrive size={18} />}
        />
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-none bg-muted/40 p-1">
          <TabsTrigger value="create" className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]">Create Backup</TabsTrigger>
          <TabsTrigger value="restore" className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]">Restore</TabsTrigger>
          <TabsTrigger value="migration" className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]">Migration</TabsTrigger>
          <TabsTrigger value="history" className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]">History</TabsTrigger>
        </TabsList>

        {/* ------------------------------- CREATE ------------------------------- */}
        <TabsContent value="create" className="mt-4 space-y-4">
          <Card className="rounded-none border-accent/15 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Backup readiness</h3>
                <p className="text-xs text-muted-foreground">Scan for orphaned records, broken links and storage problems before backing up.</p>
              </div>
              <Button variant="outline" className="min-h-11 rounded-none" onClick={() => readiness.refetch()} disabled={readiness.isFetching}>
                {readiness.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Check Backup Readiness
              </Button>
            </div>
            {health && (
              <div className="space-y-2">
                <Badge className={cn("rounded-none", health.ready ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground")}>
                  {health.ready ? "Ready for Backup" : "Needs attention"}
                </Badge>
                <ul className="space-y-1 text-xs">
                  {health.issues.length === 0 && <li className="text-muted-foreground">No issues detected.</li>}
                  {health.issues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", issue.severity === "error" ? "text-destructive" : "text-amber-500")} />
                      <span className="text-muted-foreground">{issue.message}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground">
                  {Object.entries(health.counts).map(([k, v]) => `${k}: ${v}`).join(" • ")}
                </p>
              </div>
            )}
          </Card>

          <Card className="rounded-none border-accent/15 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">{isFull ? "Full portable backup" : "Selective backup"}</h3>
                <p className="text-xs text-muted-foreground">Backup creation is read-only — nothing in the live app is modified.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="min-h-11 rounded-none" onClick={() => setSelected([...ALL_MODULE_KEYS])}>Select All</Button>
                <Button variant="outline" size="sm" className="min-h-11 rounded-none" onClick={() => setSelected([])}>Clear All</Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {BACKUP_MODULES.map((mod) => (
                <label key={mod.key} className="flex min-h-11 cursor-pointer items-start gap-3 border border-accent/10 p-3 hover:bg-accent/5">
                  <Checkbox
                    checked={selected.includes(mod.key)}
                    onCheckedChange={(checked) =>
                      setSelected((prev) => (checked ? [...new Set([...prev, mod.key])] : prev.filter((k) => k !== mod.key)))
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{mod.label}</span>
                    <span className="block text-[11px] leading-snug text-muted-foreground">{mod.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border border-accent/10 p-3">
              <div className="min-w-0">
                <Label className="text-xs font-semibold">Embed media & asset files</Label>
                <p className="text-[11px] text-muted-foreground">
                  When off (or when a file cannot be read) the archive keeps a storage manifest marked FILE NOT INCLUDED.
                </p>
              </div>
              <Switch checked={includeFiles} onCheckedChange={setIncludeFiles} />
            </div>

            <div className="rounded-none border border-accent/10 bg-muted/20 p-3 text-[11px] text-muted-foreground">
              Never exported: passwords, password hashes, API keys, service-role keys, OAuth secrets, access/refresh tokens, environment secrets.
              Project source code is <strong>Not Included / Requires External Setup</strong> — this platform does not expose source files for export.
              The ZIP contains REQUIRED-CONNECTIONS.md listing what to reconfigure after migration.
            </div>

            <Button className="min-h-11 w-full rounded-none sm:w-auto" onClick={() => createBackup("backup")} disabled={busy || !selected.length}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Create Backup
            </Button>

            {stages.length > 0 && <StageList stages={stages} />}
            {lastVerification && <VerificationPanel result={lastVerification} />}
          </Card>
        </TabsContent>

        {/* ------------------------------- RESTORE ------------------------------ */}
        <TabsContent value="restore" className="mt-4 space-y-4">
          <Card className="rounded-none border-accent/15 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Upload backup</h3>
              <p className="text-xs text-muted-foreground">Upload → Inspect → Compatibility → Preview → Conflicts → Confirm → Restore → Verify</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onPickFile(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" className="min-h-11 rounded-none" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload className="mr-2 h-4 w-4" /> Select backup ZIP
            </Button>

            {restoreStages.length > 0 && <StageList stages={restoreStages} />}

            {parsed && (
              <div className="space-y-4">
                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                  <div><span className="text-muted-foreground">Backup ID:</span> {parsed.manifest.backupId}</div>
                  <div><span className="text-muted-foreground">Created:</span> {new Date(parsed.manifest.createdAt).toLocaleString()}</div>
                  <div><span className="text-muted-foreground">Source app:</span> {parsed.manifest.appId} v{parsed.manifest.appVersion}</div>
                  <div><span className="text-muted-foreground">Backup format:</span> v{parsed.manifest.backupFormatVersion}</div>
                  <div><span className="text-muted-foreground">Schema:</span> {parsed.manifest.schemaVersion}</div>
                  <div><span className="text-muted-foreground">Created by:</span> {parsed.manifest.createdBy}</div>
                  <div><span className="text-muted-foreground">Records:</span> {Object.values(parsed.manifest.recordCounts).reduce((a, b) => a + b, 0)}</div>
                  <div><span className="text-muted-foreground">Files:</span> {parsed.manifest.filesIncluded} embedded / {parsed.manifest.fileCount} listed</div>
                  <div><span className="text-muted-foreground">Modules:</span> {parsed.manifest.includedModules.length}</div>
                </div>

                {compatibility && (
                  <div className="space-y-1 border border-accent/15 p-3 text-xs">
                    <Badge className={cn("rounded-none", compatibility.compatible ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground")}>
                      {compatibility.compatible ? "Compatible" : "Incompatible Backup"}
                    </Badge>
                    {compatibility.problems.map((p) => (
                      <p key={p} className="text-destructive">{p}</p>
                    ))}
                    {compatibility.warnings.map((w) => (
                      <p key={w} className="text-muted-foreground">⚠ {w}</p>
                    ))}
                  </div>
                )}

                {restoreVerification && <VerificationPanel result={restoreVerification} />}

                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Modules to restore</Label>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {parsed.manifest.includedModules.filter((k) => ALL_MODULE_KEYS.includes(k)).map((key) => (
                      <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 border border-accent/10 p-3">
                        <Checkbox
                          checked={restoreModules.includes(key)}
                          onCheckedChange={(checked) =>
                            setRestoreModules((prev) => (checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)))
                          }
                        />
                        <span className="text-xs font-semibold">{moduleDef(key)?.label ?? key}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground">{parsed.manifest.recordCounts[key] ?? 0}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Restore mode</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["merge", "replace"] as const).map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          size="sm"
                          variant={restoreMode === mode ? "default" : "outline"}
                          className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]"
                          onClick={() => setRestoreMode(mode)}
                        >
                          {mode === "merge" ? "Merge (add / update)" : "Replace module"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Conflicts</Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        ["use-backup", "Use backup version"],
                        ["keep-existing", "Keep existing"],
                        ["skip", "Skip conflicting"],
                      ] as const).map(([value, label]) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={conflict === value ? "default" : "outline"}
                          className="min-h-11 rounded-none text-[11px] uppercase tracking-[0.15em]"
                          onClick={() => setConflict(value)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border border-accent/10 p-3">
                  <Label className="text-xs font-semibold">Restore embedded media/asset files</Label>
                  <Switch checked={restoreAssets} onCheckedChange={setRestoreAssets} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-11 rounded-none" onClick={() => dryRun.mutate()} disabled={dryRun.isPending || !restoreModules.length}>
                    {dryRun.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Test Restore (Dry Run)
                  </Button>
                  <Button
                    className="min-h-11 rounded-none"
                    disabled={busy || !restoreModules.length || !compatibility?.compatible}
                    onClick={() => setConfirmRestore(true)}
                  >
                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                    Restore Backup
                  </Button>
                </div>

                {dryReport && (
                  <div className="overflow-x-auto border border-accent/15">
                    <table className="w-full min-w-[560px] text-xs">
                      <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                        <tr>
                          <th className="p-2 text-left">Module / Table</th>
                          <th className="p-2 text-right">Incoming</th>
                          <th className="p-2 text-right">Added</th>
                          <th className="p-2 text-right">Replaced</th>
                          <th className="p-2 text-left">Conflicts / Missing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryReport.map((row: any, i: number) => (
                          <tr key={i} className="border-t border-accent/10">
                            <td className="p-2">{row.module} / {row.table}</td>
                            <td className="p-2 text-right">{row.incoming}</td>
                            <td className="p-2 text-right">{row.wouldAdd}</td>
                            <td className="p-2 text-right">{row.wouldReplace}</td>
                            <td className="p-2 text-muted-foreground">
                              {[...row.conflicts, ...row.missingReferences].join(" • ") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ------------------------------ MIGRATION ----------------------------- */}
        <TabsContent value="migration" className="mt-4 space-y-4">
          <Card className="rounded-none border-accent/15 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Prepare for migration</h3>
              <p className="text-xs text-muted-foreground">
                Builds a maximum-portability package (data, relationships, assets, settings, design system, restore guide) for another
                compatible or rebranded deployment of this app.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {migrationPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setSelected(preset.modules)}
                  className={cn(
                    "min-h-11 border p-3 text-left transition-colors",
                    selected.length === preset.modules.length && preset.modules.every((m) => selected.includes(m))
                      ? "border-accent bg-accent/10"
                      : "border-accent/10 hover:bg-accent/5",
                  )}
                >
                  <span className="block text-xs font-semibold">{preset.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{preset.hint}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Destination branding is never replaced automatically — the destination admin chooses whether to restore source branding.
            </p>
            <Button className="min-h-11 w-full rounded-none sm:w-auto" onClick={() => createBackup("migration")} disabled={busy || !selected.length}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Prepare Migration Package
            </Button>
            {stages.length > 0 && <StageList stages={stages} />}
          </Card>
        </TabsContent>

        {/* ------------------------------- HISTORY ------------------------------ */}
        <TabsContent value="history" className="mt-4">
          <Card className="rounded-none border-accent/15">
            <div className="flex items-center gap-2 border-b border-accent/10 p-4">
              <History className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Backup history</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="hidden w-full min-w-[720px] text-xs sm:table">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Modules</th>
                    <th className="p-3 text-right">Size</th>
                    <th className="p-3 text-left">Verified</th>
                    <th className="p-3 text-left">Created by</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.backupId} className="border-t border-accent/10">
                      <td className="p-3">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="p-3 max-w-[220px] truncate">{entry.name}</td>
                      <td className="p-3 capitalize">{entry.purpose === "recovery-point" ? "Recovery point" : entry.kind}</td>
                      <td className="p-3 max-w-[200px] truncate text-muted-foreground">{entry.modules.join(", ")}</td>
                      <td className="p-3 text-right">{formatBytes(entry.sizeBytes)}</td>
                      <td className="p-3">
                        <Badge className={cn("rounded-none", entry.verified ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground")}>
                          {entry.verified ? "Verified ✓" : entry.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{entry.createdBy}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" className="rounded-none" onClick={() => setPendingDelete(entry)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted-foreground">No backups recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="space-y-2 p-3 sm:hidden">
                {history.map((entry) => (
                  <div key={entry.backupId} className="border border-accent/10 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{entry.name}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className={cn("rounded-none", entry.verified ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground")}>
                        {entry.verified ? "Verified ✓" : entry.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {entry.purpose === "recovery-point" ? "Recovery point" : entry.kind} • {formatBytes(entry.sizeBytes)} • {entry.modules.length} module(s)
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 min-h-11 w-full rounded-none" onClick={() => setPendingDelete(entry)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete entry
                    </Button>
                  </div>
                ))}
                {history.length === 0 && <p className="p-4 text-center text-xs text-muted-foreground">No backups recorded yet.</p>}
              </div>
            </div>
            <p className="border-t border-accent/10 p-3 text-[11px] text-muted-foreground">
              Archives download straight to your device and are never stored publicly. History records metadata only.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm restore</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreMode === "replace"
                ? "Replace mode removes destination records in the selected modules that are not present in the backup."
                : "Merge mode adds and updates records without deleting unrelated data."}{" "}
              A Pre-Restore Recovery Point is created and downloaded automatically before anything changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 rounded-none"
              onClick={() => {
                setConfirmRestore(false);
                void performRestore();
              }}
            >
              Restore now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete backup record?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{pendingDelete?.name}” from the history log. Downloaded ZIP files on your device are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 rounded-none"
              onClick={async () => {
                if (!pendingDelete) return;
                await deleteHistoryFn({ data: { backupId: pendingDelete.backupId } });
                setPendingDelete(null);
                await queryClient.invalidateQueries({ queryKey: ["backup-overview"] });
                toast.success("Backup record deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
