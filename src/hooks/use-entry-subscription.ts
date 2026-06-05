import { useEffect } from 'react';
import { entryService } from '@/modules/entries';
import { useEntryStore } from '@/stores/entry-store';

export function useEntrySubscription() {
  const setEntries = useEntryStore((s) => s.setEntries);
  useEffect(() => {
    entryService.getEntries({}).then(setEntries);
    const interval = setInterval(() => {
      entryService.getEntries({}).then(setEntries);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);
}
