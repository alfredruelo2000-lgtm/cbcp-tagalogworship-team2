import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAccess: () => Promise<void>;
  isAdmin: boolean;
  isMinistryAdmin: boolean;
  isWorshipLeader: boolean;
  isTeamMember: boolean;
  status: string | null;
  isPending: boolean;
  isRejected: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const bootstrapped = useRef<string | null>(null);

  const loadAccess = useCallback(async (userId: string) => {
    try {
      // First sign-in of any provider: create/refresh exactly one profile (Pending by default).
      if (bootstrapped.current !== userId) {
        bootstrapped.current = userId;
        const { error: bootstrapError } = await supabase.rpc('ensure_my_profile');
        if (bootstrapError) console.error('Profile bootstrap failed:', bootstrapError);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roleError) throw roleError;
      setRoles((roleData ?? []).map((r) => r.role));

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile status:', profileError);
      } else {
        setStatus(profileData?.status || 'Pending');
      }
    } catch (error) {
      console.error('Error fetching user auth data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        bootstrapped.current = null;
        setRoles([]);
        setStatus(null);
        setLoading(false);
        return;
      }

      // Token refreshes don't change identity — skip redundant reads.
      if (event === 'TOKEN_REFRESHED') return;
      void loadAccess(session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadAccess]);

  // Approval/role changes made by an admin land here without a reload.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`account-access-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
        void loadAccess(userId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles', filter: `user_id=eq.${userId}` }, () => {
        void loadAccess(userId);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadAccess]);

  const refreshAccess = useCallback(async () => {
    if (user?.id) await loadAccess(user.id);
  }, [user?.id, loadAccess]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed out successfully');
      navigate({ to: '/' });
    }
  };

  const isAdmin = roles.includes('super_admin');
  const isMinistryAdmin = isAdmin || roles.includes('ministry_admin');
  const isWorshipLeader = isMinistryAdmin || roles.includes('worship_director') || roles.includes('worship_pastor') || roles.includes('worship_leader');
  const isTeamMember = isWorshipLeader || roles.includes('team_member');
  const isPending = status === 'Pending';

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      signOut, 
      isAdmin, 
      isMinistryAdmin, 
      isWorshipLeader,
      isTeamMember,
      status,
      isPending
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
