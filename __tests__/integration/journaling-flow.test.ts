jest.mock('@/database', () => ({ db: {} }));
jest.mock('@/modules/entries', () => ({
  entryService: { createEntry: jest.fn() },
}));
jest.mock('@/modules/achievements', () => ({
  achievementEngine: { evaluateEntry: jest.fn() },
  buildAchievementContext: jest.fn(),
}));
jest.mock('@/modules/garden', () => ({
  gardenService: { waterGarden: jest.fn(), getGarden: jest.fn() },
}));

import { entryService } from '@/modules/entries';
import { achievementEngine, buildAchievementContext } from '@/modules/achievements';
import { gardenService } from '@/modules/garden';
import { useEntryStore } from '@/stores/entry-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { Entry } from '@/modules/entries';
import type { AchievementResult, AchievementContext } from '@/modules/achievements';

const mockEntry: Entry = {
  id: 'entry-1',
  userId: 'user-1',
  content: 'test content',
  primaryEmotion: 'happy',
  secondaryEmotions: [],
  wordCount: 2,
  createdAt: new Date('2024-06-15T10:00:00'),
  modifiedAt: null,
  isDeleted: false,
};

const mockContext: AchievementContext = {
  totalEntryCount: 1,
  emotionUsageCounts: new Map(),
  currentStreak: 0,
  lastEntryDate: null,
  consecutiveSameEmotionCount: 0,
  lastConsecutiveEmotion: null,
  hasFirstEntry: false,
  hasFirstMorningEntry: false,
  hasFirstEveningEntry: false,
  hasFirstWeekendEntry: false,
  hasFirstLongEntry: false,
  hasFirstSecondaryEmotion: false,
  hasFirstBloom: false,
  hasFilledGarden: false,
  hasAllEmotionPlants: false,
  uniqueEmotionsUsed: new Set(),
  lifetimeEmotionCounts: new Map(),
};

const mockAchievement: AchievementResult = {
  achievementKey: 'first_entry',
  achievementType: 'milestone',
  seedEmotion: 'happy',
};

beforeEach(() => {
  jest.clearAllMocks();
  useNotificationStore.getState().clearAll();
});

describe('Journaling flow integration', () => {
  it('createEntry → evaluateEntry → notifications → waterGarden', async () => {
    (entryService.createEntry as jest.Mock).mockReturnValue(mockEntry);
    (buildAchievementContext as jest.Mock).mockReturnValue(mockContext);
    (achievementEngine.evaluateEntry as jest.Mock).mockReturnValue([mockAchievement]);
    (gardenService.waterGarden as jest.Mock).mockReturnValue({ plantsWatered: 1, plantsAdvanced: [] });

    const result = await useEntryStore.getState().createEntry(
      'test content', 'happy', [], 'user-1', 'free',
    );

    expect(entryService.createEntry).toHaveBeenCalledWith('test content', 'happy', [], 'user-1', 'free');
    expect(buildAchievementContext).toHaveBeenCalledWith('user-1', mockEntry);
    expect(achievementEngine.evaluateEntry).toHaveBeenCalledWith(mockEntry, mockContext);
    expect(useNotificationStore.getState().notifications).toEqual([mockAchievement]);
    expect(gardenService.waterGarden).toHaveBeenCalledWith('user-1', '2024-06-15');
    expect(result).toBe(mockEntry);
  });

  it('no achievements earned → no notifications, waterGarden still called', async () => {
    (entryService.createEntry as jest.Mock).mockReturnValue(mockEntry);
    (buildAchievementContext as jest.Mock).mockReturnValue(mockContext);
    (achievementEngine.evaluateEntry as jest.Mock).mockReturnValue([]);
    (gardenService.waterGarden as jest.Mock).mockReturnValue({ plantsWatered: 0, plantsAdvanced: [] });

    await useEntryStore.getState().createEntry('test content', 'happy', [], 'user-1', 'free');

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(gardenService.waterGarden).toHaveBeenCalled();
  });

  it('calls services in correct order', async () => {
    const callOrder: string[] = [];
    (entryService.createEntry as jest.Mock).mockImplementation(() => {
      callOrder.push('createEntry');
      return mockEntry;
    });
    (buildAchievementContext as jest.Mock).mockImplementation(() => {
      callOrder.push('buildContext');
      return mockContext;
    });
    (achievementEngine.evaluateEntry as jest.Mock).mockImplementation(() => {
      callOrder.push('evaluateEntry');
      return [];
    });
    (gardenService.waterGarden as jest.Mock).mockImplementation(() => {
      callOrder.push('waterGarden');
      return { plantsWatered: 0, plantsAdvanced: [] };
    });

    await useEntryStore.getState().createEntry('test', 'happy', [], 'user-1', 'free');

    expect(callOrder).toEqual(['createEntry', 'buildContext', 'evaluateEntry', 'waterGarden']);
  });
});
