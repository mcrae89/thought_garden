# Issues to Fix

## Bugs

- [x] Garden store doesn't update local state after mutations (plantSeed, movePlant, moveToGreenhouse, etc.) — UI waits for 30s poll
- [x] Entry store doesn't update list after edit/delete
- [x] `revertToSeed` uses `plant.seed_id` as `source_achievement_id` — should look up original seed's achievement ID
- [x] `generateId()` uses `Math.random()` — replace with `expo-crypto` `Crypto.randomUUID()`
- [x] Mailbox sprite sheet is never animated (no frame offset logic)

## Performance

- [x] TilemapRenderer re-renders all tiles on every state change — wrap in `React.memo` and memoize tiles
- [x] Three independent 30s polling intervals — switch to event-driven updates after mutations
- [x] Inline styles in garden index create new objects every render — move to `StyleSheet.create`

## Architecture

- [x] Async wrappers over synchronous SQLite calls — go fully sync or use async APIs
- [x] No error handling in UI (JournalPanel, garden actions) — add try/catch + user feedback
- [x] `useAuthInit` has no loading state — causes login screen flash on authenticated launch
- [x] No `"test": "jest"` script in package.json

## Security

- [x] Email sign-in restricted to `__DEV__` but sign-up is not — make consistent
- [ ] Account lockout is client-side only (SecureStore) — acceptable for UX, not a real security control
