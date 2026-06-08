import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AchievementResult } from '@/modules/achievements';
import { useSeedStore } from './seed-store';

interface NotificationState {
  notifications: AchievementResult[];
  hasUnread: boolean;
  addNotification: (notification: AchievementResult) => void;
  dismissAt: (index: number) => void;
  dismissCurrent: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
      notifications: [],
      hasUnread: false,
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
          hasUnread: true,
        })),
      dismissAt: (index) =>
        set((state) => {
          useSeedStore.getState().refreshSeeds();
          const remaining = state.notifications.filter((_, i) => i !== index);
          return { notifications: remaining, hasUnread: remaining.length > 0 };
        }),
      dismissCurrent: () =>
        set((state) => {
          useSeedStore.getState().refreshSeeds();
          const remaining = state.notifications.slice(1);
          return { notifications: remaining, hasUnread: remaining.length > 0 };
        }),
      clearAll: () => {
        useSeedStore.getState().refreshSeeds();
        return set({ notifications: [], hasUnread: false });
      },
    }),
    { name: 'notification-store', enabled: __DEV__ },
  ),
);
