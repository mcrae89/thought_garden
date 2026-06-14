// Feature: thought-garden, Property 15: Garden grid size by tier
jest.mock('@/database', () => ({ database: {} }));

import { getMaxGreenhouse } from '@/modules/garden/garden-service';

describe('Property 15: Garden capacity by tier', () => {
  it('should return 3 greenhouse slots for free tier', () => {
    expect(getMaxGreenhouse('free')).toBe(3);
  });

  it('should return 10 greenhouse slots for paid tier', () => {
    expect(getMaxGreenhouse('paid')).toBe(10);
  });
});
