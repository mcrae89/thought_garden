# Implementation Plan: Thought Garden

## Overview

This plan implements the Thought Garden journaling app using React Native + Expo (v56), Supabase for backend/auth, WatermelonDB for local-first storage, and Zustand for state management. Tasks are ordered to build foundational layers first (types, database, auth), then core business logic (entries, achievements, garden), then UI and integration, with property-based tests validating correctness throughout.

**Note:** Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any Expo-related code.

## Tasks

- [x] 1. Set up project structure, core types, and database schema
  - [x] 1.1 Initialize Expo project and install dependencies
    - Initialize a new Expo project with TypeScript template
    - Install dependencies: `@nozbe/watermelondb`, `zustand`, `@supabase/supabase-js`, `expo-router`, `expo-crypto`, `expo-image`, `expo-secure-store`, `expo-auth-session`, `expo-web-browser`, `fast-check` (dev), `jest` (dev), `ts-jest` (dev)
    - Configure `tsconfig.json`, `babel.config.js` for WatermelonDB decorators
    - Set up directory structure: `src/`, `src/modules/`, `src/shared/`, `src/database/`, `src/components/`, `src/screens/`
    - _Requirements: All (project foundation)_

  - [x] 1.2 Define core type definitions and constants
    - Create `src/shared/types.ts` with the `EMOTIONS` array, `Emotion` type, `GrowthStage`, `Tier`, `GROWTH_STAGE_ORDER`, `NEXT_STAGE`, `TIER_LIMITS`
    - Create `src/shared/result.ts` with `AppError`, `Result<T>`, `AuthError`, `AuthErrorCode` types
    - Define module interfaces in respective `index.ts` files: `EntryService`, `AchievementEngine`, `GardenService`, `AuthService`, `SyncService`
    - _Requirements: 2.2, 5.2, 5.3, 6.2, 7.1, 8.3, 8.4_

  - [x] 1.3 Implement WatermelonDB schema and models
    - Create `src/database/schema.ts` with the full WatermelonDB schema (entries, entry_emotions, seeds, plants, achievement_records, user_stats)
    - Create WatermelonDB model classes in `src/database/models/`: `entry.model.ts`, `entry-emotion.model.ts`, `seed.model.ts`, `plant.model.ts`, `achievement-record.model.ts`, `user-stats.model.ts`
    - Create `src/database/index.ts` to initialize the database instance with platform-specific adapters
    - _Requirements: 2.8, 9.1_

  - [x] 1.4 Set up Supabase client and SQL schema
    - Create `src/modules/sync/supabase-client.ts` with Supabase client initialization
    - Create `supabase/migrations/001_initial_schema.sql` with all tables, constraints, indexes, and RLS policies as defined in the design
    - _Requirements: 9.1, 10.1, 10.2, 10.3_

- [x] 2. Implement authentication module
  - [x] 2.1 Implement AuthService
    - Create `src/modules/auth/auth-service.ts` implementing the `AuthService` interface
    - Implement `signInWithEmail` for dev environment using Supabase email/password auth
    - Implement `signInWithOAuth` for production using device-native OAuth (Apple/Google) via `expo-auth-session`
    - Implement failed attempt tracking with 5-attempt lockout for 15 minutes using `expo-secure-store`
    - Implement session persistence across app restarts using secure storage
    - Implement offline session validation using locally cached session data
    - Implement `signOut` that clears unencrypted local data within 5 seconds
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 10.5_

  - [x]* 2.2 Write property test for account lockout (Property 29)
    - **Property 29: Account lockout threshold**
    - Test that account locks if and only if 5 consecutive failures occur, lockout lasts 15 minutes
    - **Validates: Requirements 1.5**

  - [x]* 2.3 Write unit tests for authentication
    - Test successful email login, OAuth login
    - Test error messages for invalid credentials, network unavailable, account not found
    - Test session persistence across restarts
    - Test offline access with valid/invalid local session
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8_

- [x] 3. Implement journal entry module
  - [x] 3.1 Implement EntryService - create entry
    - Create `src/modules/entries/entry-service.ts` implementing `EntryService`
    - Implement `createEntry` with content validation (1-10,000 chars, non-whitespace required)
    - Implement emotion validation (exactly 1 primary from 30-set, optional secondaries excluding primary)
    - Implement free-tier daily limit check (1 entry per calendar day in device local timezone)
    - Implement word count calculation and storage
    - Store entry with emotions, timestamp, and user identifier in WatermelonDB
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x]* 3.2 Write property test for entry content validation (Property 1)
    - **Property 1: Entry content validation**
    - Generate random strings to verify accept/reject logic for content length and whitespace rules
    - **Validates: Requirements 2.1, 2.7**

  - [x]* 3.3 Write property test for emotion selection validation (Property 2)
    - **Property 2: Emotion selection validation**
    - Generate random emotion sets to verify primary/secondary emotion rules
    - **Validates: Requirements 2.2, 2.3, 3.1**

  - [x]* 3.4 Write property test for free tier daily limit (Property 3)
    - **Property 3: Free tier daily entry limit**
    - Generate random dates and tier combinations to verify daily limit enforcement
    - **Validates: Requirements 2.4, 2.5, 2.6**

  - [x]* 3.5 Write property test for entry persistence round-trip (Property 4)
    - **Property 4: Entry persistence round-trip**
    - Generate random valid entries and verify read-back returns identical data
    - **Validates: Requirements 2.8**

  - [x] 3.6 Implement EntryService - edit and delete
    - Implement `editEntry` preserving original `created_at`, adding `modified_at`
    - Implement `deleteEntry` with soft-delete (mark `is_deleted`), preserving earned seeds/achievements
    - Ensure editing primary emotion does NOT modify previously earned seed emotion types
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x]* 3.7 Write property test for entry edit timestamps (Property 5)
    - **Property 5: Entry edit preserves creation timestamp**
    - Generate random entries with edits, verify `created_at` unchanged and `modified_at` set
    - **Validates: Requirements 3.2**

  - [x]* 3.8 Write property test for seed immutability (Property 6)
    - **Property 6: Seed immutability**
    - Generate random seeds then modify/delete source entries, verify seed emotion/color unchanged
    - **Validates: Requirements 3.4, 3.5, 4.23, 7.2**

- [x] 4. Checkpoint - Core entry logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement achievement engine
  - [x] 5.1 Implement achievement evaluation core
    - Create `src/modules/achievements/achievement-engine.ts` implementing `AchievementEngine`
    - Implement `AchievementContext` builder that gathers user stats from WatermelonDB
    - Implement tiebreaker logic: when emotions are tied in frequency, select the most recently used
    - Implement `evaluateEntry` that checks all achievement conditions and returns `AchievementResult[]`
    - Award seeds atomically for each triggered achievement
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Implement one-time entry achievements
    - First entry (1st), milestone entries (10th, 50th, 100th)
    - First use of each emotion as Primary_Emotion
    - All 30 emotions used achievement
    - First long entry (200+ words)
    - First entry with secondary emotions
    - _Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [x] 5.3 Implement time-based and garden achievements
    - Morning (05:00-11:59), Evening (18:00-23:59), Weekend achievements
    - First bloom, full garden, all 30 emotion plants grown (via `evaluateGardenEvent`)
    - _Requirements: 4.12, 4.13, 4.14, 4.15, 4.16, 4.17_

  - [x] 5.4 Implement repeatable achievements
    - Streak achievements (3, 7, 14, 30 days) with streak calculation
    - Streak reset after 30+ days of inactivity
    - Returning achievement (7+ day gap)
    - Consistent theme (5 consecutive same primary emotion)
    - Emotion milestones (10, 25, 50 entries per emotion)
    - _Requirements: 4.18, 4.19, 4.20, 4.21, 4.22_

  - [x]* 5.5 Write property test for achievement awards (Property 7)
    - **Property 7: Achievement engine awards correct seeds**
    - Generate random actions triggering 1-N achievements, verify exactly N seeds awarded
    - **Validates: Requirements 4.1, 4.4**

  - [x]* 5.6 Write property test for tiebreaker (Property 8)
    - **Property 8: Emotion frequency tiebreaker**
    - Generate random emotion histories with ties, verify most recent is selected
    - **Validates: Requirements 4.5**

  - [x]* 5.7 Write property test for first-time emotion (Property 9)
    - **Property 9: First-time emotion achievement**
    - Generate random emotion sequences, verify first use triggers award and subsequent uses don't
    - **Validates: Requirements 4.8**

  - [x]* 5.8 Write property test for streak calculation (Property 10)
    - **Property 10: Streak calculation correctness**
    - Generate random date sequences, verify streak count and achievement triggers at 3/7/14/30
    - **Validates: Requirements 4.18**

  - [x]* 5.9 Write property test for streak reset (Property 11)
    - **Property 11: Streak reset after inactivity**
    - Generate random gaps, verify reset at 30+ days and no reset below 30
    - **Validates: Requirements 4.19**

  - [x]* 5.10 Write property test for returning achievement (Property 12)
    - **Property 12: Returning achievement**
    - Generate random gap durations, verify trigger at 7+ days
    - **Validates: Requirements 4.20**

  - [x]* 5.11 Write property test for consistent theme (Property 13)
    - **Property 13: Consistent theme achievement**
    - Generate random emotion sequences, verify trigger at exactly 5 consecutive same emotion
    - **Validates: Requirements 4.21**

  - [x]* 5.12 Write property test for emotion milestone (Property 14)
    - **Property 14: Emotion milestone achievement**
    - Generate random entry counts per emotion, verify triggers at 10/25/50
    - **Validates: Requirements 4.22**

  - [x]* 5.13 Write unit tests for one-time achievements
    - Test each one-time achievement trigger and non-re-trigger
    - Test achievement persistence after entry deletion
    - _Requirements: 4.6-4.17, 4.23_

- [x] 6. Checkpoint - Achievement engine
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement garden and plant management
  - [x] 7.1 Implement GardenService - planting and movement
    - Create `src/modules/garden/garden-service.ts` implementing `GardenService`
    - Implement `plantSeed`: remove seed from inventory, create plant at plot, set growth stage to 'seed'
    - Implement `movePlant`: move plant to empty plot, reject if target occupied
    - Implement garden grid size enforcement by tier (9 for free, 25 for paid)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 7.2 Implement watering and growth engine
    - Implement `waterGarden`: advance all garden plants by at most one stage per calendar day
    - Enforce first-watering-of-day rule (only first entry per day triggers growth)
    - Ensure plants at bloom remain at bloom
    - Ensure late-planted seeds wait for next day's watering
    - Plants never die, wilt, or degrade
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.3 Implement greenhouse operations
    - Implement `moveToGreenhouse`: place plant in stasis, enforce capacity (3 free / 10 paid)
    - Implement `moveFromGreenhouse`: resume plant at stored stage, require empty plot
    - Implement `revertToSeed`: remove plant, add seed of same emotion to inventory
    - Handle full greenhouse: reject with capacity error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x]* 7.4 Write property test for garden grid size (Property 15)
    - **Property 15: Garden grid size by tier**
    - Generate random tier values, verify correct plot count
    - **Validates: Requirements 5.2, 5.3**

  - [x]* 7.5 Write property test for planting (Property 16)
    - **Property 16: Planting transfers seed to garden**
    - Generate random seeds and plot states, verify seed removed from inventory and plant created
    - **Validates: Requirements 5.4, 5.7**

  - [x]* 7.6 Write property test for plant movement (Property 17)
    - **Property 17: Plant movement preserves state**
    - Generate random plants and target plots, verify state preservation and occupied-plot rejection
    - **Validates: Requirements 5.5, 5.8**

  - [x]* 7.7 Write property test for watering (Property 18)
    - **Property 18: Watering advances all garden plants**
    - Generate random garden states and dates, verify all plants watered and max one stage per day
    - **Validates: Requirements 6.1, 6.2**

  - [x]* 7.8 Write property test for growth monotonicity (Property 19)
    - **Property 19: Growth stage monotonicity**
    - Generate random operation sequences on plants, verify stage never decreases
    - **Validates: Requirements 6.3, 6.4**

  - [x]* 7.9 Write property test for late planting (Property 20)
    - **Property 20: Late-planted seeds wait for next watering**
    - Generate random planting times relative to watering, verify seed stays at 'seed' stage
    - **Validates: Requirements 6.5**

  - [x]* 7.10 Write property test for greenhouse stasis (Property 24)
    - **Property 24: Greenhouse stasis**
    - Generate random plants with watering sequences while in greenhouse, verify no growth
    - **Validates: Requirements 8.1, 8.2**

  - [x]* 7.11 Write property test for greenhouse capacity (Property 25)
    - **Property 25: Greenhouse capacity by tier**
    - Generate random tier + plant counts, verify capacity enforcement
    - **Validates: Requirements 8.3, 8.4**

  - [x]* 7.12 Write property test for revert-to-seed (Property 26)
    - **Property 26: Revert-to-seed preserves emotion**
    - Generate random plants reverted, verify seed emotion matches plant emotion
    - **Validates: Requirements 8.6**

- [x] 8. Checkpoint - Garden and growth logic
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement plant visual system
  - [x] 9.1 Implement emotion-to-species mapping and color variation
    - Create `src/modules/plant-visuals/plant-visual-service.ts` implementing `PlantVisualService`
    - Define the 30-emotion to plant species mapping as a constant lookup (per Emotion-to-Plant Mapping table in requirements)
    - Implement color variation determination from first secondary emotion
    - Implement default color palette fallback when no secondary emotions exist
    - Define 30 emotion-specific color palettes in `src/modules/plant-visuals/emotion-palettes.ts`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 9.2 Implement sprite rendering and palette swap system
    - Implement `getPlantSprite` to return correct sprite frame for emotion + stage + color
    - Implement `applyPaletteSwap` for runtime color replacement in `src/modules/plant-visuals/palette-swap.ts`
    - Ensure visual consistency across sprout, full, and bloom stages (same species/color, different form). Seed stage uses shared seed_planted.png.
    - Set up asset file structure for sprite sheets (`assets/sprites/plants/`)
    - _Requirements: 7.1, 7.5, 7.6_

  - [x]* 9.3 Write property test for emotion-species bijection (Property 21)
    - **Property 21: Emotion-to-species bijection**
    - Verify all emotion pairs map to distinct species and mapping is deterministic
    - **Validates: Requirements 7.1, 7.5**

  - [x]* 9.4 Write property test for color variation (Property 22)
    - **Property 22: Color variation determination**
    - Generate random entries with varying secondary emotions, verify correct color determination
    - **Validates: Requirements 7.3, 7.4**

  - [x]* 9.5 Write property test for visual consistency (Property 23)
    - **Property 23: Visual consistency across growth stages**
    - Generate random plants across all stages, verify species and color unchanged
    - **Validates: Requirements 7.6**

  - [x] 9.6 Generate plant sprites using Microsoft Copilot
    - Use the prompt templates below to generate sprites for all 30 plant species via Microsoft Copilot (DALL-E 3)
    - **Step 1 — Style reference sheet (do this first, one time):**
      Upload `assets/sprites/objects/Farming Plants.png` as reference in Copilot and generate the potted sunflower 3-stage sprite sheet (sprout, full, bloom). Then in Piskel, erase the pot pixels on all 3 frames to create the planted variant. The seed stage is handled by the single shared seed_planted.png sprite.
      See `sprite-generation-prompts.md` for exact prompts and filenames.
    - **Step 2 — Generate each remaining plant (29 plants, one Copilot prompt each):**
      Generate the potted variant via Copilot, then derive the planted variant in Piskel by erasing the pot pixels. The garden renderer overlays the planted sprite on a Sprout Lands tilled dirt tile.
      See `sprite-generation-prompts.md` for all prompts and filenames.
    - **Step 3 — Derive planted variant in Piskel:**
      For each potted sprite sheet: open in Piskel (piskelapp.com) or LibreSprite, erase the pot pixels on all 3 frames, save as the planted variant filename.
    - **Emotion-to-plant reference for prompts:**
      happy=Sunflower, sad=Bleeding Heart, angry=Cactus, anxious=Passionflower, calm=Lavender, grateful=Hydrangea, love=Rose, hope=Daffodil, excited=Bird of Paradise, lonely=Forget-Me-Not, proud=Orchid, confused=Wisteria, peaceful=Lotus, nostalgic=Cherry Blossom, jealous=Nightshade, inspired=Iris, guilty=Thistle, curious=Snapdragon, frustrated=Bramble, content=Chamomile, overwhelmed=Morning Glory, brave=Protea, embarrassed=Mimosa, surprised=Stargazer Lily, bored=Dandelion, determined=Gladiolus, compassionate=Aloe Vera, melancholy=Bluebell, joyful=Daisy, vulnerable=Snowdrop
  - [x] 9.7 Assemble garden tilemaps using Tiled
    - Tilesets to use: `Tilled_Dirt_v2.png` (plots), `Grass_tiles_v2.png` (ground), `Fences.png` (perimeter), `signs.png` (interactive objects)
    - Structures: greenhouse building tiles from `structures/`
    - All maps use 16x16 tile size (native Sprout Lands size — rendered at 2x scale in the app)
    - **Map layout (20x28 tiles):** same base for both tiers, only the tilled plot area differs
      ```
      . = grass    # = tilled plot    F = fence
      G = greenhouse building         ~ = path
      C = chest (seed storage)        M = mailbox (notifications)
      S = sign (settings/profile)     T = tree/decoration

      col:  0         9        19
            01234567890123456789
      r00:  ....................
      r01:  ..T..........T..T..
      r02:  ..T...GGGGGG.T..T..
      r03:  ....GGGGGGGGGG.....
      r04:  ....GGGGGGGGGG.....
      r05:  ....GGGGGGGGGG.....
      r06:  ....GG......GG.....
      r07:  .......~~~~........
      r08:  ..T....~~~~....T...
      r09:  .....FFFFFFFF......
      r10:  .....F######F......
      r11:  .....F######F......
      r12:  .....F######F......
      r13:  .....F######F......
      r14:  .....F######F......
      r15:  .....FFFFFFFF......
      r16:  .......~~~~........
      r17:  .......~~~~........
      r18:  ..C....~~~~....M...
      r19:  .......~~~~........
      r20:  .......~~~~..S.....
      r21:  ..T..........T.....
      r22:  ..T..........T.....
      r23:  ..T..........T.....
      r24:  ....................
      r25:  ....................
      r26:  ....................
      r27:  ....................
      ```
    - **Free tier**: tilled plots cover center 3x3 of the fenced area (rows 10-12, cols 6-8)
    - **Paid tier**: tilled plots cover full 5x5 fenced area (rows 10-14, cols 6-10)
    - **Do NOT place interactive objects in the tilemap** — leave those tiles as grass. They are rendered as separate sprites in code:
    - Interactive objects (tapped by user to open panels):
      - Chest (C) -> seed inventory
      - Greenhouse building (G) -> plant storage panel
      - Mailbox (M) -> notifications
      - Sign (S) -> settings/profile
    - Export free tier as `assets/tiles/garden-map-free.json`, paid tier as `assets/tiles/garden-map-paid.json`
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 10. Implement sync service and offline support
  - [x] 10.1 Implement SyncService
    - Create `src/modules/sync/sync-service.ts` implementing `SyncService`
    - Implement WatermelonDB sync protocol with Supabase (push/pull)
    - Implement connectivity monitoring with auto-sync within 30 seconds of reconnection
    - Implement conflict resolution: last-write-wins by device-generated timestamp
    - Implement retry logic: 3 attempts with exponential backoff, retain local data on failure
    - Display sync status indicator to user
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 10.2 Implement local data encryption
    - Implement AES-256-GCM encryption for local WatermelonDB data using `react-native-quick-crypto`
    - Ensure all cloud communication uses TLS (Supabase default)
    - Implement secure data cleanup on logout (remove unencrypted data within 5 seconds)
    - _Requirements: 9.5, 10.1, 10.2, 10.5_

  - [x]* 10.3 Write property test for sync conflict resolution (Property 27)
    - **Property 27: Sync conflict resolution by timestamp**
    - Generate random conflicting records with timestamps, verify most recent wins
    - **Validates: Requirements 9.4**

  - [x]* 10.4 Write property test for user data isolation (Property 28)
    - **Property 28: User data isolation**
    - Generate random user pairs with data, verify no cross-user access
    - **Validates: Requirements 10.3**

  - [x] 10.5 Implement Supabase pull_changes / push_changes RPC functions
    - Create `supabase/migrations/002_sync_rpcs.sql` with `pull_changes` and `push_changes` Postgres functions
    - `pull_changes(last_pulled_at, schema_version)` returns changed records since last sync per table
    - `push_changes(changes, last_pulled_at)` upserts local changes to each table
    - Apply RLS policies to RPC functions (SECURITY DEFINER with auth.uid() scoping)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 10.6 Link Supabase project to codebase and configure environment
    - Verify `.env` file (gitignored) has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` from the Supabase dashboard (Settings → API)
    - Add `.env` to `.gitignore` explicitly (currently only `.env*.local` is listed)
    - Verify `app.config.ts` reads `.env` values and exposes them via `extra` config
    - Verify `src/config/env.ts` correctly reads the values via `Constants.expoConfig?.extra`
    - Run the SQL migrations (`001_initial_schema.sql` and `002_sync_rpcs.sql`) against the Supabase project database
    - Enable Email/Password provider in Supabase dashboard (Authentication → Providers → Email → toggle on, disable email confirmation for dev)
    - Add redirect URL `thought-garden://auth` in Supabase dashboard (Authentication → URL Configuration)
    - _Requirements: 1.1, 1.2, 9.1, 10.2_

- [x] 11. Checkpoint - Backend services complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement state management and UI screens
  - [x] 12.1 Implement Zustand stores
    - Create `src/stores/auth-store.ts` for authentication state
    - Create `src/stores/entry-store.ts` for journal entry state and operations
    - Create `src/stores/garden-store.ts` for garden, plants, and greenhouse state
    - Create `src/stores/seed-store.ts` for seed inventory state
    - Create `src/stores/notification-store.ts` for achievement notifications
    - Wire stores to WatermelonDB reactive subscriptions
    - _Requirements: All (state layer)_

  - [x] 12.2 Implement navigation and screen structure
    - Set up Expo Router file-based routing in `app/` (refer to https://docs.expo.dev/versions/v56.0.0/ for current API)
    - Create auth screens: Login, Register
    - Create main tab navigation: Journal, Garden, Greenhouse, Profile
    - Implement auth guard (redirect to login if no session)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 12.3 Implement journal entry screens
    - Create entry creation screen with text input (10,000 char limit), emotion picker (primary + secondary)
    - Create entry list screen with entries sorted by date
    - Create entry detail/edit screen with same validation rules
    - Implement delete confirmation dialog
    - Display daily limit message for free-tier users
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 3.1, 3.2, 3.3_

  - [x] 12.4 Implement garden screen
    - Render the garden world map as the main screen (no traditional tab bar)
    - Load `assets/tiles/garden-map-free.json` or `assets/tiles/garden-map-paid.json` based on user tier
    - Render tilemap as a grid of expo-image tiles at 2x scale (16x16 native -> 32x32 rendered, nearest-neighbor)
    - Overlay the plot grid on the tilemap center: 3x3 (free) or 5x5 (paid)
    - Display plants at current growth stage via PlantVisualService (seed stage uses shared seed_planted.png, sprout/full/bloom use per-plant sprite sheet frames 0/1/2)
    - Implement seed planting: tap empty plot opens seed selection from inventory
    - Implement plant drag-and-drop movement between plots
    - Show 'no empty plots' message when garden is full
    - **Interactive sprite objects** (rendered as sprites over the tilemap at fixed tile coordinates, NOT in the tilemap):
      - **Chest** (static sprite) -> tap opens seed inventory panel
      - **Mailbox** (animated sprite, `Mailbox Animation Frames.png`) -> idle frame when notification-store is empty, animated flag frames when unread notifications exist; tap opens notifications panel
      - **Greenhouse building** (static sprite) -> tap opens greenhouse panel
      - **Sign** (static tile in tilemap) -> tap opens settings/profile panel
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 12.5 Implement greenhouse screen
    - Create greenhouse view showing stored plants with growth stage
    - Implement move-to-greenhouse from garden
    - Implement move-from-greenhouse to garden (select empty plot)
    - Implement revert-to-seed with confirmation dialog
    - Display capacity messages and full-greenhouse options
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 12.6 Implement achievement notifications
    - Create notification component for achievement/seed awards
    - Display achievement name and seed emotion type on trigger
    - Handle multiple simultaneous achievement notifications (queue display)
    - _Requirements: 4.3, 4.4_

- [x] 13. Wire entry submission to achievement evaluation and watering
  - [x] 13.1 Integrate entry creation with achievement engine and garden watering
    - Wire `createEntry` to trigger `achievementEngine.evaluateEntry` after successful save
    - Wire `createEntry` to trigger `gardenService.waterGarden` after successful save
    - Ensure all operations happen in a single WatermelonDB batch write (atomic)
    - Trigger achievement notifications in UI after awards
    - Update user stats (total entries, streak, last entry date) atomically
    - _Requirements: 4.1, 4.4, 6.1, 6.2_

  - [x] 13.2 Write integration tests for full journaling flow
    - Test: create entry → earn achievement → get seed → plant → water → grow
    - Test: offline entry creation → sync when online
    - Test: auth flow → session persistence → sign out → data cleanup
    - _Requirements: All (end-to-end validation)_

- [ ] 14. Final checkpoint - Full integration
  - [ ] 14.1 Configure OAuth providers for production release
    - Enable Google OAuth in Supabase dashboard (Authentication → Providers → Google)
    - Create Google OAuth credentials in Google Cloud Console (iOS + Android client IDs)
    - Enable Apple Sign In in Supabase dashboard (Authentication → Providers → Apple)
    - Register App ID with Sign In with Apple capability in Apple Developer portal
    - Re-enable email confirmation in Supabase Auth settings
    - _Requirements: 1.2_
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All business logic is testable independently of UI via service interfaces
- The plant visual system (task 9) can use placeholder sprites initially; art assets can be generated later using the Copilot pipeline described in the design
- Read https://docs.expo.dev/versions/v56.0.0/ before implementing any Expo Router, navigation, or platform API code

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["14.1"] }
  ]
}
```
