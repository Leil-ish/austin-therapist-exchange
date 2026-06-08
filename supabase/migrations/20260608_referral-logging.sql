-- Idempotent migration: client_cases + case_referrals for per-therapist referral logging.
-- Safe to run whether or not a prior org-based migration exists.

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.referral_status AS ENUM (
    'open', 'matched', 'accepted', 'declined', 'closed', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.case_status AS ENUM ('open', 'placed', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── set_updated_at trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- ── client_cases ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_cases (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_profile_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id     uuid,
  client_reference    text        NOT NULL,
  level_of_care       text,
  presenting_issue    text,
  client_type         text,
  payment_model       text,
  insurance           text,
  neighborhood        text,
  urgency             text,
  status              public.case_status NOT NULL DEFAULT 'open',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_profile_id, client_reference)
);

-- If organization_id column was previously created NOT NULL, drop that constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'client_cases'
      AND column_name  = 'organization_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.client_cases ALTER COLUMN organization_id DROP NOT NULL;
  END IF;
END $$;

-- If owner_profile_id doesn't exist yet (old org-only schema), add and backfill from created_by.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'client_cases'
      AND column_name  = 'owner_profile_id'
  ) THEN
    ALTER TABLE public.client_cases ADD COLUMN owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    -- Backfill from created_by if that column exists.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'client_cases'
        AND column_name  = 'created_by'
    ) THEN
      UPDATE public.client_cases SET owner_profile_id = created_by WHERE owner_profile_id IS NULL;
    END IF;
    ALTER TABLE public.client_cases ALTER COLUMN owner_profile_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.client_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner can select own cases" ON public.client_cases;
CREATE POLICY "owner can select own cases"
  ON public.client_cases FOR SELECT
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "owner can insert own cases" ON public.client_cases;
CREATE POLICY "owner can insert own cases"
  ON public.client_cases FOR INSERT
  WITH CHECK (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "owner can update own cases" ON public.client_cases;
CREATE POLICY "owner can update own cases"
  ON public.client_cases FOR UPDATE
  USING (owner_profile_id = auth.uid())
  WITH CHECK (owner_profile_id = auth.uid());

DROP TRIGGER IF EXISTS set_client_cases_updated_at ON public.client_cases;
CREATE TRIGGER set_client_cases_updated_at
  BEFORE UPDATE ON public.client_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── case_referrals ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.case_referrals (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id             uuid        NOT NULL REFERENCES public.client_cases(id) ON DELETE CASCADE,
  owner_profile_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_profile_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_method      text,
  status              public.referral_status NOT NULL DEFAULT 'open',
  responded_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- If the table was created by an old migration with therapist_profile_id, adapt it.
DO $$
BEGIN
  -- Make therapist_profile_id nullable if it exists as NOT NULL.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'case_referrals'
      AND column_name  = 'therapist_profile_id'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.case_referrals ALTER COLUMN therapist_profile_id DROP NOT NULL;
  END IF;

  -- Add referred_profile_id if missing.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'case_referrals'
      AND column_name  = 'referred_profile_id'
  ) THEN
    ALTER TABLE public.case_referrals ADD COLUMN referred_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    -- Backfill from therapist_profile_id if present.
    UPDATE public.case_referrals SET referred_profile_id = therapist_profile_id WHERE referred_profile_id IS NULL;
  END IF;

  -- Add contact_method if missing.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'case_referrals'
      AND column_name  = 'contact_method'
  ) THEN
    ALTER TABLE public.case_referrals ADD COLUMN contact_method text;
  END IF;
END $$;

-- Add unique constraint on (case_id, referred_profile_id) if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.case_referrals'::regclass
      AND contype  = 'u'
      AND conname  LIKE '%case_id%referred%'
  ) THEN
    ALTER TABLE public.case_referrals
      ADD CONSTRAINT case_referrals_case_id_referred_profile_id_key
      UNIQUE (case_id, referred_profile_id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.case_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner can select own referrals" ON public.case_referrals;
CREATE POLICY "owner can select own referrals"
  ON public.case_referrals FOR SELECT
  USING (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "owner can insert own referrals" ON public.case_referrals;
CREATE POLICY "owner can insert own referrals"
  ON public.case_referrals FOR INSERT
  WITH CHECK (owner_profile_id = auth.uid());

DROP POLICY IF EXISTS "owner can update own referrals" ON public.case_referrals;
CREATE POLICY "owner can update own referrals"
  ON public.case_referrals FOR UPDATE
  USING (owner_profile_id = auth.uid())
  WITH CHECK (owner_profile_id = auth.uid());

DROP TRIGGER IF EXISTS set_case_referrals_updated_at ON public.case_referrals;
CREATE TRIGGER set_case_referrals_updated_at
  BEFORE UPDATE ON public.case_referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
