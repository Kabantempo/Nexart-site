-- Table event_documents: contrats, règlements, convocations envoyés aux créateurs
CREATE TABLE IF NOT EXISTS event_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('contrat', 'reglement', 'convocation', 'facture')),
  pdf_url text NOT NULL,
  file_name text NOT NULL,
  sent_at timestamp DEFAULT now(),
  downloaded_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_documents_creator ON event_documents(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_event ON event_documents(event_id);

ALTER TABLE event_documents ENABLE ROW LEVEL SECURITY;

-- Créateur : voir ses propres documents
CREATE POLICY "creator_see_own_docs" ON event_documents
  FOR SELECT USING (creator_id = auth.uid());

-- Organisateur : voir les documents de ses événements
CREATE POLICY "organizer_see_event_docs" ON event_documents
  FOR SELECT USING (organizer_id = auth.uid());

-- Organisateur : insérer des documents
CREATE POLICY "organizer_insert_docs" ON event_documents
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

-- Créateur : marquer comme téléchargé
CREATE POLICY "creator_update_downloaded" ON event_documents
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
