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
-- Step 2: Delete the 18 AI-generated placeholder accounts.
--         Leila Anderson and Chase O'Neal are intentionally excluded.
--         The cascade cleans up profiles and therapist_profiles automatically.
-- =============================================================================

delete from auth.users
where id in (
  '06a983e4-f7cc-439c-9f11-b2e6a9ffc369', -- Maya Chen
  '409e3b72-f104-43f7-8db8-12447e0e9d75', -- Jordan Walker
  '6f40ba16-5570-4c61-b1b4-d3bbad211fba', -- Elena Sullivan
  '8582cfd6-8d4d-4f42-a92c-0ecad073f964', -- Marcus Turner
  '93423220-8324-4d8c-a050-dda81242c670', -- Priya Bennett
  '0d010744-de4f-4706-9911-eb8ca3a1020b', -- Noah Morris
  '26cfd499-00f5-42f5-adf9-efc17c477bf6', -- Avery Shah
  '98b6e0ae-6555-48fa-8df1-c965d294b9e2', -- Camila Powell
  '419aa7c0-35f2-484e-b215-8723fe7a3e4c', -- Julian Kim
  '8af69f33-519d-4b89-8d34-ebbc7834010b', -- Sofia Ortiz
  'eabb6a4d-b64a-4e42-a517-abfd6cecc390', -- Renee Chen
  '1b95981b-b259-4201-a5f7-c93fcfa3959c', -- Darius Walker
  'e00c7f35-3dea-475d-b049-f1dfa129c2f3', -- Leah Sullivan
  '8dadc7f7-788f-4762-a06d-c7dada8b6bdd', -- Owen Turner
  'd5489155-4c9f-41a9-9f10-ff866cb4cd0d', -- Nina Bennett
  'c3637019-2dd2-4ca5-a52e-8465deb5c977', -- Theo Morris
  'a2e67458-dc0d-4d32-b9c8-24c3d6aa7b55', -- Marisol Shah
  '6f0df78c-77de-445b-b197-e0af7ce2b3dc'  -- Evan Powell
);


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
