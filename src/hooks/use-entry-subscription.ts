import { useEffect } from 'react';
import { entryService } from '@/modules/entries';
import { useEntryStore } from '@/stores/entry-store';

export function useEntrySubscription() {
  const setEntries = useEntryStore((s) => s.setEntries);
  useEffect(() => {
    setEntries(entryService.getEntries({}));
  }, []);
}
