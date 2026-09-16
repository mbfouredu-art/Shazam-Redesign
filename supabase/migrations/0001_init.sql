-- supabase/migrations/0001_init.sql
-- WHAT: the data model behind Result, Profile, and the corrections loop.
-- WHY:  Times Discovered is an aggregate, friend overlap is a join, and place is
--       per-discovery with its own share flag — so the schema mirrors the UI's claims.
-- HOW:  run in the Supabase SQL editor (Dashboard → SQL) or `supabase db push`.
--       RLS is ON for every table; policies are the minimum the app needs.

create extension if not exists "pgcrypto";

-- Profiles mirror auth.users 1:1. Created by trigger on signup.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.songs (
  id text primary key,                 -- Olaf index id today; ISRC / ShazamKit id later
  title text not null,
  artist text not null,
  album_art_url text,
  isrc text,
  created_at timestamptz not null default now()
);

create type public.environment as enum ('auto','bar','mall','faint');

create table public.discoveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id text not null references public.songs(id) on delete cascade,
  environment public.environment not null default 'auto',
  ambient_rms real,                    -- what the mic actually measured; validates presets
  confidence real,
  lat double precision,
  lng double precision,
  place_label text,                    -- reverse-geocoded, human readable
  share_place boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.discoveries (song_id, created_at desc);
create index on public.discoveries (user_id, created_at desc);

-- Crowd "Vibe & tone" descriptors, de-duplicated per song per user.
create table public.song_tags (
  song_id text not null references public.songs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tag text not null check (char_length(tag) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (song_id, user_id, tag)
);

-- The differentiator: what the user corrected in the live transcript.
create table public.transcript_corrections (
  id uuid primary key default gen_random_uuid(),
  discovery_id uuid not null references public.discoveries(id) on delete cascade,
  heard text not null,
  corrected text not null,
  created_at timestamptz not null default now()
);

create type public.friend_status as enum ('pending','accepted','blocked');
create table public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- Helper: are two users accepted friends (either direction)?
create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((user_id = a and friend_id = b) or (user_id = b and friend_id = a))
  );
$$;

-- Times Discovered, callable from the client: select public.discover_count('song-id');
create or replace function public.discover_count(p_song text) returns bigint
language sql stable as $$ select count(*) from public.discoveries where song_id = p_song; $$;

-- Friends who also found this song, with place only when they chose to share it.
create or replace function public.friend_overlap(p_song text) returns table (
  user_id uuid, display_name text, avatar_url text, discovered_at timestamptz,
  environment public.environment, place_label text
) language sql stable security definer as $$
  select p.id, p.display_name, p.avatar_url, d.created_at, d.environment,
         case when d.share_place then d.place_label end
  from public.discoveries d join public.profiles p on p.id = d.user_id
  where d.song_id = p_song and d.user_id <> auth.uid() and public.are_friends(auth.uid(), d.user_id)
  order by d.created_at desc;
$$;

-- ---------------- RLS ----------------
alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.discoveries enable row level security;
alter table public.song_tags enable row level security;
alter table public.transcript_corrections enable row level security;
alter table public.friendships enable row level security;

create policy "profiles readable by all signed-in" on public.profiles for select to authenticated using (true);
create policy "own profile writable" on public.profiles for update to authenticated using (id = auth.uid());

create policy "songs public read" on public.songs for select using (true);
create policy "songs insert by signed-in" on public.songs for insert to authenticated with check (true);

create policy "own discoveries" on public.discoveries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "friends' discoveries readable" on public.discoveries for select to authenticated using (public.are_friends(auth.uid(), user_id));

create policy "tags public read" on public.song_tags for select using (true);
create policy "own tags" on public.song_tags for insert to authenticated with check (user_id = auth.uid());

create policy "own corrections" on public.transcript_corrections for all to authenticated
  using (exists (select 1 from public.discoveries d where d.id = discovery_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.discoveries d where d.id = discovery_id and d.user_id = auth.uid()));

create policy "own friendships" on public.friendships for all to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid()) with check (user_id = auth.uid());

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
