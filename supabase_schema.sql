-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players Table
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  nickname text not null,
  contact_info text -- Optional
);

-- Matches Table
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  duration_ms bigint not null,
  player_id uuid references public.players(id),
  session_token text unique
);

-- RLS Enablement
alter table public.players enable row level security;
alter table public.matches enable row level security;

-- Policies

-- 1. Matches: Reading (Leaderboard)
-- Anyone can read matches to see the leaderboard.
create policy "Matches are viewable by everyone"
  on public.matches for select
  using (true);

-- 2. Matches: Creation (Admin/System)
-- Only verified admins or service roles should create matches.
-- For now, allowing anon insert if this is run by the Admin client with a special role or just Authenticated.
-- Assuming Admin Interface logs in as an Authenticated user (Admin).
create policy "Authenticated(Admin) can insert matches"
  on public.matches for insert
  to authenticated
  with check (true);

-- 3. Matches: Update (Player claiming)
-- Player can claim a match if they have the session_token.
-- NOTE: This is tricky with RLS. The WHERE clause must match the existing row.
-- A better approach for "Claiming" via public is often a Database Function, 
-- but we can try a policy check on session_token.
-- "Allow update if session_token equals the input session_token?" No, RLS checks the row.
-- We will allow UPDATE to matches if the matched row has a session_token that is NOT NULL (implied) and...
-- Actually, a stored procedure `claim_match(token, nickname, contact)` is safer and easier than configuring granular update RLS for anon.
-- However, for the sake of simplicity in Client-side usage:
-- Let's use a postgres function for claiming.

-- 4. Players: key info
-- Players can be inserted by anyone (Registration).
create policy "Anyone can insert players"
  on public.players for insert
  with check (true);

-- Players are viewable by everyone (Leaderboard nickname).
create policy "Players are viewable by everyone"
  on public.players for select
  using (true);


-- Functions

-- Claim Match Function
-- This function allows a user to identify a match by token, create a player, and link them.
create or replace function claim_match(
  p_session_token text,
  p_nickname text,
  p_contact_info text default null
) returns json as $$
declare
  v_player_id uuid;
  v_match_id uuid;
begin
  -- Check if match exists and is unclaimed (player_id is null)
  select id into v_match_id from public.matches
  where session_token = p_session_token and player_id is null;

  if v_match_id is null then
    return json_build_object('success', false, 'message', 'Invalid or already claimed token');
  end if;

  -- Create Player
  insert into public.players (nickname, contact_info)
  values (p_nickname, p_contact_info)
  returning id into v_player_id;

  -- Update Match
  update public.matches
  set player_id = v_player_id,
      session_token = null -- Clear token so it can't be reused/leaked, or keep it? Clearing is safer.
  where id = v_match_id;

  return json_build_object('success', true, 'player_id', v_player_id);
end;
$$ language plpgsql security definer;
-- 'security definer' means it runs with the privileges of the creator (Admin), allowing it to bypass RLS restrictions if needed, 
-- or simplify the flow. Since it handles the logic internally.
