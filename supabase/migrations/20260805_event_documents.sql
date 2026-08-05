-- Table event_documents
CREATE TABLE IF NOT EXISTS event_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  candidature_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('contrat', 'reglement', 'convocation', 'facture')),
  pdf_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE event_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizer_sees_own_event_docs" ON event_documents
  FOR SELECT USING (organizer_id = auth.uid());

CREATE POLICY "creator_sees_own_docs" ON event_documents
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "organizer_inserts_docs" ON event_documents
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_event_documents_event_id ON event_documents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_documents_creator_id ON event_documents(creator_id);

-- Colonnes QR vérification + numéro contrat
ALTER TABLE event_documents ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;
ALTER TABLE event_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE event_documents ADD COLUMN IF NOT EXISTS contract_number TEXT;
ALTER TABLE event_documents ADD COLUMN IF NOT EXISTS stand_number TEXT;

-- Index pour lookup rapide par token (page /verify/[token])
CREATE INDEX IF NOT EXISTS idx_event_documents_token ON event_documents(verification_token);

-- Policy publique lecture par token (aucune auth requise pour la page verify)
CREATE POLICY IF NOT EXISTS "public_verify_by_token" ON event_documents
  FOR SELECT USING (verification_token IS NOT NULL);

-- Bucket "documents" à créer manuellement dans Supabase Storage (privé, signed URLs)
