import { useEffect } from 'react';
import { gardenService } from '@/modules/garden';
import { useGardenStore } from '@/stores/garden-store';

export function useGardenSubscription(userId: string) {
  const setPlants = useGardenStore((s) => s.setPlants);
  useEffect(() => {
    if (!userId) return;
    gardenService.getGarden(userId).then(setPlants);
    const interval = setInterval(() => {
      gardenService.getGarden(userId).then(setPlants);
    }, 30_000);
    return () => clearInterval(interval);
  }, [userId]);
}
