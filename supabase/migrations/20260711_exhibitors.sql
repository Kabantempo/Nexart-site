-- v1.0.0: Exhibitors System for Event Organizers
-- Allows organizers to create custom form fields for exhibitor applications

-- 1. Exhibitor form fields (customizable per event)
CREATE TABLE IF NOT EXISTS exhibitor_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event this field belongs to
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Field configuration
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'date', 'number')),
  label TEXT NOT NULL,
  placeholder TEXT,
  description TEXT,

  -- Validation
  is_required BOOLEAN DEFAULT true,
  validation_pattern TEXT, -- regex for text validation
  min_length INT,
  max_length INT,

  -- For select type
  options TEXT[], -- array of options

  -- Ordering
  field_order INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Exhibitor responses (form submissions)
CREATE TABLE IF NOT EXISTS exhibitor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event + exhibitor
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_email TEXT NOT NULL,
  exhibitor_name TEXT,

  -- Application tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'waitlist')),

  -- Form data (JSON to support any field type)
  form_data JSONB NOT NULL,

  -- Notes from organizer
  organizer_notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Exhibitor waitlist (FIFO)
CREATE TABLE IF NOT EXISTS exhibitor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_response_id UUID NOT NULL REFERENCES exhibitor_responses(id) ON DELETE CASCADE,

  -- Position in queue
  position INT NOT NULL,

  -- When they were added
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Notification tracking
  notified_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(event_id, exhibitor_response_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exhibitor_fields_event ON exhibitor_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_responses_event ON exhibitor_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_responses_status ON exhibitor_responses(status);
CREATE INDEX IF NOT EXISTS idx_exhibitor_responses_email ON exhibitor_responses(exhibitor_email);
CREATE INDEX IF NOT EXISTS idx_exhibitor_waitlist_event ON exhibitor_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_waitlist_position ON exhibitor_waitlist(position);

-- RLS
ALTER TABLE exhibitor_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitor_waitlist ENABLE ROW LEVEL SECURITY;

-- Policies: organizers can view/edit fields for their events
CREATE POLICY "Organizers can manage fields for their events" ON exhibitor_fields
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  );

-- Policies: anyone can view responses for their submissions, organizers can view all
CREATE POLICY "Exhibitors can view own responses" ON exhibitor_responses
  FOR SELECT
  USING (
    exhibitor_email = auth.jwt()->>'email'
    OR event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Policies: organizers can update responses
CREATE POLICY "Organizers can update responses for their events" ON exhibitor_responses
  FOR UPDATE
  USING (
    event_id IN (SELECT id FROM events WHERE organizer_id = auth.uid())
  );

-- Function to auto-add to waitlist when status set to waitlist
CREATE OR REPLACE FUNCTION add_to_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  v_position INT;
BEGIN
  IF NEW.status = 'waitlist' AND OLD.status != 'waitlist' THEN
    -- Get next position
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM exhibitor_waitlist
    WHERE event_id = NEW.event_id;

    -- Add to waitlist
    INSERT INTO exhibitor_waitlist (event_id, exhibitor_response_id, position)
    VALUES (NEW.event_id, NEW.id, v_position);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_to_waitlist ON exhibitor_responses;
CREATE TRIGGER trigger_add_to_waitlist
  AFTER UPDATE ON exhibitor_responses
  FOR EACH ROW
  EXECUTE FUNCTION add_to_waitlist();
