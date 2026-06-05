import { useEffect } from 'react';
import { db } from '@/database';
import { useSeedStore } from '@/stores/seed-store';
import type { SeedData } from '@/stores/seed-store';

export function useSeedSubscription() {
  const setSeeds = useSeedStore((s) => s.setSeeds);
  useEffect(() => {
    const load = () => {
      const rows = db.getAllSync<SeedData>('SELECT * FROM seeds WHERE is_planted = 0');
      setSeeds(rows);
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);
}
