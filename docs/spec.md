# Thought Garden — Product Spec

## Concept

A mental health journaling app where writing entries grows a personal garden. The garden is a visual metaphor: mental health requires consistent nurturing, like plants. Gardens fill with colorful blooms over time, creating a soothing, rewarding space.

**Not a therapy replacement.** Companion tool only. All UX must reinforce this.

---

## Core Loop

1. User writes a journal entry
2. App analyzes entry (on-device NLP) → suggests primary + secondary mood + themes
3. User confirms mood
4. Milestones checked → seed may be awarded to inventory
5. User manually plants seed in garden plot
6. Daily writing streak waters all garden plants
7. Plants progress through growth stages with enough waterings
8. Garden fills with blooms over time

---

## Mental Health Safety — Non-Negotiable

- Onboarding disclaimer: tool is not a substitute for professional care
- Persistent subtle link to crisis resources (988 Lifeline)
- If content analysis detects crisis language (self-harm, suicidal ideation):
  - Suppress seed/streak mechanics for that entry
  - Show warm, non-alarming message + crisis line
  - Never penalize user
- No negative reinforcement. Missed streaks do not kill or wilt plants. Plants never die.
- Mood suggestions framed gently, not clinically
- Dark-theme entries (grief, anxiety) still earn seeds — showing up matters
- Garden always feels safe and beautiful, even for dark-mood plants

---

## Entries

- Text only (MVP). Voice post-MVP.
- On-device NLP analysis via `@xenova/transformers` (zero cost, offline, private)
- Extracts: primary mood, secondary mood, themes, sentiment intensity
- App suggests → user confirms before saving
- Analysis queued if offline, runs on reconnect
- `analysis_status`: pending | complete

---

## Moods

Primary mood drives plant color family. Secondary mood shifts hue/accent.

| Mood family | Color |
|---|---|
| Joy / Love / Gratitude | Warm — yellows, oranges, reds |
| Peace / Calm / Acceptance | Cool — blues, soft purples, greens |
| Grief / Loneliness / Sadness | Muted — dusty blues, grays, deep purples |
| Anxiety / Overwhelm | Desaturated + cool — pale greens, muted violets |
| Resilience / Courage | Earthy — ochres, burnt orange, deep green |
| Creativity / Wonder | Vivid mixed — teals, magentas, unusual combos |

---

## Plant Taxonomy (25 species)

| Theme | Plant |
|---|---|
| Gratitude | Sunflower |
| Joy / Celebration | Tulip |
| Love / Connection | Rose |
| Hope | Daffodil |
| Peace / Calm | Lavender |
| Reflection / Introspection | Fern |
| Growth / Progress | Bamboo |
| Resilience / Overcoming | Cactus |
| Anxiety / Worry | Wisteria |
| Grief / Loss | Blue Poppy |
| Anger / Frustration | Bird of Paradise |
| Loneliness | Moonflower |
| Confusion / Uncertainty | Foxglove |
| Nostalgia | Forget-Me-Not |
| Creativity / Inspiration | Protea (rare) |
| Exhaustion / Burnout | Willow Herb |
| Curiosity / Wonder | Passionflower |
| Courage / Facing fears | Edelweiss (rare) |
| Acceptance | Lotus |
| Self-compassion | Bleeding Heart |
| Excitement / Anticipation | Dahlia |
| Sadness | Hydrangea |
| Overwhelm | Morning Glory |
| Contentment | Chamomile |
| Healing | Aloe |

Rare/exotic plants (Protea, Edelweiss, Blue Poppy, etc.) require multiple sessions on same theme to unlock.

---

## Growth Stages

| Stage | Name | Visual | Unlock condition |
|---|---|---|---|
| 1 | Sprout | Cracked seed, tiny shoot, 1-2 leaves | Seed planted in garden |
| 2 | Budding | Fuller leaves, closed bud visible | 3 waterings |
| 3 | Bloom | Fully open, full color | 7 waterings |
| 4 | Radiant | Bloom + subtle glow/shimmer | Rare/exotic plants only |

- Bloom is permanent. Plants never regress or die.
- Growth only happens for plants in the garden (not greenhouse).

---

## Seed Earning — Milestone Model

Seeds are not earned per entry. Earned at meaningful thresholds:

| Milestone | Seed earned |
|---|---|
| First entry ever | Seed |
| First entry of a species/theme | Seed |
| 3rd entry of same theme | Seed |
| 7th entry of same theme | Rare seed |
| 15th entry of same theme | Radiant seed |
| 7-day streak | Bonus seed (most frequent theme) |
| 30-day streak | Rare bonus seed |
| First entry after 7+ day gap | Seed (returning rewarded, not shamed) |

Rare plant unlock logic:
- `rare` = same theme in 3+ entries AND high mood intensity
- `radiant` = rare + 5+ entries on same theme

---

## Garden & Greenhouse

### Garden
- Limited grid of plots (size is tier-dependent)
- Only planted seeds grow and get watered
- User manually places seeds from inventory into plots
- User can move plants (drag/reposition)
- User can move plant to greenhouse (keeps growth stage)
- If greenhouse is full when moving: modal offers Cancel or Revert to Seed (with warning that growth progress will be lost)

### Greenhouse
- Holds potted plants (moved from garden) and unplanted seeds
- No growth, no decay
- Capacity is tier-dependent
- Seeds in inventory: unlimited for all tiers

### Watering
- Daily writing streak waters all garden plants automatically
- Streak derived from StreakLog (one row per day written)

---

## Tiers

| Feature | Free | Paid |
|---|---|---|
| Garden grid size | Small (e.g. 4×4) | Large (e.g. 8×8) |
| Greenhouse capacity | Limited (e.g. 10) | Larger (TBD) |
| Seed inventory | Unlimited | Unlimited |
| Content analysis | On-device (free, offline) | On-device + optional OpenAI (better accuracy) |
| Shared gardens | Post-MVP | Post-MVP |

Paid tier details to be fleshed out later.

---

## Post-MVP Features

- Voice entries
- Shared/public gardens
- Web app (Next.js, deploy to Vercel)
- OpenAI analysis for paid tier (higher accuracy)
- Self-hosted Ollama for paid-tier analysis (cost control at scale)

---

## Admin

Admin functionality is post-MVP but the data model supports it from day one (`role` column on `profiles`).

### Access model
- `role: 'user' | 'admin'` on `profiles`
- Admin operations use Supabase service-role key (server-side only, never in the mobile app)
- Admin UI: simple web dashboard (Next.js, part of the post-MVP web app)

### Admin capabilities

| Capability | Notes |
|---|---|
| View aggregated stats | DAU, retention, seed earn rates, popular plants — no PII |
| Manage user tiers | Upgrade/downgrade free ↔ paid |
| Crisis detection audit log | Trigger counts by date, never entry content |
| Feature flags | Enable/disable OpenAI analysis, toggle paid features |
| Support access | Read-only view of a specific user's garden/entries (requires user consent or legal basis) |

### RLS rules
- Admin role bypasses normal user-scoped RLS via a separate policy: `auth.jwt() ->> 'role' = 'admin'`
- Admin role is set server-side only — never writable by the mobile client
- All admin actions are logged (audit table, post-MVP)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| Mobile | Expo + Expo Router |
| Shared UI | `@tg/ui` — RN primitives + NativeWind |
| Shared logic | `@tg/core` — Zustand, hooks, services, constants |
| DB client | `@tg/supabase` — Supabase JS + generated types |
| Local DB | WatermelonDB (offline-first, syncs to Supabase) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Styling | NativeWind (Tailwind for React Native) |
| State | Zustand |
| Content analysis | `@xenova/transformers` on-device (zero cost, offline, private) |
| Paid analysis | OpenAI API (post-MVP, optional) |
| Web hosting | Vercel (post-MVP) |

---

## Folder Structure

```
thought_garden/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── app/                   # Expo Router file-based routing
│       │   ├── (auth)/            # Login, register screens
│       │   ├── (tabs)/
│       │   │   ├── garden.tsx
│       │   │   ├── greenhouse.tsx
│       │   │   ├── journal.tsx
│       │   │   └── profile.tsx
│       │   ├── entry/
│       │   │   ├── new.tsx
│       │   │   └── [id].tsx
│       │   └── _layout.tsx
│       ├── src/
│       │   ├── components/        # Mobile-only (native gestures, sprites)
│       │   │   ├── garden/
│       │   │   └── greenhouse/
│       │   └── db/                # WatermelonDB schema + models
│       └── package.json
│
├── packages/
│   ├── ui/                        # @tg/ui — shared cross-platform components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MoodPicker/
│   │   │   │   ├── EntryCard/
│   │   │   │   ├── PlantBadge/
│   │   │   │   ├── SeedCard/
│   │   │   │   └── Button/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── core/                      # @tg/core — shared business logic, no UI
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── analysis.ts    # On-device NLP, abstracted for swap
│   │   │   │   ├── seeds.ts       # Milestone checks + seed award
│   │   │   │   └── streak.ts
│   │   │   ├── constants/
│   │   │   │   ├── plants.ts      # Full taxonomy
│   │   │   │   ├── moods.ts
│   │   │   │   └── milestones.ts
│   │   │   ├── hooks/
│   │   │   ├── store/             # Zustand stores
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── supabase/                  # @tg/supabase — shared client + types
│       ├── src/
│       │   ├── client.ts
│       │   └── types.ts
│       └── package.json
│
├── supabase/
│   ├── migrations/                # SQL migrations
│   └── functions/                 # Edge functions (post-MVP)
├── docs/
│   └── spec.md                    # This file
└── package.json                   # pnpm workspace root
```

---

## Data Model

```
User
  id, email, created_at, streak_count, last_entry_date
  role: 'user' | 'admin'

Entry
  id, user_id, body, created_at
  mood_primary, mood_secondary        -- confirmed by user
  themes[]                            -- extracted by NLP
  analysis_status (pending/complete)
  raw_analysis (json)

Seed
  id, user_id, entry_id (nullable — streak/milestone seeds)
  plant_species, color_primary, color_secondary
  is_rare
  location: 'inventory' | 'greenhouse' | 'garden'
  created_at

Plant
  id, user_id, seed_id
  species, color_primary, color_secondary
  growth_stage (1/2/3/4)
  watering_count
  is_rare, is_radiant
  location: 'garden' | 'greenhouse'
  garden_position_x, garden_position_y  -- null if in greenhouse
  planted_at, last_watered_at, bloomed_at

GardenConfig
  id, user_id
  garden_grid_size        -- e.g. "4x4" free, "8x8" paid
  greenhouse_capacity     -- e.g. 10 free, larger paid
  tier: 'free' | 'paid'

StreakLog
  id, user_id, date       -- one row per day written

EntryThemeCount
  user_id, theme, count   -- drives milestone checks

SeedMilestone
  id, user_id, theme, milestone_type, earned_at  -- prevents duplicate awards
```

---

## Visual Design Principles

- Illustrated, not photorealistic. Soft, slightly stylized (Stardew Valley meets botanical sketchbook).
- Each plant has 3-4 sprite variants (one per growth stage).
- Color applied via tint/hue shift on base illustration (MVP). Full color variants post-MVP.
- Garden view: top-down or slight isometric grid.
- Bloom animation on stage transition: simple scale + fade-in.
- Dark-mood entries → desaturated, moody but still beautiful. Never ugly.
- Garden always feels safe and soothing regardless of entry mood.

---

## Cost Strategy

- Supabase free tier covers MVP. Upgrade to Pro ($25/mo) at ~1k MAU.
- On-device NLP = zero per-analysis cost forever on free tier.
- No containers needed for MVP. Web post-MVP deploys to Vercel (free tier generous).
- OpenAI abstracted behind feature flag — can disable instantly if costs spike.
