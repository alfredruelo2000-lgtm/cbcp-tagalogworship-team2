import { createFileRoute, Link } from '@tanstack/react-router';
import { Shield, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/awaiting-approval')({
  component: AwaitingApprovalPage,
});

function AwaitingApprovalPage() {
  const { status, isRejected, signOut, refreshAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status && status !== 'Pending' && !isRejected) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [status, isRejected, navigate]);

  return (
    <div className="container mx-auto flex min-h-[75vh] items-center justify-center px-5 py-12 sm:px-6 sm:py-20 animate-in fade-in duration-500">
      <div className="w-full max-w-2xl space-y-8 text-center sm:space-y-12">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-muted/20 flex items-center justify-center rounded-none mb-4 border border-accent/20">
              <Clock className="w-10 h-10 text-accent animate-pulse" />
            </div>
          </div>
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Account Status: {isRejected ? 'Access Disabled' : 'Pending Approval'}
          </Badge>
          <h1 className="font-serif text-foreground text-[clamp(1.9rem,8vw,3rem)]">Prepare Your Heart</h1>
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed font-serif italic">
              "Commit your way to the Lord; trust in him and he will do this."
              <span className="block text-xs uppercase tracking-widest font-bold not-italic mt-2">— Psalm 37:5</span>
            </p>
            <div className="h-px w-20 bg-accent/30 mx-auto" />
            <p className="text-foreground/80 text-sm leading-relaxed tracking-wide">
              {isRejected
                ? 'Your access to team features is currently disabled. Please contact a ministry administrator.'
                : 'Your account is waiting for administrator approval. You may continue browsing the public site in the meantime.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-center gap-3 pt-4 sm:flex-row sm:items-center sm:gap-4 sm:pt-8">
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="rounded-none border-accent/20 hover:bg-accent/5 text-accent uppercase tracking-widest text-[10px] font-bold h-12 px-8"
          >
            <ArrowLeft className="w-3 h-3 mr-2" />
            Sign Out
          </Button>
          <Button
            variant="outline"
            onClick={() => void refreshAccess()}
            className="h-12 rounded-none border-accent/20 px-8 text-[10px] font-bold uppercase tracking-widest text-accent hover:bg-accent/5"
          >
            Check Approval Status
          </Button>
          <Button 
            asChild
            className="rounded-none bg-accent hover:bg-accent/90 text-primary uppercase tracking-widest text-[10px] font-bold h-12 px-8"
          >
            <Link to="/" replace>Return to Homepage</Link>
          </Button>
        </div>

        <div className="pt-12 border-t border-accent/10">
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            <Shield className="w-3 h-3 text-accent/40" />
            <span>Secure Ministry Environment</span>
          </div>
        </div>
      </div>
    </div>
  );
}
