create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  email text,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  invite_code text unique,
  invited_by uuid references public.profiles(id),
  invite_quota int not null default 5,
  invites_used int not null default 0,
  bio text,
  riding_level text check (riding_level in ('beginner', 'intermediate', 'advanced', 'elite')),
  weekly_km text,
  instagram text,
  strava text,
  push_token text,
  total_km float not null default 0,
  total_rides int not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  instagram text,
  riding_level text,
  weekly_km text,
  r3_version text,
  reason text,
  referred_by text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  distance_km float not null default 0,
  duration_sec int not null default 0,
  avg_speed float not null default 0,
  top_speed float not null default 0,
  elevation_m float not null default 0,
  route_coords jsonb not null default '[]'::jsonb,
  is_public bool not null default false,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.ride_photos (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, ride_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  distance_km float not null default 0,
  elevation_m float not null default 0,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  coords jsonb not null default '[]'::jsonb,
  is_shared bool not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.group_rides (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  distance_km float,
  route_id uuid references public.routes(id),
  meet_location text,
  max_riders int,
  created_at timestamptz not null default now()
);

create table if not exists public.group_ride_members (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.group_rides(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'declined')),
  joined_at timestamptz not null default now(),
  unique(ride_id, user_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'group_ride', 'approved', 'invite_accepted', 'pr', 'streak')),
  message text not null,
  data jsonb not null default '{}'::jsonb,
  is_read bool not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_approved_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and status = 'approved');
$$;

-- Uses a security-definer function so an approved rider can reliably remove
-- their own post even when RLS rules are later tightened.
create or replace function public.delete_ride(target_ride_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a ride';
  end if;

  delete from public.rides
  where id = target_ride_id
    and (user_id = auth.uid() or public.is_admin());

  return found;
end;
$$;

grant execute on function public.delete_ride(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values ('ride-photos', 'ride-photos', true)
on conflict (id) do update set public = true;

create policy "ride photos public read" on storage.objects for select using (bucket_id = 'ride-photos');
create policy "ride photos member upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'ride-photos' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.rides enable row level security;
alter table public.ride_photos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.routes enable row level security;
alter table public.group_rides enable row level security;
alter table public.group_ride_members enable row level security;
alter table public.invites enable row level security;
alter table public.notifications enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());

create policy "applications read own or admin" on public.applications for select using (user_id = auth.uid() or public.is_admin());
create policy "applications insert own" on public.applications for insert with check (user_id = auth.uid());
create policy "applications admin update" on public.applications for update using (public.is_admin());

create policy "rides approved members read" on public.rides for select using (public.is_approved_member() or public.is_admin());
create policy "rides create own" on public.rides for insert with check (user_id = auth.uid() and public.is_approved_member());
create policy "rides update own or admin" on public.rides for update using (user_id = auth.uid() or public.is_admin());
create policy "rides delete own or admin" on public.rides for delete using (user_id = auth.uid() or public.is_admin());

create policy "ride photos approved read" on public.ride_photos for select using (public.is_approved_member() or public.is_admin());
create policy "ride photos own insert" on public.ride_photos for insert with check (user_id = auth.uid() and public.is_approved_member());

create policy "likes approved read" on public.likes for select using (public.is_approved_member() or public.is_admin());
create policy "likes own insert" on public.likes for insert with check (user_id = auth.uid() and public.is_approved_member());
create policy "likes own delete" on public.likes for delete using (user_id = auth.uid());

create policy "comments approved read" on public.comments for select using (public.is_approved_member() or public.is_admin());
create policy "comments own insert" on public.comments for insert with check (user_id = auth.uid() and public.is_approved_member());

create policy "routes approved read" on public.routes for select using (public.is_approved_member() or public.is_admin());
create policy "routes own insert" on public.routes for insert with check (created_by = auth.uid() and public.is_approved_member());

create policy "group rides approved read" on public.group_rides for select using (public.is_approved_member() or public.is_admin());
create policy "group rides own insert" on public.group_rides for insert with check (created_by = auth.uid() and (public.is_approved_member() or public.is_admin()));
create policy "group rides admin insert" on public.group_rides for insert with check (created_by = auth.uid() and public.is_admin());

create policy "group ride members approved read" on public.group_ride_members for select using (public.is_approved_member() or public.is_admin());
create policy "group ride members own upsert" on public.group_ride_members for insert with check ((user_id = auth.uid() and public.is_approved_member()) or public.is_admin());

create policy "invites own or admin read" on public.invites for select using (created_by = auth.uid() or used_by = auth.uid() or public.is_admin());
create policy "invites own insert" on public.invites for insert with check (created_by = auth.uid() and public.is_approved_member());
create policy "invites own update" on public.invites for update using (created_by = auth.uid() or public.is_admin());

create policy "notifications own read" on public.notifications for select using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update using (user_id = auth.uid());
create policy "notifications admin insert" on public.notifications for insert with check (public.is_admin());
