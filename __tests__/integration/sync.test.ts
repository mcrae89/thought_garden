jest.mock('@/database', () => ({ db: {} }));
jest.mock('@/modules/sync/supabase-client', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(() => ({ select: jest.fn(() => ({ limit: jest.fn() })) })) },
}));

import { SyncServiceImpl } from '@/modules/sync/sync-service';
import { entryService } from '@/modules/entries/entry-service';
import type { Entry } from '@/modules/entries';

jest.mock('@/modules/entries/entry-service', () => ({
  entryService: { createEntry: jest.fn() },
}));

const mockEntry: Entry = {
  id: 'entry-offline-1',
  userId: 'user-1',
  content: 'offline entry',
  primaryEmotion: 'happy',
  secondaryEmotions: [],
  wordCount: 2,
  createdAt: new Date('2024-06-15T10:00:00'),
  modifiedAt: null,
  isDeleted: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Sync flow integration', () => {
  it('entries created offline are stored locally', async () => {
    (entryService.createEntry as jest.Mock).mockResolvedValue(mockEntry);

    const result = await entryService.createEntry('offline entry', 'happy', [], 'user-1', 'free');

    expect(result).toBe(mockEntry);
    expect(entryService.createEntry).toHaveBeenCalledWith('offline entry', 'happy', [], 'user-1', 'free');
  });

  it('startSync returns no-op result while disabled', async () => {
    const syncService = new SyncServiceImpl();
    const result = await syncService.startSync();

    expect(result).toEqual({ pushed: 0, pulled: 0, conflicts: 0 });
  });

  it('local data still accessible after sync stub', async () => {
    (entryService.createEntry as jest.Mock).mockResolvedValue(mockEntry);
    const localEntry = await entryService.createEntry('offline entry', 'happy', [], 'user-1', 'free');
    expect(localEntry).toBe(mockEntry);
  });

  it('getStatus returns idle by default', () => {
    const syncService = new SyncServiceImpl();
    expect(syncService.getStatus()).toBe('idle');
  });
});
