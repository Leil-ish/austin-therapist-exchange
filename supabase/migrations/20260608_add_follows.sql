create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  followed_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_profile_id, followed_profile_id),
  constraint no_self_follow check (follower_profile_id <> followed_profile_id)
);
