import { __resetStore } from '../../__mocks__/expo-secure-store';
import * as SecureStore from 'expo-secure-store';

jest.mock('@/modules/sync/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { supabase } from '@/modules/sync/supabase-client';
import { authService } from '@/modules/auth/auth-service';
import { openAuthSessionAsync } from 'expo-web-browser';

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
const mockSignInWithOAuth = supabase.auth.signInWithOAuth as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOpenAuth = openAuthSessionAsync as jest.Mock;

const validSession = {
  user: { id: 'user-123' },
  access_token: 'access-token-abc',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

beforeEach(() => {
  __resetStore();
  mockSignIn.mockReset();
  mockSignInWithOAuth.mockReset();
  mockGetSession.mockReset();
  mockOpenAuth.mockReset();
});

describe('authService.signInWithEmail', () => {
  it('should return success with session when credentials are valid', async () => {
    mockSignIn.mockResolvedValue({ data: { session: validSession }, error: null });

    const result = await authService.signInWithEmail('user@test.com', 'password123');

    expect(result.success).toBe(true);
    expect(result.session).toEqual({
      userId: 'user-123',
      accessToken: 'access-token-abc',
      expiresAt: new Date(validSession.expires_at * 1000),
    });
  });

  it('should return invalid_credentials error when Supabase returns auth error', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

    const result = await authService.signInWithEmail('user@test.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_credentials');
  });

  it('should return network_unavailable error when Supabase returns network error', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

    const result = await authService.signInWithEmail('user@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('network_unavailable');
  });

  it('should return account_not_found error when Supabase returns user not found', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'User not found' } });

    const result = await authService.signInWithEmail('nobody@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('account_not_found');
  });

  it('should only be available in __DEV__ mode (returns invalid_credentials when !__DEV__)', async () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    const result = await authService.signInWithEmail('user@test.com', 'pass');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('invalid_credentials');
    expect(result.error?.message).toContain('only available in dev');
    (global as any).__DEV__ = originalDev;
  });
});

describe('authService.signInWithOAuth', () => {
  it('should return success when OAuth browser session completes successfully', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://auth.example.com' }, error: null });
    mockOpenAuth.mockResolvedValue({ type: 'success', url: 'thought-garden://auth?code=abc' });

    const result = await authService.signInWithOAuth('google');

    expect(result.success).toBe(true);
  });

  it('should return network_unavailable when browser session is cancelled', async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: { url: 'https://auth.example.com' }, error: null });
    mockOpenAuth.mockResolvedValue({ type: 'cancel' });

    const result = await authService.signInWithOAuth('google');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('network_unavailable');
  });
});

describe('authService.signInWithEmail session structure', () => {
  it('should return a session with userId, accessToken, and expiresAt after successful email login', async () => {
    mockSignIn.mockResolvedValue({ data: { session: validSession }, error: null });

    const result = await authService.signInWithEmail('user@test.com', 'password123');

    expect(result.session).toHaveProperty('userId', 'user-123');
    expect(result.session).toHaveProperty('accessToken', 'access-token-abc');
    expect(result.session?.expiresAt).toBeInstanceOf(Date);
  });
});

describe('authService error messages', () => {
  it('should include descriptive message in each error type', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });
    const r1 = await authService.signInWithEmail('a@b.com', 'x');
    expect(r1.error?.message).toContain('Invalid login credentials');

    __resetStore();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    const r2 = await authService.signInWithEmail('a@b.com', 'x');
    expect(r2.error?.message).toContain('Failed to fetch');

    __resetStore();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'User not found' } });
    const r3 = await authService.signInWithEmail('a@b.com', 'x');
    expect(r3.error?.message).toContain('User not found');
  });
});

describe('authService.getSession persistence', () => {
  it('should persist session to secure store after successful login', async () => {
    mockSignIn.mockResolvedValue({ data: { session: validSession }, error: null });

    await authService.signInWithEmail('user@test.com', 'password123');

    const stored = await SecureStore.getItemAsync('auth_session');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.userId).toBe('user-123');
  });

  it('should load persisted session from secure store when Supabase returns no session', async () => {
    const futureDate = new Date(Date.now() + 3600_000);
    await SecureStore.setItemAsync('auth_session', JSON.stringify({
      userId: 'stored-user',
      accessToken: 'stored-token',
      expiresAt: futureDate.toISOString(),
    }));
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const session = await authService.getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe('stored-user');
  });

  it('should return null when stored session is expired', async () => {
    jest.useFakeTimers();
    const pastDate = new Date(Date.now() - 1000);
    await SecureStore.setItemAsync('auth_session', JSON.stringify({
      userId: 'expired-user',
      accessToken: 'expired-token',
      expiresAt: pastDate.toISOString(),
    }));
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

    const session = await authService.getSession();

    expect(session).toBeNull();
    jest.useRealTimers();
  });
});

describe('authService.getSession offline with valid local session', () => {
  it('should return stored session when Supabase getSession fails with network error and stored session is valid', async () => {
    const futureDate = new Date(Date.now() + 3600_000);
    await SecureStore.setItemAsync('auth_session', JSON.stringify({
      userId: 'offline-user',
      accessToken: 'offline-token',
      expiresAt: futureDate.toISOString(),
    }));
    mockGetSession.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

    const session = await authService.getSession();

    expect(session).not.toBeNull();
    expect(session?.userId).toBe('offline-user');
  });
});

describe('authService.getSession offline with no local session', () => {
  it('should return null when network error occurs and no session is stored', async () => {
    mockGetSession.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

    const session = await authService.getSession();

    expect(session).toBeNull();
  });
});
