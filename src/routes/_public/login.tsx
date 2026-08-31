import { useState } from 'react';
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { z } from 'zod';
import { setPostLoginRedirect } from '@/components/auth/PostLoginRedirect';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/_public/login')({
  validateSearch: (search) => loginSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_public/login' });
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;

      if (data.session) {
        toast.success('Account created — awaiting administrator approval');
        navigate({ to: '/awaiting-approval' });
      } else {
        toast.success('Check your email to confirm your account');
        setMode('signin');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back');
      
      const target = search.redirect?.startsWith('/') && !search.redirect.startsWith('//')
        ? search.redirect
        : '/dashboard';
      navigate({ to: target, replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const target = search.redirect && search.redirect.startsWith('/') ? search.redirect : '/dashboard';
      setPostLoginRedirect(target);

      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(result.error.message || 'Failed to sign in with Google');
        setLoading(false);
        return;
      }

      if (result.redirected) return;

      toast.success('Welcome back');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-20 min-h-[80vh] flex items-center justify-center animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none bg-primary p-2">
              <img src={pickLogo(branding, "light")} alt={branding.name} className="max-h-12 max-w-12 object-contain" />
            </div>
          </div>
          <Badge variant="outline" className="rounded-none uppercase text-[10px] tracking-widest border-accent/20 text-accent">
            Secure Access
          </Badge>
          <h1 className="font-serif text-foreground text-[clamp(1.9rem,8vw,3rem)]">Worship Team Access</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">
            Sign in to access worship planning, schedules, songs, resources, and ministry tools.
          </p>
        </div>

        <div className="space-y-6">
          <Button 
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-14 rounded-none border-accent/20 hover:bg-accent/5 text-foreground font-bold tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-3"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-accent/10"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-background px-4 text-muted-foreground font-bold">OR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 border border-accent/10">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  'min-h-[44px] text-[10px] font-bold uppercase tracking-widest transition-colors ' +
                  (mode === m ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground')
                }
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'signup' ? handleSignUp : handleLogin} className="space-y-6">
          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-accent">Full Name</label>
                <Input
                  type="text"
                  placeholder="Your full name"
                  className="h-14 rounded-none border-accent/10 bg-muted/20 focus-visible:ring-accent"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block">Email Address</label>
              <Input 
                type="email" 
                placeholder="email@radiantworship.org" 
                className="h-14 bg-muted/20 border-accent/10 rounded-none focus-visible:ring-accent"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[9px] font-bold tracking-[0.2em] text-accent uppercase block">Password</label>
                {mode === 'signin' && <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[9px] font-bold text-accent uppercase tracking-widest hover:underline disabled:opacity-50"
                  disabled={loading}
                >
                  Forgot?
                </button>}
              </div>
              <Input 
                type="password" 
                className="h-14 bg-muted/20 border-accent/10 rounded-none focus-visible:ring-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 rounded-none bg-accent hover:bg-accent/90 text-primary font-bold tracking-[0.2em] uppercase transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </Button>
        </form>
        </div>

        <div className="text-center border-t border-accent/10 pt-8">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            New accounts require administrator approval before team features unlock.
          </p>
        </div>
      </div>
    </div>
  );
}
