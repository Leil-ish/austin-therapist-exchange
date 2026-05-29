-- Add communities identity tags to therapist profiles
-- Allows therapists to indicate the communities they serve or identify with

alter table public.therapist_profiles
  add column if not exists communities text[] not null default '{}';
