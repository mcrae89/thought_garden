import { useEffect } from 'react';
import { entryService } from '@/modules/entries';
import { useEntryStore } from '@/stores/entry-store';
import { useAuthStore } from '@/stores/auth-store';

export function useEntrySubscription() {
  const setEntries = useEntryStore((s) => s.setEntries);
  const userId = useAuthStore((s) => s.session?.userId ?? '');
  useEffect(() => {
    if (userId) setEntries(entryService.getEntries({ userId }));
  }, [userId]);
}
