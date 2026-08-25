import { createFileRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { usePublicRealtime } from '@/lib/use-public-realtime';
import { usePublicSectionVisibility, type PublicSectionKey } from '@/lib/public-section-visibility';


export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

const routeSections: Array<[string, PublicSectionKey]> = [
  ['/worship', 'worship'],
  ['/songs', 'songs'],
  ['/setlists', 'setlists'],
  ['/team', 'team'],
  ['/resources', 'resources'],
  ['/media', 'media'],
  ['/about', 'about'],
  ['/contact', 'contact'],
];

function PublicLayout() {
  usePublicRealtime();
  const location = useLocation();
  const navigate = useNavigate();
  const { isVisible, isFetched } = usePublicSectionVisibility();
  const hiddenSection = routeSections.find(([prefix]) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`))?.[1];
  const isUnavailable = isFetched && hiddenSection !== undefined && !isVisible(hiddenSection);

  return (
    <div className="flex min-h-screen flex-col selection:bg-accent/30 selection:text-primary">
      <Navbar />
      <main className="flex-1 animate-in fade-in duration-700">
        {isUnavailable ? (
          <section className="container mx-auto px-6 py-32 text-center">
            <h1 className="font-serif text-5xl text-foreground">This section is currently unavailable.</h1>
            <button className="mt-8 border-b border-accent pb-1 text-xs font-bold uppercase tracking-widest text-accent" onClick={() => navigate({ to: '/' })}>
              Return home
            </button>
          </section>
        ) : <Outlet />}
      </main>
      {!location.pathname.startsWith('/songs/') && <Footer />}
    </div>
  );
}

