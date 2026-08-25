import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';

const KEY = 'post_login_redirect';

export function setPostLoginRedirect(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // ignore
  }
}

/**
 * After an OAuth round-trip the provider returns to the public origin ("/").
 * Once the Supabase session is hydrated, send the user to where they intended.
 */
export function PostLoginRedirect() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !session) return;
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(KEY);
    } catch {
      target = null;
    }
    if (!target) return;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    if (target.startsWith('/') && !target.startsWith('//')) {
      navigate({ to: target, replace: true });
    }
  }, [session, loading, navigate]);

  return null;
}
