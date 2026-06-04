-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  total_points int not null default 0,
  correct_picks int not null default 0,
  exact_scores int not null default 0,
  created_at timestamptz not null default now()
);

-- Matches (populated from API-Football)
create table matches (
  id serial primary key,
  api_id int unique,                         -- API-Football fixture id
  home_team text not null,
  away_team text not null,
  home_flag text,                            -- flag image URL
  away_flag text,
  home_logo text,                            -- team logo URL
  away_logo text,
  kickoff_at timestamptz not null,
  venue text,
  stage text not null default 'Group Stage', -- 'Group Stage', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', '3rd Place', 'Final'
  group_name text,                           -- 'A'–'L' for group stage
  home_score int,
  away_score int,
  status text not null default 'NS'         -- NS, LIVE, FT
);

-- Picks
create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  match_id int not null references matches(id) on delete cascade,
  prediction text not null check (prediction in ('home', 'draw', 'away')),
  -- exact score only used for Final tiebreaker
  pred_home_score int,
  pred_away_score int,
  points_earned int,
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

-- Groups
create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  admin_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Group members
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

-- RLS
alter table profiles enable row level security;
alter table matches enable row level security;
alter table picks enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;

-- Profiles: anyone can read, users manage own
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Matches: anyone can read, only service role writes
create policy "matches_read" on matches for select using (true);

-- Picks: users read all (for leaderboard), write own
create policy "picks_read" on picks for select using (true);
create policy "picks_insert" on picks for insert with check (auth.uid() = user_id);
create policy "picks_update" on picks for update using (auth.uid() = user_id);
create policy "picks_delete" on picks for delete using (auth.uid() = user_id);

-- Groups: members can read their groups
create policy "groups_read" on groups for select using (
  exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid())
  or admin_id = auth.uid()
);
create policy "groups_insert" on groups for insert with check (auth.uid() = admin_id);
create policy "groups_update" on groups for update using (auth.uid() = admin_id);
create policy "groups_delete" on groups for delete using (auth.uid() = admin_id);

-- Group members
create policy "group_members_read" on group_members for select using (
  exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
);
create policy "group_members_insert" on group_members for insert with check (auth.uid() = user_id);
create policy "group_members_delete" on group_members for delete using (
  auth.uid() = user_id or
  exists (select 1 from groups where id = group_members.group_id and admin_id = auth.uid())
);

-- Indexes
create index on picks(user_id);
create index on picks(match_id);
create index on group_members(group_id);
create index on group_members(user_id);
create index on matches(kickoff_at);
create index on matches(status);

-- Function: auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
