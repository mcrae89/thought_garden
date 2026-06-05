import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Session } from '@/modules/auth';
import type { Tier } from '@/shared/types';

interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  tier: Tier;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      session: null,
      isAuthenticated: false,
      tier: 'free',
      setSession: (session) =>
        set({ session, isAuthenticated: session !== null }),
      clearSession: () =>
        set({ session: null, isAuthenticated: false, tier: 'free' }),
    }),
    { name: 'auth-store', enabled: __DEV__ },
  ),
);
