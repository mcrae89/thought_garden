/**
 * Feature: thought-garden, Property 29: Account lockout threshold
 * Validates: Requirement 1.5
 *
 * The account SHALL be locked if and only if 5 consecutive failures occur.
 * The lockout SHALL last exactly 15 minutes.
 */
import fc from 'fast-check';
import { __resetStore } from '../__mocks__/expo-secure-store';

// Must mock supabase before importing auth-service
jest.mock('@/modules/sync/supabase-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

import { supabase } from '@/modules/sync/supabase-client';
import { authService } from '@/modules/auth/auth-service';

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

const LOCKOUT_MINUTES = 15;
const MAX_FAILURES = 5;

beforeEach(() => {
  __resetStore();
  mockSignIn.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Property 29: Account lockout threshold', () => {
  it('should NOT lock when fewer than 5 consecutive failures occur', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: MAX_FAILURES - 1 }),
        async (failureCount) => {
          __resetStore();
          mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

          for (let i = 0; i < failureCount; i++) {
            await authService.signInWithEmail('test@example.com', 'wrong');
          }

          const locked = await authService.isAccountLocked();

          expect(locked).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should lock when exactly 5 consecutive failures occur', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: MAX_FAILURES, max: MAX_FAILURES + 10 }),
        async (failureCount) => {
          __resetStore();
          mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

          for (let i = 0; i < failureCount; i++) {
            await authService.signInWithEmail('test@example.com', 'wrong');
          }

          const locked = await authService.isAccountLocked();

          expect(locked).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return account_locked error with lockoutRemainingSeconds when locked', async () => {
    __resetStore();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

    for (let i = 0; i < MAX_FAILURES; i++) {
      await authService.signInWithEmail('test@example.com', 'wrong');
    }

    const result = await authService.signInWithEmail('test@example.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('account_locked');
    expect(result.error?.lockoutRemainingSeconds).toBeGreaterThan(0);
    expect(result.error?.lockoutRemainingSeconds).toBeLessThanOrEqual(LOCKOUT_MINUTES * 60);
  });

  it('should unlock after 15 minutes have elapsed', async () => {
    __resetStore();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

    for (let i = 0; i < MAX_FAILURES; i++) {
      await authService.signInWithEmail('test@example.com', 'wrong');
    }

    expect(await authService.isAccountLocked()).toBe(true);

    jest.advanceTimersByTime(LOCKOUT_MINUTES * 60 * 1000 + 1);

    expect(await authService.isAccountLocked()).toBe(false);
  });

  it('should reset failure count after a successful login', async () => {
    __resetStore();
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });

    // Fail 4 times (one below threshold)
    for (let i = 0; i < MAX_FAILURES - 1; i++) {
      await authService.signInWithEmail('test@example.com', 'wrong');
    }

    // Succeed
    mockSignIn.mockResolvedValue({
      data: { session: { user: { id: 'u1' }, access_token: 'tok', expires_at: Math.floor(Date.now() / 1000) + 3600 } },
      error: null,
    });
    await authService.signInWithEmail('test@example.com', 'correct');

    // Fail again — should not be locked since counter was reset
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });
    for (let i = 0; i < MAX_FAILURES - 1; i++) {
      await authService.signInWithEmail('test@example.com', 'wrong');
    }

    expect(await authService.isAccountLocked()).toBe(false);
    expect(await authService.getFailedAttempts()).toBe(MAX_FAILURES - 1);
  });
});
