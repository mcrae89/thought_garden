import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SyncState {
  conflictPending: boolean;
  resolveConflict: ((choice: 'local' | 'server') => void) | null;
  showConflict: (resolve: (choice: 'local' | 'server') => void) => void;
  dismissConflict: () => void;
}

export const useSyncStore = create<SyncState>()(
  devtools(
    (set) => ({
      conflictPending: false,
      resolveConflict: null,
      showConflict: (resolve) => set({ conflictPending: true, resolveConflict: resolve }),
      dismissConflict: () => set({ conflictPending: false, resolveConflict: null }),
    }),
    { name: 'sync-store', enabled: __DEV__ },
  ),
);
