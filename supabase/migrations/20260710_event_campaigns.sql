-- Event Campaigns Table (v1.2.0)

CREATE TABLE IF NOT EXISTS event_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  open_rate integer DEFAULT 0,
  click_rate integer DEFAULT 0,
  sent_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Event Team Table (if not exists)
CREATE TABLE IF NOT EXISTS event_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('active', 'invited')),
  joined_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  UNIQUE(event_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_campaigns_event_id ON event_campaigns(event_id);
CREATE INDEX IF NOT EXISTS idx_event_campaigns_status ON event_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_event_team_event_id ON event_team(event_id);
CREATE INDEX IF NOT EXISTS idx_event_team_status ON event_team(status);
