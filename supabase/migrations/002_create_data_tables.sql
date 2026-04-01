-- Phase 2: All data tables + indexes + RLS policies

-- ============================================================
-- QUESTS
-- ============================================================

create table public.quests (
  id            uuid primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  status        text not null default 'open',
  priority      text not null default 'medium',
  category      text not null default 'other',
  parent_id     text,
  dependencies  jsonb not null default '[]',
  effort        text,
  time_estimate integer,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_quests_user on public.quests(user_id);

-- ============================================================
-- ITEMS
-- ============================================================

create table public.items (
  id            uuid primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  mod           text not null default '',
  status        text not null default 'needed',
  reason        text not null default '',
  purpose       text not null default '',
  dependencies  jsonb not null default '[]',
  effort        text,
  time_estimate integer,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_items_user on public.items(user_id);

-- ============================================================
-- BUILDINGS
-- ============================================================

create table public.buildings (
  id                uuid primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  location          text not null default '',
  style             text not null default '',
  status            text not null default 'planned',
  requirements      jsonb not null default '[]',
  item_requirements jsonb not null default '[]',
  inspo_pics        jsonb not null default '[]',
  dependencies      jsonb not null default '[]',
  notes             text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_buildings_user on public.buildings(user_id);

-- ============================================================
-- GOALS
-- ============================================================

create table public.goals (
  id              uuid primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  target_node_id  text not null,
  note            text,
  parent_goal_id  text,
  created_at      timestamptz not null default now()
);

create index idx_goals_user on public.goals(user_id);

-- ============================================================
-- INVENTORY
-- ============================================================

create table public.inventory (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  node_id  text not null,
  amount   integer not null default 0,
  unique(user_id, node_id)
);

create index idx_inventory_user on public.inventory(user_id);

-- ============================================================
-- NOTES
-- ============================================================

create table public.notes (
  id              uuid primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null default '',
  content         text not null default '',
  images          jsonb not null default '[]',
  tags            jsonb not null default '[]',
  linked_node_ids jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_notes_user on public.notes(user_id);

-- ============================================================
-- ACHIEVEMENTS (singleton per user)
-- ============================================================

create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  unlocked_ids jsonb not null default '[]',
  seen_ids     jsonb not null default '[]',
  unique(user_id)
);

-- ============================================================
-- PROGRESS (singleton per user)
-- ============================================================

create table public.progress (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  total_xp  integer not null default 0,
  xp_log    jsonb not null default '[]',
  unique(user_id)
);

-- ============================================================
-- GRAPH POSITIONS (singleton per user)
-- ============================================================

create table public.graph_positions (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  positions jsonb not null default '{}',
  unique(user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY — all tables
-- ============================================================

alter table public.quests enable row level security;
alter table public.items enable row level security;
alter table public.buildings enable row level security;
alter table public.goals enable row level security;
alter table public.inventory enable row level security;
alter table public.notes enable row level security;
alter table public.achievements enable row level security;
alter table public.progress enable row level security;
alter table public.graph_positions enable row level security;

-- quests
create policy "Users own quests select" on public.quests for select using (auth.uid() = user_id);
create policy "Users own quests insert" on public.quests for insert with check (auth.uid() = user_id);
create policy "Users own quests update" on public.quests for update using (auth.uid() = user_id);
create policy "Users own quests delete" on public.quests for delete using (auth.uid() = user_id);

-- items
create policy "Users own items select" on public.items for select using (auth.uid() = user_id);
create policy "Users own items insert" on public.items for insert with check (auth.uid() = user_id);
create policy "Users own items update" on public.items for update using (auth.uid() = user_id);
create policy "Users own items delete" on public.items for delete using (auth.uid() = user_id);

-- buildings
create policy "Users own buildings select" on public.buildings for select using (auth.uid() = user_id);
create policy "Users own buildings insert" on public.buildings for insert with check (auth.uid() = user_id);
create policy "Users own buildings update" on public.buildings for update using (auth.uid() = user_id);
create policy "Users own buildings delete" on public.buildings for delete using (auth.uid() = user_id);

-- goals
create policy "Users own goals select" on public.goals for select using (auth.uid() = user_id);
create policy "Users own goals insert" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users own goals update" on public.goals for update using (auth.uid() = user_id);
create policy "Users own goals delete" on public.goals for delete using (auth.uid() = user_id);

-- inventory
create policy "Users own inventory select" on public.inventory for select using (auth.uid() = user_id);
create policy "Users own inventory insert" on public.inventory for insert with check (auth.uid() = user_id);
create policy "Users own inventory update" on public.inventory for update using (auth.uid() = user_id);
create policy "Users own inventory delete" on public.inventory for delete using (auth.uid() = user_id);

-- notes
create policy "Users own notes select" on public.notes for select using (auth.uid() = user_id);
create policy "Users own notes insert" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users own notes update" on public.notes for update using (auth.uid() = user_id);
create policy "Users own notes delete" on public.notes for delete using (auth.uid() = user_id);

-- achievements
create policy "Users own achievements select" on public.achievements for select using (auth.uid() = user_id);
create policy "Users own achievements insert" on public.achievements for insert with check (auth.uid() = user_id);
create policy "Users own achievements update" on public.achievements for update using (auth.uid() = user_id);

-- progress
create policy "Users own progress select" on public.progress for select using (auth.uid() = user_id);
create policy "Users own progress insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "Users own progress update" on public.progress for update using (auth.uid() = user_id);

-- graph_positions
create policy "Users own graph_positions select" on public.graph_positions for select using (auth.uid() = user_id);
create policy "Users own graph_positions insert" on public.graph_positions for insert with check (auth.uid() = user_id);
create policy "Users own graph_positions update" on public.graph_positions for update using (auth.uid() = user_id);
