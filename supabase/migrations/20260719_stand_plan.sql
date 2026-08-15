-- Plan de stands interactif
ALTER TABLE events ADD COLUMN IF NOT EXISTS stand_plan JSONB;
COMMENT ON COLUMN events.stand_plan IS 'Plan de stands JSON: { rows, cols, cellSize, stands: [{id, row, col, label, status, width, height, price?, assignee?}] }';
