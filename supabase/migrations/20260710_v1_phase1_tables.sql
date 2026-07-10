-- ════════════════════════════════════════════════════════════
-- Nexart v1.0.0 — Phase 1: Toutes les nouvelles tables
-- Appliquer dans: https://supabase.com/dashboard/project/cvqeysnymnkfxfithhsr/sql/new
-- ════════════════════════════════════════════════════════════

-- ── 1. Reports (modération) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   TEXT NOT NULL CHECK (target_type IN ('user', 'event', 'post', 'message')),
  target_id     UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam', 'abuse', 'inappropriate', 'fake', 'other')),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS reports_select_own ON reports;
CREATE POLICY reports_select_own ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status);
CREATE INDEX IF NOT EXISTS reports_target_idx ON reports(target_type, target_id);

-- ── 2. Admin activity log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS admin_log_admin_id_idx ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS admin_log_created_at_idx ON admin_activity_log(created_at DESC);

-- ── 3. Exposants — champs formulaire personnalisés ───────────
CREATE TABLE IF NOT EXISTS event_exhibitor_fields (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_name  TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type  TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'checkbox', 'select', 'number')),
  options     TEXT[],
  required    BOOLEAN NOT NULL DEFAULT false,
  field_order INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_exhibitor_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exhibitor_fields_select ON event_exhibitor_fields;
CREATE POLICY exhibitor_fields_select ON event_exhibitor_fields FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS exhibitor_fields_insert ON event_exhibitor_fields;
CREATE POLICY exhibitor_fields_insert ON event_exhibitor_fields FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS exhibitor_fields_update ON event_exhibitor_fields;
CREATE POLICY exhibitor_fields_update ON event_exhibitor_fields FOR UPDATE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS exhibitor_fields_delete ON event_exhibitor_fields;
CREATE POLICY exhibitor_fields_delete ON event_exhibitor_fields FOR DELETE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS exhibitor_fields_event_id_idx ON event_exhibitor_fields(event_id);

-- ── 4. Exposants — réponses aux candidatures ─────────────────
CREATE TABLE IF NOT EXISTS event_exhibitor_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_data   JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  tables_count    INT NOT NULL DEFAULT 1,
  rejection_reason TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, exhibitor_id)
);

ALTER TABLE event_exhibitor_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exhibitor_resp_select_own ON event_exhibitor_responses;
CREATE POLICY exhibitor_resp_select_own ON event_exhibitor_responses FOR SELECT
  USING (auth.uid() = exhibitor_id OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS exhibitor_resp_insert ON event_exhibitor_responses;
CREATE POLICY exhibitor_resp_insert ON event_exhibitor_responses FOR INSERT
  WITH CHECK (auth.uid() = exhibitor_id);
DROP POLICY IF EXISTS exhibitor_resp_update ON event_exhibitor_responses;
CREATE POLICY exhibitor_resp_update ON event_exhibitor_responses FOR UPDATE
  USING (auth.uid() = exhibitor_id OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS exhibitor_resp_event_id_idx ON event_exhibitor_responses(event_id);
CREATE INDEX IF NOT EXISTS exhibitor_resp_status_idx ON event_exhibitor_responses(status);

-- ── 5. Exposants — liste d'attente ───────────────────────────
CREATE TABLE IF NOT EXISTS event_exhibitor_waitlist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position     INT NOT NULL,
  notified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, exhibitor_id)
);

ALTER TABLE event_exhibitor_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS waitlist_select ON event_exhibitor_waitlist;
CREATE POLICY waitlist_select ON event_exhibitor_waitlist FOR SELECT
  USING (auth.uid() = exhibitor_id OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS waitlist_event_position_idx ON event_exhibitor_waitlist(event_id, position);

-- ── 6. Exposants — tracking relances auto ────────────────────
CREATE TABLE IF NOT EXISTS event_exhibitor_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reminder_number INT NOT NULL CHECK (reminder_number IN (1, 2)),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, exhibitor_id, reminder_number)
);

ALTER TABLE event_exhibitor_reminders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS reminders_event_idx ON event_exhibitor_reminders(event_id);

-- ── 7. Équipe — membres par événement ────────────────────────
CREATE TABLE IF NOT EXISTS event_team (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('organizer', 'co_organizer', 'volunteer')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE event_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS team_select ON event_team;
CREATE POLICY team_select ON event_team FOR SELECT
  USING (EXISTS (SELECT 1 FROM event_team et WHERE et.event_id = event_id AND et.user_id = auth.uid()));
DROP POLICY IF EXISTS team_insert ON event_team;
CREATE POLICY team_insert ON event_team FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS team_delete ON event_team;
CREATE POLICY team_delete ON event_team FOR DELETE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS team_event_id_idx ON event_team(event_id);

-- ── 8. Tâches équipe ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started', 'in_progress', 'done')),
  deadline    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_select ON event_tasks;
CREATE POLICY tasks_select ON event_tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM event_team WHERE event_id = event_tasks.event_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM events WHERE id = event_tasks.event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS tasks_insert ON event_tasks;
CREATE POLICY tasks_insert ON event_tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM event_team WHERE event_id = event_tasks.event_id AND user_id = auth.uid())
           OR EXISTS (SELECT 1 FROM events WHERE id = event_tasks.event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS tasks_update ON event_tasks;
CREATE POLICY tasks_update ON event_tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM event_team WHERE event_id = event_tasks.event_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM events WHERE id = event_tasks.event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS tasks_event_id_idx ON event_tasks(event_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON event_tasks(assignee_id);

-- ── 9. Commentaires sur tâches ───────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES event_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS task_comments_select ON task_comments;
CREATE POLICY task_comments_select ON task_comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS task_comments_insert ON task_comments;
CREATE POLICY task_comments_insert ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON task_comments(task_id);

-- ── 10. Checklists événement ──────────────────────────────────
CREATE TABLE IF NOT EXISTS event_checklists (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL,
  items          JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS checklists_select ON event_checklists;
CREATE POLICY checklists_select ON event_checklists FOR SELECT
  USING (EXISTS (SELECT 1 FROM event_team WHERE event_id = event_checklists.event_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM events WHERE id = event_checklists.event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS checklists_insert ON event_checklists;
CREATE POLICY checklists_insert ON event_checklists FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS checklists_update ON event_checklists;
CREATE POLICY checklists_update ON event_checklists FOR UPDATE
  USING (EXISTS (SELECT 1 FROM event_team WHERE event_id = event_checklists.event_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM events WHERE id = event_checklists.event_id AND organizer_id = auth.uid()));

-- ── 11. FAQ auto-répondeur ────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_faqs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  keywords   TEXT[] DEFAULT '{}',
  faq_order  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS faqs_select ON event_faqs;
CREATE POLICY faqs_select ON event_faqs FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS faqs_insert ON event_faqs;
CREATE POLICY faqs_insert ON event_faqs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS faqs_update ON event_faqs;
CREATE POLICY faqs_update ON event_faqs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS faqs_delete ON event_faqs;
CREATE POLICY faqs_delete ON event_faqs FOR DELETE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS faqs_event_id_idx ON event_faqs(event_id);

-- ── 12. Documents générés par IA ─────────────────────────────
CREATE TABLE IF NOT EXISTS event_generated_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('permit_request', 'press_release', 'insurance_summary', 'sponsor_pitch')),
  content      TEXT NOT NULL,
  storage_path TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_generated_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS generated_docs_select ON event_generated_documents;
CREATE POLICY generated_docs_select ON event_generated_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS generated_docs_insert ON event_generated_documents;
CREATE POLICY generated_docs_insert ON event_generated_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS gen_docs_event_id_idx ON event_generated_documents(event_id);

-- ── 13. Plan marketing ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_marketing_plan (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  press_release       TEXT,
  media_contacts      JSONB DEFAULT '[]',
  deadlines_calendar  JSONB DEFAULT '[]',
  export_pdf_path     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

ALTER TABLE event_marketing_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketing_select ON event_marketing_plan;
CREATE POLICY marketing_select ON event_marketing_plan FOR SELECT
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS marketing_insert ON event_marketing_plan;
CREATE POLICY marketing_insert ON event_marketing_plan FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS marketing_update ON event_marketing_plan;
CREATE POLICY marketing_update ON event_marketing_plan FOR UPDATE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

-- ── 14. Disponibilités bénévoles ──────────────────────────────
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_slots JSONB NOT NULL DEFAULT '[]',
  preferred_activities TEXT[] DEFAULT '{}',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, volunteer_id)
);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vol_avail_select ON volunteer_availability;
CREATE POLICY vol_avail_select ON volunteer_availability FOR SELECT
  USING (auth.uid() = volunteer_id OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS vol_avail_insert ON volunteer_availability;
CREATE POLICY vol_avail_insert ON volunteer_availability FOR INSERT
  WITH CHECK (auth.uid() = volunteer_id);
DROP POLICY IF EXISTS vol_avail_update ON volunteer_availability;
CREATE POLICY vol_avail_update ON volunteer_availability FOR UPDATE
  USING (auth.uid() = volunteer_id);
CREATE INDEX IF NOT EXISTS vol_avail_event_idx ON volunteer_availability(event_id);

-- ── 15. Planning bénévoles (assignements) ────────────────────
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity     TEXT NOT NULL,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  checked_in   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vol_assign_select ON volunteer_assignments;
CREATE POLICY vol_assign_select ON volunteer_assignments FOR SELECT
  USING (auth.uid() = volunteer_id OR
         EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS vol_assign_insert ON volunteer_assignments;
CREATE POLICY vol_assign_insert ON volunteer_assignments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
DROP POLICY IF EXISTS vol_assign_update ON volunteer_assignments;
CREATE POLICY vol_assign_update ON volunteer_assignments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));
CREATE INDEX IF NOT EXISTS vol_assign_event_idx ON volunteer_assignments(event_id);

-- ── 16. Colonne is_admin sur profiles ─────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- ── 17. Fonction is_admin() ───────────────────────────────────
DROP FUNCTION IF EXISTS is_admin();
CREATE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── 18. RLS admin sur reports ─────────────────────────────────
DROP POLICY IF EXISTS reports_select_admin ON reports;
CREATE POLICY reports_select_admin ON reports FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS reports_update_admin ON reports;
CREATE POLICY reports_update_admin ON reports FOR UPDATE USING (is_admin());

-- ── 19. RLS admin sur admin_activity_log ──────────────────────
DROP POLICY IF EXISTS admin_log_select ON admin_activity_log;
CREATE POLICY admin_log_select ON admin_activity_log FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS admin_log_insert ON admin_activity_log;
CREATE POLICY admin_log_insert ON admin_activity_log FOR INSERT WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════
-- FIN — Phase 1 tables
-- ════════════════════════════════════════════════════════════
