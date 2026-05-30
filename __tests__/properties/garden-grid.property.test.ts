// Feature: thought-garden, Property 15: Garden grid size by tier
jest.mock('@/database', () => ({ database: {} }));

import { getMaxPlots, getMaxGreenhouse } from '@/modules/garden/garden-service';

describe('Property 15: Garden grid size by tier', () => {
  it('should return 9 plots for free tier', () => {
    expect(getMaxPlots('free')).toBe(9);
  });

  it('should return 25 plots for paid tier', () => {
    expect(getMaxPlots('paid')).toBe(25);
  });

  it('should return 3 greenhouse slots for free tier', () => {
    expect(getMaxGreenhouse('free')).toBe(3);
  });

  it('should return 10 greenhouse slots for paid tier', () => {
    expect(getMaxGreenhouse('paid')).toBe(10);
  });
});
