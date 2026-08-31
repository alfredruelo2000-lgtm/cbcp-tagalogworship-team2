import { createFileRoute } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const BackupRestoreCenter = lazy(() => import('@/components/backup/BackupRestoreCenter'));

export const Route = createFileRoute('/_authenticated/dashboard/backup')({
  head: () => ({
    meta: [
      { title: 'Backup & Restore — CBCP Worship Admin' },
      { name: 'description', content: 'Create verified full or selective backups, restore data, and prepare migration packages for the CBCP Tagalog Worship Team app.' },
      { property: 'og:title', content: 'Backup & Restore — CBCP Worship Admin' },
      { property: 'og:description', content: 'Verified backups, selective restore, dry runs and migration packages.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const { isMinistryAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!isMinistryAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <ShieldCheck className="mx-auto mb-4 h-8 w-8 text-accent" />
        <h1 className="text-lg font-bold uppercase tracking-[0.2em]">Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Backup &amp; Restore is available to ministry administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Backup &amp; Restore</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Create verified portable backups, restore selectively, dry-run an import, and prepare migration packages — without
          touching live data.
        </p>
      </header>
      <Suspense
        fallback={
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        }
      >
        <BackupRestoreCenter />
      </Suspense>
    </div>
  );
}
