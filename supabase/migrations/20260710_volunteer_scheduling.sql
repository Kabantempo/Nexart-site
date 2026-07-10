-- Volunteer Scheduling Tables (v1.2.0)

-- Event shifts/slots
CREATE TABLE IF NOT EXISTS event_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  capacity integer NOT NULL DEFAULT 5,
  assigned integer NOT NULL DEFAULT 0,
  role text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CHECK (assigned <= capacity)
);

-- Event volunteers
CREATE TABLE IF NOT EXISTS event_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  shifts uuid[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unavailable')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Volunteer shift assignments
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES event_shifts(id) ON DELETE CASCADE NOT NULL,
  volunteer_id uuid REFERENCES event_volunteers(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamp DEFAULT now(),
  UNIQUE(shift_id, volunteer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_shifts_event_id ON event_shifts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_shifts_date ON event_shifts(date);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_volunteers_status ON event_volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_shift_id ON volunteer_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
