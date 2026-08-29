-- Known devices per user (IP hash + UA hash)
CREATE TABLE IF NOT EXISTS public.user_known_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  ua_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ip_hash, ua_hash)
);

ALTER TABLE public.user_known_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own devices" ON public.user_known_devices
  FOR ALL USING (auth.uid() = user_id);

-- Pending device verification codes
CREATE TABLE IF NOT EXISTS public.device_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  ip_hash text NOT NULL,
  ua_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.device_verification_codes ENABLE ROW LEVEL SECURITY;
-- Only service role can access (server-side only)
