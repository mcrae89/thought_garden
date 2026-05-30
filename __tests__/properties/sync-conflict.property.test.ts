import fc from 'fast-check';
import { resolveConflict } from '@/modules/sync/conflict-resolution';

/**
 * Feature: thought-garden, Property 27: Sync conflict resolution by timestamp
 */
describe('Property 27: Sync conflict resolution by timestamp', () => {
  const recordArb = fc.record({
    id: fc.uuid(),
    last_modified_at: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  });

  it('should prefer local when local timestamp is newer', () => {
    fc.assert(
      fc.property(recordArb, fc.integer({ min: 1, max: 100_000 }), (base, offset) => {
        const local = { ...base, last_modified_at: base.last_modified_at + offset };
        const remote = { ...base };

        const result = resolveConflict(local, remote);

        expect(result).toEqual(local);
      }),
      { numRuns: 100 },
    );
  });

  it('should prefer remote when remote timestamp is newer', () => {
    fc.assert(
      fc.property(recordArb, fc.integer({ min: 1, max: 100_000 }), (base, offset) => {
        const local = { ...base };
        const remote = { ...base, last_modified_at: base.last_modified_at + offset };

        const result = resolveConflict(local, remote);

        expect(result).toEqual(remote);
      }),
      { numRuns: 100 },
    );
  });

  it('should prefer local on equal timestamps (local wins on tie)', () => {
    fc.assert(
      fc.property(recordArb, (base) => {
        const local = { ...base, source: 'local' };
        const remote = { ...base, source: 'remote' };

        const result = resolveConflict(local, remote);

        expect(result.source).toBe('local');
      }),
      { numRuns: 100 },
    );
  });
});
