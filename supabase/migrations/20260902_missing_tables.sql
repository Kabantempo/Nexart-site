-- Migration: tables manquantes détectées lors de l'audit GET endpoints
-- Date: 2026-09-02

-- ─── event_volunteers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_volunteers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        text NOT NULL,
  email       text,
  phone       text,
  shifts      text[] DEFAULT '{}',
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_event_id ON event_volunteers(event_id);

-- ─── event_shifts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_shifts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role        text,
  date        date,
  time        text,
  capacity    int NOT NULL DEFAULT 5,
  assigned    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_shifts_event_id ON event_shifts(event_id);

-- ─── event_campaigns ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at     timestamptz,
  open_rate   numeric DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_campaigns_event_id ON event_campaigns(event_id);

-- ─── event_reminder_settings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_reminder_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id             uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  first_reminder_days  int NOT NULL DEFAULT 7,
  second_reminder_days int NOT NULL DEFAULT 14,
  enabled              boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── creator_verifications ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_verifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  siret            text,
  document_url     text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid REFERENCES profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_verifications_creator_id ON creator_verifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_verifications_status ON creator_verifications(status);

-- ─── custom_discipline_requests ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_discipline_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             text NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by      uuid REFERENCES profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_discipline_requests_user_id ON custom_discipline_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_discipline_requests_status ON custom_discipline_requests(status);

-- ─── referrals ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  credited_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- ─── stand_payments ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stand_payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id        uuid NOT NULL REFERENCES profiles(id),
  organizer_id      uuid NOT NULL REFERENCES profiles(id),
  application_id    uuid REFERENCES applications(id),
  amount_cents      int NOT NULL DEFAULT 0,
  commission_cents  int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  stripe_payment_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stand_payments_event_id ON stand_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_creator_id ON stand_payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_organizer_id ON stand_payments(organizer_id);

-- ─── referral_code column on profiles ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- ─── deleted_at / is_hard_deleted on profiles (for RGPD soft-delete) ─────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_hard_deleted boolean DEFAULT false;
