-- Create referral_status enum if it doesn't already exist
DO $$ BEGIN
  CREATE TYPE public.referral_status AS ENUM (
    'open', 'matched', 'declined', 'closed', 'accepted', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure the set_updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- referral_messages ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_request_id uuid REFERENCES public.referral_requests(id) ON DELETE SET NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own sent or received messages" ON public.referral_messages;
CREATE POLICY "users can view own sent or received messages"
  ON public.referral_messages FOR SELECT
  USING (sender_profile_id = auth.uid() OR receiver_profile_id = auth.uid());

DROP POLICY IF EXISTS "users can send messages" ON public.referral_messages;
CREATE POLICY "users can send messages"
  ON public.referral_messages FOR INSERT
  WITH CHECK (sender_profile_id = auth.uid());

DROP TRIGGER IF EXISTS set_referral_messages_updated_at ON public.referral_messages;
-- referral_messages has no updated_at column so no trigger needed

-- direct_referrals -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_details jsonb,
  status public.referral_status NOT NULL DEFAULT 'open',
  message_id uuid REFERENCES public.referral_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can view own direct referrals" ON public.direct_referrals;
CREATE POLICY "users can view own direct referrals"
  ON public.direct_referrals FOR SELECT
  USING (sender_profile_id = auth.uid() OR receiver_profile_id = auth.uid());

DROP POLICY IF EXISTS "users can create direct referrals" ON public.direct_referrals;
CREATE POLICY "users can create direct referrals"
  ON public.direct_referrals FOR INSERT
  WITH CHECK (sender_profile_id = auth.uid());

DROP POLICY IF EXISTS "receiver can update direct referral status" ON public.direct_referrals;
CREATE POLICY "receiver can update direct referral status"
  ON public.direct_referrals FOR UPDATE
  USING (receiver_profile_id = auth.uid())
  WITH CHECK (receiver_profile_id = auth.uid());

DROP TRIGGER IF EXISTS set_direct_referrals_updated_at ON public.direct_referrals;
CREATE TRIGGER set_direct_referrals_updated_at
  BEFORE UPDATE ON public.direct_referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
