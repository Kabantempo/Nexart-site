-- Exhibitor Reminders Table (v1.2.0)

CREATE TABLE IF NOT EXISTS event_exhibitor_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  exhibitor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_number integer NOT NULL CHECK (reminder_number IN (1, 2)), -- 7-day, 14-day
  sent_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  UNIQUE(event_id, exhibitor_id, reminder_number)
);

-- Event Reminder Settings
CREATE TABLE IF NOT EXISTS event_reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  first_reminder_days integer DEFAULT 7,
  second_reminder_days integer DEFAULT 14,
  enabled boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(event_id)
);

-- Waitlist Table
CREATE TABLE IF NOT EXISTS event_exhibitor_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  exhibitor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  reason text,
  notified_at timestamp,
  created_at timestamp DEFAULT now(),
  UNIQUE(event_id, exhibitor_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exhibitor_reminders_event ON event_exhibitor_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_reminders_exhibitor ON event_exhibitor_reminders(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_event ON event_reminder_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_waitlist_event ON event_exhibitor_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_waitlist_position ON event_exhibitor_waitlist(position);
