-- Thought Garden — initial schema
-- Run via: supabase db push

-- ─── Users (extends Supabase auth.users) ────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  streak_count     int  not null default 0,
  last_entry_date  date,
  created_at       timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users manage own profile"
  on public.profiles for all using (auth.uid() = id);

-- ─── Entries ────────────────────────────────────────────────────────────────
create table public.entries (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  body              text not null,
  mood_primary      text,
  mood_secondary    text,
  themes            text[] not null default '{}',
  analysis_status   text not null default 'pending' check (analysis_status in ('pending','complete')),
  raw_analysis      jsonb,
  created_at        timestamptz not null default now()
);
alter table public.entries enable row level security;
create policy "Users manage own entries"
  on public.entries for all using (auth.uid() = user_id);

-- ─── Seeds ──────────────────────────────────────────────────────────────────
create table public.seeds (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  entry_id         uuid references public.entries(id) on delete set null,
  plant_species    text not null,
  color_primary    text not null,
  color_secondary  text not null,
  is_rare          boolean not null default false,
  location         text not null default 'inventory' check (location in ('inventory','greenhouse','garden')),
  created_at       timestamptz not null default now()
);
alter table public.seeds enable row level security;
create policy "Users manage own seeds"
  on public.seeds for all using (auth.uid() = user_id);

-- ─── Plants ─────────────────────────────────────────────────────────────────
create table public.plants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  seed_id             uuid not null references public.seeds(id) on delete cascade,
  species             text not null,
  color_primary       text not null,
  color_secondary     text not null,
  growth_stage        int  not null default 1 check (growth_stage between 1 and 4),
  watering_count      int  not null default 0,
  is_rare             boolean not null default false,
  is_radiant          boolean not null default false,
  location            text not null default 'garden' check (location in ('garden','greenhouse')),
  garden_position_x   int,
  garden_position_y   int,
  planted_at          timestamptz not null default now(),
  last_watered_at     timestamptz,
  bloomed_at          timestamptz
);
alter table public.plants enable row level security;
create policy "Users manage own plants"
  on public.plants for all using (auth.uid() = user_id);

-- ─── Garden Config ───────────────────────────────────────────────────────────
create table public.garden_configs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references public.profiles(id) on delete cascade,
  garden_grid_size     text not null default '4x4',
  greenhouse_capacity  int  not null default 10,
  tier                 text not null default 'free' check (tier in ('free','paid'))
);
alter table public.garden_configs enable row level security;
create policy "Users manage own garden config"
  on public.garden_configs for all using (auth.uid() = user_id);

-- ─── Streak Log ─────────────────────────────────────────────────────────────
create table public.streak_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  date     date not null,
  unique (user_id, date)
);
alter table public.streak_logs enable row level security;
create policy "Users manage own streak logs"
  on public.streak_logs for all using (auth.uid() = user_id);

-- ─── Entry Theme Counts ──────────────────────────────────────────────────────
create table public.entry_theme_counts (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  theme    text not null,
  count    int  not null default 0,
  primary key (user_id, theme)
);
alter table public.entry_theme_counts enable row level security;
create policy "Users manage own theme counts"
  on public.entry_theme_counts for all using (auth.uid() = user_id);

-- ─── Seed Milestones (dedup) ─────────────────────────────────────────────────
create table public.seed_milestones (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  theme          text,
  milestone_type text not null,
  earned_at      timestamptz not null default now(),
  unique (user_id, theme, milestone_type)
);
alter table public.seed_milestones enable row level security;
create policy "Users manage own milestones"
  on public.seed_milestones for all using (auth.uid() = user_id);
