-- Backfills profiles.slug for rows where it is NULL.
--
-- Root cause: profiles.slug is a nullable `text unique` column with no default
-- and no generating trigger. A profile with slug = NULL breaks every
-- /directory/[slug] link built from it: mapTherapistSummary() used to coerce
-- the null into the literal string "null" via String(row.slug), producing a
-- link to /directory/null that 404s (DB NULL never matches the literal text
-- "null"). See src/lib/data/live-data.ts and app-actions/admin-actions.ts.
--
-- Slug logic mirrors the JS slugify() already used by the insert paths
-- (src/lib/auth/bootstrap.ts, src/app-actions/admin-actions.ts): lowercase,
-- trim, collapse non-alphanumerics to '-', trim leading/trailing '-', fall
-- back to 'therapist' if empty, then suffix '-' + first 8 hex chars of the
-- profile id (matches the existing `chase-o-neal-58aa55ad` pattern already
-- live in this table).

-- ── Preview: run this first and confirm the affected rows/slugs look right ──
with candidates as (
  select
    id,
    full_name,
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
)
select * from candidates order by full_name;

-- ── Apply: only run after reviewing the preview above ───────────────────────
-- Safe to run more than once (idempotent — only touches rows still NULL).
-- The `slug` unique constraint makes this self-checking: if a computed slug
-- ever collided with an existing one, the whole UPDATE fails atomically and
-- nothing is partially applied.
with candidates as (
  select
    id,
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
)
update public.profiles p
set slug = c.new_slug
from candidates c
where p.id = c.id;
