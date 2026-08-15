-- Add application deadline to events (organizer can cap when creators can apply)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS application_deadline date NULL;
