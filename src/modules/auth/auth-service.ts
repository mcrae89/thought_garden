import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/modules/sync/supabase-client';
import type { AuthError } from '@/shared/result';
import type { AuthResult, AuthService, OAuthProvider, Session, Unsubscribe } from './index';

WebBrowser.maybeCompleteAuthSession();

const KEYS = {
  session: 'auth_session',
  failedAttempts: 'auth_failed_attempts',
  lockoutUntil: 'auth_lockout_until',
} as const;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const SIGNOUT_TIMEOUT_MS = 5000;

async function storeGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

async function storeSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function storeDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

function mapSupabaseError(message: string): AuthError {
  if (message.includes('Invalid login credentials')) {
    return { code: 'invalid_credentials', message };
  }
  if (message.includes('User not found')) {
    return { code: 'account_not_found', message };
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
    return { code: 'network_unavailable', message };
  }
  return { code: 'invalid_credentials', message };
}

function isNetworkError(message: string): boolean {
  return message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch');
}

function toSession(supabaseSession: { user: { id: string }; access_token: string; expires_at?: number }): Session {
  return {
    userId: supabaseSession.user.id,
    accessToken: supabaseSession.access_token,
    expiresAt: new Date((supabaseSession.expires_at ?? 0) * 1000),
  };
}

async function getLockoutRemaining(): Promise<number> {
  const lockoutUntil = await storeGet(KEYS.lockoutUntil);
  if (!lockoutUntil) return 0;
  const remaining = Number(lockoutUntil) - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

async function recordFailure(): Promise<void> {
  const current = Number(await storeGet(KEYS.failedAttempts) ?? '0');
  const next = current + 1;
  await storeSet(KEYS.failedAttempts, String(next));
  if (next >= MAX_ATTEMPTS) {
    await storeSet(KEYS.lockoutUntil, String(Date.now() + LOCKOUT_DURATION_MS));
  }
}

async function resetFailures(): Promise<void> {
  await storeDelete(KEYS.failedAttempts);
  await storeDelete(KEYS.lockoutUntil);
}

async function checkLocked(): Promise<AuthResult | null> {
  const remaining = await getLockoutRemaining();
  if (remaining > 0) {
    return {
      success: false,
      error: { code: 'account_locked', message: 'Account temporarily locked', lockoutRemainingSeconds: remaining },
    };
  }
  return null;
}

async function persistSession(session: Session): Promise<void> {
  await storeSet(KEYS.session, JSON.stringify(session));
}

async function loadStoredSession(): Promise<Session | null> {
  const raw = await storeGet(KEYS.session);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { userId: string; accessToken: string; expiresAt: string };
  const session: Session = { userId: parsed.userId, accessToken: parsed.accessToken, expiresAt: new Date(parsed.expiresAt) };
  if (session.expiresAt.getTime() < Date.now()) return null;
  return session;
}

class AuthServiceImpl implements AuthService {
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!__DEV__) {
      return { success: false, error: { code: 'invalid_credentials', message: 'Email sign-in is only available in dev' } };
    }

    const locked = await checkLocked();
    if (locked) return locked;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      await recordFailure();
      return { success: false, error: mapSupabaseError(error.message) };
    }

    await resetFailures();
    const session = toSession(data.session);
    await persistSession(session);
    return { success: true, session };
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: mapSupabaseError(error.message) };
    if (!data.session) return { success: true };
    const session = toSession(data.session);
    await persistSession(session);
    return { success: true, session };
  }

  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    const locked = await checkLocked();
    if (locked) return locked;

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'thought-garden' });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      await recordFailure();
      return { success: false, error: mapSupabaseError(error?.message ?? 'OAuth failed') };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type !== 'success') {
      return { success: false, error: { code: 'network_unavailable', message: 'OAuth cancelled or failed' } };
    }

    // Session will be set via onAuthStateChange after the redirect
    await resetFailures();
    return { success: true };
  }

  async signOut(): Promise<void> {
    const cleanup = async (): Promise<void> => {
      await supabase.auth.signOut();
      await storeDelete(KEYS.session);
      await storeDelete(KEYS.failedAttempts);
      await storeDelete(KEYS.lockoutUntil);
    };

    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Sign out timed out')), SIGNOUT_TIMEOUT_MS);
    });

    await Promise.race([cleanup(), timeout]).catch(() => {
      // Best-effort cleanup on timeout
      storeDelete(KEYS.session);
      storeDelete(KEYS.failedAttempts);
      storeDelete(KEYS.lockoutUntil);
    });
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (isNetworkError(error.message)) {
        return loadStoredSession();
      }
      return null;
    }

    if (!data.session) {
      return loadStoredSession();
    }

    const session = toSession(data.session);
    await persistSession(session);
    return session;
  }

  onAuthStateChange(callback: (session: Session | null) => void): Unsubscribe {
    const { data } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (supabaseSession) {
        const session = toSession(supabaseSession);
        persistSession(session);
        callback(session);
      } else {
        callback(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }

  async getFailedAttempts(): Promise<number> {
    return Number(await storeGet(KEYS.failedAttempts) ?? '0');
  }

  async isAccountLocked(): Promise<boolean> {
    const remaining = await getLockoutRemaining();
    return remaining > 0;
  }
}

export const authService: AuthService = new AuthServiceImpl();
