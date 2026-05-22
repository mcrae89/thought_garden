# Thought Garden — Task Tracker

## ✅ Completed

### Infrastructure
- [x] pnpm workspace monorepo scaffold (`pnpm-workspace.yaml`, root `package.json`)
- [x] `packages/core` (`@tg/core`) — types, constants, services
- [x] `packages/ui` (`@tg/ui`) — shared RN components
- [x] `packages/supabase` (`@tg/supabase`) — Supabase client + type placeholder
- [x] `apps/mobile` — Expo Router app skeleton
- [x] All packages typecheck clean

### Database
- [x] Initial schema migration (all 8 tables, RLS policies, `gen_random_uuid()`)
- [x] Supabase project created and linked (`vssdlugozocnjbrjjkla`)
- [x] Migration pushed to remote
- [x] Env vars configured (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`)

### Core Logic (`@tg/core`)
- [x] Plant taxonomy (25 species, themes, rare flags)
- [x] Mood definitions (15 moods, families, color hints)
- [x] Milestone definitions + `checkMilestone()` logic
- [x] `analyzeEntry()` — abstracted provider interface
- [x] `xenovaProvider` — on-device NLP (zero-shot mood + theme, sentiment intensity) — **stubbed in mobile bundle** (import.meta incompatible with Metro); falls back to manual mood selection. Post-MVP: native module.
- [x] `detectCrisisLanguage()` — crisis pattern detection
- [x] `waterPlant()` / `computeGrowthStage()` — growth logic
- [x] `computeStreak()` — streak calculation
- [x] `useGardenStore` — Zustand store (plants, seeds, config)

### Screens & UI
- [x] Tab layout (Garden, Journal, Greenhouse, Profile)
- [x] `entry/new.tsx` — write → NLP analysis → mood confirm flow
- [x] Crisis screen — warm message + 988 link, suppresses rewards
- [x] Garden screen — responsive grid, tap-to-plant, long-press options
- [x] `PlantSprite` — growth stage visuals (emoji placeholder, ready for sprites)
- [x] `GardenPlot` — single cell component
- [x] `SeedPicker` — bottom sheet modal
- [x] `PlantOptions` — move to greenhouse action sheet
- [x] `Button` component (`@tg/ui`)
- [x] `MoodPicker` component (`@tg/ui`)

---

## 🔲 Remaining

### Auth
- [x] Auth layout + session listener (redirect to tabs on sign-in)
- [x] Login screen (email + password)
- [x] Register screen (email + password)
- [x] Auto-create `profiles` + `garden_configs` row on first sign-up
- [x] Sign out

### Data Persistence
- [x] Generate Supabase TypeScript types (`supabase gen types`)
- [x] Save entry to Supabase on submit
- [x] Run milestone checks on entry save → award seeds
- [x] Persist seeds + plants to Supabase
- [x] Load garden state from Supabase on app open
- [x] Streak log — write one row per day, compute streak on load

### Journal Screen
- [x] Entry list (reverse chronological)
- [x] Entry detail screen (`entry/[id].tsx`)

### Greenhouse Screen
- [x] Grid/list of potted plants + unplanted seeds
- [x] Move plant back to garden
- [x] Capacity enforcement (free tier: 10)

### Garden Screen
- [x] Load real config (grid size, tier) from Supabase
- [x] Drag-to-reposition plants
- [x] Bloom animation on stage 3 unlock

### Profile Screen
- [x] Streak display
- [x] Stats (total entries, plants grown, seeds earned)
- [x] Sign out button

### Onboarding
- [x] Disclaimer screen (not a therapy replacement)
- [x] Persistent 988 crisis link in app

### Post-MVP
- [ ] WatermelonDB offline-first sync
- [ ] Voice entries
- [ ] OpenAI analysis provider (paid tier)
- [ ] Shared/public gardens
- [ ] Web app (Next.js + Vercel)
- [ ] Full plant sprite artwork
- [ ] Full color variants per mood
- [ ] Admin web dashboard (stats, tier management, feature flags)
- [ ] Admin role RLS policies (migration ready, UI post-MVP)
- [ ] Crisis detection audit log
