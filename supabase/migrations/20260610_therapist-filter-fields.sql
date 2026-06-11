-- Add therapist filter fields: gender (self-declared), languages, sliding scale
alter table therapist_profiles
  add column if not exists gender text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists offers_sliding_scale boolean not null default false;
