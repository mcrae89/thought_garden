import { syncService } from './sync-service';

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Single shared debounced sync scheduler.
 * All stores use this instead of independent timers.
 */
export function debouncedSync(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncService.scheduleSync();
  }, 2000);
}
