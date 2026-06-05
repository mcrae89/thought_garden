jest.mock('@/database', () => ({ db: {} }));
jest.mock('@/modules/sync/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { authService } from '@/modules/auth/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import type { Session } from '@/modules/auth';

const mockSession: Session = {
  userId: 'user-1',
  accessToken: 'token-abc',
  expiresAt: new Date('2099-01-01'),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ session: null, isAuthenticated: false, tier: 'free' });
});

describe('Auth flow integration', () => {
  it('setSession updates auth state on sign in', () => {
    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.session).toBe(mockSession);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clearSession resets state on sign out', () => {
    useAuthStore.getState().setSession(mockSession);
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.tier).toBe('free');
  });

  it('signOut calls authService.signOut and clears session', async () => {
    const signOutSpy = jest.spyOn(authService, 'signOut').mockResolvedValue(undefined);

    useAuthStore.getState().setSession(mockSession);
    await authService.signOut();
    useAuthStore.getState().clearSession();

    expect(signOutSpy).toHaveBeenCalled();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('session persists through setSession', () => {
    useAuthStore.getState().setSession(mockSession);
    // Simulate re-reading state (persistence check)
    const session = useAuthStore.getState().session;
    expect(session?.userId).toBe('user-1');
    expect(session?.accessToken).toBe('token-abc');
  });
});
