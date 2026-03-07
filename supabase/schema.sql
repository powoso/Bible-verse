-- VerseVault Database Schema
-- Run this in the Supabase SQL editor to create all tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- TABLES
-- =====================

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  denomination text,
  streak_count integer default 0,
  last_active timestamp with time zone,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'church')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default now()
);

-- Verse collections
create table public.verse_collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  is_shared boolean default false,
  created_at timestamp with time zone default now()
);

-- Verses
create table public.verses (
  id uuid default uuid_generate_v4() primary key,
  collection_id uuid references public.verse_collections(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  reference text not null,
  text text not null,
  translation text not null default 'KJV',
  tags text[] default '{}',
  created_at timestamp with time zone default now()
);

-- User verse progress (SM-2 spaced repetition)
create table public.user_verses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  verse_id uuid references public.verses(id) on delete cascade not null,
  interval integer default 1,
  ease_factor real default 2.5,
  due_date timestamp with time zone default now(),
  repetitions integer default 0,
  mastered boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, verse_id)
);

-- Drill sessions
create table public.drill_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  mode text not null check (mode in ('read', 'prompt', 'fill_blank', 'first_letters', 'recite'))
);

-- Drill results
create table public.drill_results (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.drill_sessions(id) on delete cascade not null,
  verse_id uuid references public.verses(id) on delete cascade not null,
  score integer not null check (score >= 0 and score <= 5),
  time_taken integer not null, -- in seconds
  created_at timestamp with time zone default now()
);

-- =====================
-- INDEXES
-- =====================

create index idx_verses_user_id on public.verses(user_id);
create index idx_verses_collection_id on public.verses(collection_id);
create index idx_user_verses_user_id on public.user_verses(user_id);
create index idx_user_verses_due_date on public.user_verses(due_date);
create index idx_drill_sessions_user_id on public.drill_sessions(user_id);
create index idx_drill_results_session_id on public.drill_results(session_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.users enable row level security;
alter table public.verse_collections enable row level security;
alter table public.verses enable row level security;
alter table public.user_verses enable row level security;
alter table public.drill_sessions enable row level security;
alter table public.drill_results enable row level security;

-- Users: can read and update own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- Verse Collections: CRUD own, read shared
create policy "Users can view own collections"
  on public.verse_collections for select
  using (auth.uid() = user_id or is_shared = true);

create policy "Users can create own collections"
  on public.verse_collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own collections"
  on public.verse_collections for update
  using (auth.uid() = user_id);

create policy "Users can delete own collections"
  on public.verse_collections for delete
  using (auth.uid() = user_id);

-- Verses: CRUD own, read from shared collections
create policy "Users can view own verses"
  on public.verses for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.verse_collections
      where id = verses.collection_id and is_shared = true
    )
  );

create policy "Users can create own verses"
  on public.verses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own verses"
  on public.verses for update
  using (auth.uid() = user_id);

create policy "Users can delete own verses"
  on public.verses for delete
  using (auth.uid() = user_id);

-- User Verses: own data only
create policy "Users can view own user_verses"
  on public.user_verses for select
  using (auth.uid() = user_id);

create policy "Users can create own user_verses"
  on public.user_verses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_verses"
  on public.user_verses for update
  using (auth.uid() = user_id);

create policy "Users can delete own user_verses"
  on public.user_verses for delete
  using (auth.uid() = user_id);

-- Drill Sessions: own data only
create policy "Users can view own drill_sessions"
  on public.drill_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own drill_sessions"
  on public.drill_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own drill_sessions"
  on public.drill_sessions for update
  using (auth.uid() = user_id);

-- Drill Results: own data only (via session ownership)
create policy "Users can view own drill_results"
  on public.drill_results for select
  using (
    exists (
      select 1 from public.drill_sessions
      where id = drill_results.session_id and user_id = auth.uid()
    )
  );

create policy "Users can create own drill_results"
  on public.drill_results for insert
  with check (
    exists (
      select 1 from public.drill_sessions
      where id = drill_results.session_id and user_id = auth.uid()
    )
  );

-- =====================
-- FUNCTIONS
-- =====================

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );

  -- Create default collection
  insert into public.verse_collections (user_id, name, description)
  values (new.id, 'My Verses', 'Default collection');

  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update streak function
create or replace function public.update_streak(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_last_active timestamp with time zone;
  v_today date := current_date;
begin
  select last_active into v_last_active
  from public.users where id = p_user_id;

  if v_last_active is null or v_last_active::date < v_today - interval '1 day' then
    -- Streak broken or first time
    update public.users
    set streak_count = 1, last_active = now()
    where id = p_user_id;
  elsif v_last_active::date = v_today - interval '1 day' then
    -- Continue streak
    update public.users
    set streak_count = streak_count + 1, last_active = now()
    where id = p_user_id;
  else
    -- Already active today, just update timestamp
    update public.users
    set last_active = now()
    where id = p_user_id;
  end if;
end;
$$;
