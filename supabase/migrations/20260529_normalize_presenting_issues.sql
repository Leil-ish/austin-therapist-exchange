-- =============================================================================
-- Normalize therapist specialties to match PRESENTING_ISSUES dropdown labels
-- =============================================================================
-- The seed data uses clinical terms ('Substance Use Disorders', 'Grief / Loss',
-- etc.) while the referral matching logic looks for canonical dropdown values
-- ('SUD', 'Grief Loss', etc.). This migration appends the canonical tags so
-- that confidence scoring works correctly.
--
-- Safe to run multiple times — each UPDATE only fires if the tag is absent.
-- =============================================================================

-- SUD -------------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['SUD'])
WHERE (
  specialties && ARRAY[
    'Substance Use Disorders','Addiction','Addiction / Recovery',
    'Process Addiction','Chronic Relapse','Harm Reduction','Recovery'
  ]
  OR bio ILIKE '%substance use%'
  OR bio ILIKE '%addiction%'
  OR approach_summary ILIKE '%substance use%'
)
AND NOT (specialties && ARRAY['SUD']);

-- Trauma ----------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Trauma'])
WHERE (
  specialties && ARRAY[
    'Childhood Trauma','Complex Trauma','Trauma / PTSD',
    'Domestic Violence','Reparenting','Somatic Experiencing',
    'Dissociative Disorders','DID / Dissociative Disorders','Parts Work'
  ]
  OR specialties::text ILIKE '%trauma%'
  OR bio ILIKE '%trauma%'
)
AND NOT (specialties && ARRAY['Trauma']);

-- PTSD ------------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['PTSD'])
WHERE (
  specialties && ARRAY['Trauma / PTSD','Complex Trauma','Childhood Trauma']
  OR specialties::text ILIKE '%ptsd%'
  OR bio ILIKE '%ptsd%'
  OR bio ILIKE '%post-traumatic%'
)
AND NOT (specialties && ARRAY['PTSD']);

-- Anxiety ---------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Anxiety'])
WHERE (
  specialties && ARRAY['Perfectionism','Generalized Anxiety','Social Anxiety','OCD']
  OR specialties::text ILIKE '%anxiety%'
  OR bio ILIKE '%anxiety%'
  OR approach_summary ILIKE '%anxiety%'
)
AND NOT (specialties && ARRAY['Anxiety']);

-- Depression ------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Depression'])
WHERE (
  specialties && ARRAY['Mood Disorders','Bipolar Disorder','Seasonal Depression']
  OR specialties::text ILIKE '%depression%'
  OR bio ILIKE '%depression%'
  OR approach_summary ILIKE '%depression%'
)
AND NOT (specialties && ARRAY['Depression']);

-- OCD -------------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['OCD'])
WHERE (
  specialties::text ILIKE '%ocd%'
  OR specialties::text ILIKE '%obsessive%'
  OR bio ILIKE '%ocd%'
  OR bio ILIKE '%obsessive-compulsive%'
)
AND NOT (specialties && ARRAY['OCD']);

-- Eating Disorder -------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Eating Disorder'])
WHERE (
  specialties && ARRAY[
    'Eating Disorders','Body Image','Body Dysmorphia',
    'Anorexia','Bulimia','Binge Eating'
  ]
  OR bio ILIKE '%eating disorder%'
  OR bio ILIKE '%body image%'
)
AND NOT (specialties && ARRAY['Eating Disorder']);

-- Infidelity ------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Infidelity'])
WHERE (
  specialties && ARRAY['Infidelity','Infidelity / Affairs','High-Conflict Couples']
  OR specialties::text ILIKE '%infidelity%'
  OR bio ILIKE '%infidelity%'
  OR bio ILIKE '%affair%'
)
AND NOT (specialties && ARRAY['Infidelity']);

-- Grief Loss ------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Grief Loss'])
WHERE (
  specialties && ARRAY['Grief / Loss','Grief','Loss','Bereavement','Older Adults']
  OR specialties::text ILIKE '%grief%'
  OR bio ILIKE '%grief%'
  OR bio ILIKE '%bereavement%'
)
AND NOT (specialties && ARRAY['Grief Loss']);

-- Burnout ---------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Burnout'])
WHERE (
  specialties && ARRAY['Burnout','Career Discord','Perfectionism','Work Stress']
  OR specialties::text ILIKE '%burnout%'
  OR bio ILIKE '%burnout%'
)
AND NOT (specialties && ARRAY['Burnout']);

-- Bipolar Disorder ------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Bipolar Disorder'])
WHERE (
  specialties::text ILIKE '%bipolar%'
  OR bio ILIKE '%bipolar%'
)
AND NOT (specialties && ARRAY['Bipolar Disorder']);

-- Anger -----------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Anger'])
WHERE (
  specialties && ARRAY['Self-Harm','BPD','Borderline Personality','High-Conflict']
  OR bio ILIKE '%anger%'
  OR bio ILIKE '%self-harm%'
  OR bio ILIKE '%aggression%'
)
AND NOT (specialties && ARRAY['Anger']);

-- Parenting -------------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Parenting'])
WHERE (
  specialties && ARRAY['Maternal Mental Health','Play Therapy','Family Systems','Co-dependency','Codependency']
  OR populations && ARRAY['Children','Families','Parents']
  OR bio ILIKE '%parenting%'
  OR bio ILIKE '%maternal%'
  OR bio ILIKE '%play therapy%'
)
AND NOT (specialties && ARRAY['Parenting']);

-- Self Esteem -----------------------------------------------------------------
UPDATE public.therapist_profiles
SET specialties = array_cat(specialties, ARRAY['Self Esteem'])
WHERE (
  specialties && ARRAY[
    'Women''s Development','Identity','Religious Deconstruction',
    'Women''s Issues','Men''s Issues'
  ]
  OR bio ILIKE '%self-esteem%'
  OR bio ILIKE '%self esteem%'
  OR bio ILIKE '%identity%'
  OR approach_summary ILIKE '%self-esteem%'
)
AND NOT (specialties && ARRAY['Self Esteem']);
