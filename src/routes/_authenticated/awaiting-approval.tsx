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
  const { status, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'Active') {
      navigate({ to: '/dashboard' });
    }
  }, [status, navigate]);

  return (
    <div className="container mx-auto px-6 py-20 min-h-[80vh] flex items-center justify-center animate-in fade-in duration-700">
      <div className="w-full max-w-2xl space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-muted/20 flex items-center justify-center rounded-none mb-4 border border-accent/20">
              <Clock className="w-10 h-10 text-accent animate-pulse" />
            </div>
          </div>
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Account Status: Pending Approval
          </Badge>
          <h1 className="font-serif text-5xl text-foreground">Prepare Your Heart</h1>
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-muted-foreground text-lg leading-relaxed font-serif italic">
              "Commit your way to the Lord; trust in him and he will do this."
              <span className="block text-xs uppercase tracking-widest font-bold not-italic mt-2">— Psalm 37:5</span>
            </p>
            <div className="h-px w-20 bg-accent/30 mx-auto" />
            <p className="text-foreground/80 text-sm leading-relaxed tracking-wide">
              Your account has been created successfully. A ministry administrator must approve your access before you can use team features.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="rounded-none border-accent/20 hover:bg-accent/5 text-accent uppercase tracking-widest text-[10px] font-bold h-12 px-8"
          >
            <ArrowLeft className="w-3 h-3 mr-2" />
            Sign Out
          </Button>
          <Button 
            asChild
            className="rounded-none bg-accent hover:bg-accent/90 text-primary uppercase tracking-widest text-[10px] font-bold h-12 px-8"
          >
            <Link to="/">Return to Homepage</Link>
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
