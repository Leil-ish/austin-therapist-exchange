-- PREVIEW ONLY — no writes. Safe to run any time.
--
-- Shows exactly which profiles.slug backfill (see
-- backfill_missing_profile_slugs.sql) would touch, and what it would set each
-- one to. Same WHERE clause as that file's UPDATE (`where slug is null`), so
-- this lists precisely the rows that migration can affect — nothing else.

select
  id,
  full_name,
  slug as current_slug,
  coalesce(
    nullif(
      regexp_replace(
        regexp_replace(lower(trim(full_name)), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      ),
      ''
    ),
    'therapist'
  ) || '-' || substr(id::text, 1, 8) as new_slug
from public.profiles
where slug is null
order by full_name;
