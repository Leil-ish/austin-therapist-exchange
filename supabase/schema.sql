create extension if not exists pgcrypto;

create type public.app_role as enum ('client', 'therapist', 'admin');
create type public.membership_state as enum ('pending', 'active', 'rejected', 'suspended');
create type public.group_visibility as enum ('public', 'private_member_only');
create type public.post_kind as enum ('referral_request', 'consultation_request', 'job');
create type public.availability_status as enum ('accepting', 'waitlist', 'full');
create type public.referral_status as enum ('open', 'matched', 'declined', 'closed', 'accepted', 'completed');
create type public.moderation_target_type as enum ('post', 'endorsement', 'group', 'profile');
create type public.moderation_status as enum ('open', 'reviewing', 'resolved', 'dismissed');
create type public.payment_model as enum ('private_pay', 'insurance', 'both');
create type public.membership_tier as enum ('free', 'premium');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'therapist',
  membership_state public.membership_state not null default 'pending',
  full_name text not null,
  slug text unique,
  avatar_url text,
  city text,
  state_region text,
  country_code text not null default 'US',
  market_slug text not null default 'austin-tx',
  invite_code_used text,
  can_issue_referrals boolean not null default false,
  membership_tier public.membership_tier not null default 'free',
  trusted_referrer_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  rejected_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.therapist_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  public_display_name text not null,
  credentials text,
  title text,
  headline text,
  bio text,
  specialties text[] not null default '{}',
  insurance_accepted text[] not null default '{}',
  payment_model public.payment_model not null default 'both',
  modalities text[] not null default '{}',
  therapy_style_tags text[] not null default '{}',
  populations text[] not null default '{}',
  communities text[] not null default '{}',
  neighborhoods text[] not null default '{}',
  approach_summary text,
  featured_links text[] not null default '{}',
  offerings text[] not null default '{}',
  website_url text,
  booking_url text,
  public_email text,
  public_phone text,
  offers_in_person boolean not null default true,
  offers_telehealth boolean not null default true,
  availability_status public.availability_status not null default 'waitlist',
  availability_updated_at timestamptz not null default now(),
  accepting_referrals boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  invited_email text,
  market_slug text not null default 'austin-tx',
  invited_by uuid not null references public.profiles(id),
  max_uses integer not null default 1,
  use_count integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint invitations_max_uses_check check (max_uses > 0),
  constraint invitations_use_count_check check (use_count >= 0 and use_count <= max_uses)
);

create table public.join_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  city text,
  state_region text,
  country_code text not null default 'US',
  market_slug text not null default 'austin-tx',
  credentials text,
  license_number text,
  website_url text,
  linkedin_url text,
  note text,
  endorsement_from_profile_id uuid not null references public.profiles(id),
  invitation_id uuid not null references public.invitations(id),
  grant_referral_access boolean not null default false,
  status public.membership_state not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  visibility public.group_visibility not null default 'private_member_only',
  market_slug text not null default 'austin-tx',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, profile_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  kind public.post_kind not null,
  title text not null,
  body text not null,
  group_id uuid references public.groups(id) on delete set null,
  market_slug text not null default 'austin-tx',
  is_private boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.referral_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  client_age_group text,
  care_format text,
  insurance_notes text,
  urgency text,
  status public.referral_status not null default 'open',
  decline_reason text,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  topic text,
  preferred_timeframe text,
  compensation_notes text,
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  organization_name text,
  employment_type text,
  compensation_summary text,
  location_summary text,
  apply_url text,
  created_at timestamptz not null default now()
);

create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  therapist_profile_id uuid not null references public.therapist_profiles(id) on delete cascade,
  endorsed_profile_id uuid not null references public.profiles(id) on delete cascade,
  endorser_profile_id uuid not null references public.profiles(id) on delete cascade,
  public_quote text,
  private_note text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (endorsed_profile_id, endorser_profile_id),
  constraint no_self_endorsement check (endorsed_profile_id <> endorser_profile_id)
);

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_profile_id uuid not null references public.profiles(id) on delete cascade,
  followed_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_profile_id, followed_profile_id),
  constraint no_self_follow check (follower_profile_id <> followed_profile_id)
);

create table public.curated_lists (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.curated_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.curated_lists(id) on delete cascade,
  therapist_profile_id uuid not null references public.therapist_profiles(id) on delete cascade,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (list_id, therapist_profile_id)
);

create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid references public.profiles(id),
  target_type public.moderation_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status public.moderation_status not null default 'open',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

create table public.referral_messages (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  receiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  referral_request_id uuid references public.referral_requests(id) on delete set null, -- Optional: link to a specific referral request
  body text not null,
  read_at timestamptz, -- To track if the message has been read
  created_at timestamptz not null default now()
);

-- RLS policies for referral_messages
alter table public.referral_messages enable row level security;

create policy "users can view own sent or received messages"
on public.referral_messages for select
using (sender_profile_id = auth.uid() or receiver_profile_id = auth.uid());

create policy "users can send messages"
on public.referral_messages for insert
with check (sender_profile_id = auth.uid());

create table public.direct_referrals (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  receiver_profile_id uuid not null references public.profiles(id) on delete cascade,
  client_details jsonb, -- Details about the client being referred (anonymized)
  status public.referral_status not null default 'open', -- e.g., 'open', 'accepted', 'declined', 'completed'
  message_id uuid references public.referral_messages(id) on delete set null, -- Link to the initial message
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies for direct_referrals
alter table public.direct_referrals enable row level security;

create policy "users can view own direct referrals"
on public.direct_referrals for select
using (sender_profile_id = auth.uid() or receiver_profile_id = auth.uid());

create policy "users can create direct referrals"
on public.direct_referrals for insert
with check (sender_profile_id = auth.uid());

create policy "receiver can update direct referral status"
on public.direct_referrals for update
using (receiver_profile_id = auth.uid())
with check (receiver_profile_id = auth.uid());


