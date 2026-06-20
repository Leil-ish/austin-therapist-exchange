-- Onboarding process reform:
-- 1. Make invitation_id and endorsement_from_profile_id nullable (new flow doesn't require them)
-- 2. Update trigger functions to skip invitation checks when invitation_id is null
-- 3. Add new onboarding columns to join_requests

-- Update trigger functions to handle nullable invitation_id
CREATE OR REPLACE FUNCTION public.validate_join_request_from_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  -- New open-apply flow: skip invitation validation when no invitation_id provided
  IF new.invitation_id IS NULL THEN
    RETURN new;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.invitations
    WHERE id = new.invitation_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.invitations
    WHERE id = new.invitation_id AND use_count >= max_uses
  ) THEN
    RAISE EXCEPTION 'Invitation has no uses remaining';
  END IF;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_invitation_use_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  -- Skip when no invitation linked (new open-apply flow)
  IF new.invitation_id IS NULL THEN
    RETURN new;
  END IF;

  UPDATE public.invitations
  SET use_count = use_count + 1
  WHERE id = new.invitation_id;

  RETURN new;
END;
$$;

-- Make legacy required columns nullable (existing rows retain their values)
ALTER TABLE public.join_requests
  ALTER COLUMN endorsement_from_profile_id DROP NOT NULL,
  ALTER COLUMN invitation_id DROP NOT NULL;

-- Add new onboarding columns
ALTER TABLE public.join_requests
  ADD COLUMN IF NOT EXISTS sponsor_profile_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS level_of_care text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_model text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS care_format text;
