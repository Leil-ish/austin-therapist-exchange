-- =============================================================================
-- Step 1: Run this SELECT first to identify the placeholder accounts.
--         Look for Maya Hernandez, Julian Park, Nina Patel (or similar names).
-- =============================================================================

select
  p.id,
  p.slug,
  p.full_name,
  p.membership_state,
  p.created_at,
  tp.public_display_name,
  tp.bio
from public.profiles p
left join public.therapist_profiles tp on tp.profile_id = p.id
order by p.created_at asc
limit 20;


-- =============================================================================
-- Step 2: Once you've confirmed the placeholder IDs from the query above,
--         delete them. Replace the UUIDs below with the actual IDs you see.
--
--         This deletes from auth.users — the cascade will clean up
--         public.profiles and public.therapist_profiles automatically.
-- =============================================================================

-- delete from auth.users
-- where id in (
--   'paste-uuid-here',
--   'paste-uuid-here',
--   'paste-uuid-here'
-- );


-- =============================================================================
-- Alternatively: delete by display name if you're confident in the names.
--   Uncomment and run ONLY after verifying the names from Step 1.
-- =============================================================================

-- delete from auth.users
-- where id in (
--   select p.id from public.profiles p
--   join public.therapist_profiles tp on tp.profile_id = p.id
--   where tp.public_display_name in (
--     'Maya Hernandez',
--     'Julian Park',
--     'Nina Patel'
--   )
-- );
