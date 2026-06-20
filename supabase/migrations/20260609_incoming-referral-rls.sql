-- Idempotent migration: recipient-side RLS policies for case_referrals and client_cases.
-- Safe to re-run; uses DROP IF EXISTS before every CREATE.

-- ── case_referrals: recipient can read and respond to their own rows ──────────

ALTER TABLE public.case_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipient can select own referrals" ON public.case_referrals;
CREATE POLICY "recipient can select own referrals"
  ON public.case_referrals FOR SELECT
  USING (referred_profile_id = auth.uid());

DROP POLICY IF EXISTS "recipient can update own referrals" ON public.case_referrals;
CREATE POLICY "recipient can update own referrals"
  ON public.case_referrals FOR UPDATE
  USING (referred_profile_id = auth.uid())
  WITH CHECK (referred_profile_id = auth.uid());

-- ── client_cases: recipient can read the parent case ─────────────────────────
-- A recipient may only select a case if a case_referrals row links it to them.

ALTER TABLE public.client_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipient can select referred cases" ON public.client_cases;
CREATE POLICY "recipient can select referred cases"
  ON public.client_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.case_referrals cr
      WHERE cr.case_id = client_cases.id
        AND cr.referred_profile_id = auth.uid()
    )
  );
