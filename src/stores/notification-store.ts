import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AchievementResult } from '@/modules/achievements';

interface NotificationState {
  notifications: AchievementResult[];
  hasUnread: boolean;
  addNotification: (notification: AchievementResult) => void;
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
      dismissCurrent: () =>
        set((state) => {
          const remaining = state.notifications.slice(1);
          return { notifications: remaining, hasUnread: remaining.length > 0 };
        }),
      clearAll: () => set({ notifications: [], hasUnread: false }),
    }),
    { name: 'notification-store', enabled: __DEV__ },
  ),
);
