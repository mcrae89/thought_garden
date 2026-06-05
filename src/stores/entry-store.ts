import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { entryService } from '@/modules/entries';
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
        const entry = await entryService.createEntry(content, primaryEmotion, secondaryEmotions, userId, tier);
        set((state) => ({ entries: [entry, ...state.entries] }));
        return entry;
      },
      editEntry: async (id, content, primaryEmotion, secondaryEmotions, userId, tier) => {
        const entry = await entryService.editEntry(id, content, primaryEmotion, secondaryEmotions, userId, tier);
        return entry;
      },
      deleteEntry: async (id, userId) => {
        await entryService.deleteEntry(id, userId);
      },
    }),
    { name: 'entry-store', enabled: __DEV__ },
  ),
);
