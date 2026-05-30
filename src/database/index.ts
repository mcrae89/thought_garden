import { Database } from '@nozbe/watermelondb';
import { Platform } from 'react-native';
import { schema } from './schema';
import { migrations } from './migrations';
import { Entry } from './models/entry.model';
import { EntryEmotion } from './models/entry-emotion.model';
import { Seed } from './models/seed.model';
import { Plant } from './models/plant.model';
import { AchievementRecord } from './models/achievement-record.model';
import { UserStats } from './models/user-stats.model';

const modelClasses = [Entry, EntryEmotion, Seed, Plant, AchievementRecord, UserStats];

function createAdapter() {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LokiJSAdapter } = require('@nozbe/watermelondb/adapters/lokijs');
    return new LokiJSAdapter({ schema, migrations, useWebWorker: false, useIncrementalIndexedDB: true });
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { SQLiteAdapter } = require('@nozbe/watermelondb/adapters/sqlite');
  return new SQLiteAdapter({ schema, migrations });
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses,
});
