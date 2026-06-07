import { useEffect } from 'react';
import { gardenService } from '@/modules/garden';
import { useGardenStore } from '@/stores/garden-store';

export function useGardenSubscription(userId: string) {
  const setPlants = useGardenStore((s) => s.setPlants);
  useEffect(() => {
    if (!userId) return;
    setPlants(gardenService.getGarden(userId));
  }, [userId]);
}
