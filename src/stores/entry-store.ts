import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { entryService } from '@/modules/entries';
import { achievementEngine, buildAchievementContext } from '@/modules/achievements';
import { gardenService } from '@/modules/garden';
import { useNotificationStore } from '@/stores/notification-store';
import type { Entry } from '@/modules/entries';
import type { Emotion, Tier } from '@/shared/types';

interface EntryState {
  entries: Entry[];
  isLoading: boolean;
  setEntries: (entries: Entry[]) => void;
  createEntry: (content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier) => Promise<Entry>;
  editEntry: (id: string, content: string, primaryEmotion: Emotion, secondaryEmotions: Emotion[], userId: string, tier: Tier) => Promise<Entry>;
  deleteEntry: (id: string, userId: string) => Promise<void>;
}

export const useEntryStore = create<EntryState>()(
  devtools(
    (set) => ({
      entries: [],
      isLoading: false,
      setEntries: (entries) => set({ entries, isLoading: false }),
      createEntry: async (content, primaryEmotion, secondaryEmotions, userId, tier) => {
        const entry = entryService.createEntry(content, primaryEmotion, secondaryEmotions, userId, tier);
        set((state) => ({ entries: [entry, ...state.entries] }));
        const context = buildAchievementContext(userId, entry);
        const results = achievementEngine.evaluateEntry(entry, context);
        const { addNotification } = useNotificationStore.getState();
        for (const r of results) addNotification(r);
        const waterResult = gardenService.waterGarden(userId, entry.createdAt.toISOString().slice(0, 10));
        if (waterResult.plantsAdvanced.some((p) => p.newStage === 'bloom')) {
          const gardenEvent = achievementEngine.evaluateGardenEvent({ type: 'first-bloom', seedEmotion: entry.primaryEmotion, userId });
          if (gardenEvent) addNotification(gardenEvent);
        }
        return entry;
      },
      editEntry: async (id, content, primaryEmotion, secondaryEmotions, userId, tier) => {
        const entry = entryService.editEntry(id, content, primaryEmotion, secondaryEmotions, userId, tier);
        set((state) => ({ entries: state.entries.map((e) => e.id === id ? entry : e) }));
        return entry;
      },
      deleteEntry: async (id, userId) => {
        entryService.deleteEntry(id, userId);
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
      },
    }),
    { name: 'entry-store', enabled: __DEV__ },
  ),
);
