-- RGPD: Soft-delete et backup pour suppression de compte

-- ✅ Table pour sauvegarder données avant suppression
CREATE TABLE IF NOT EXISTS deleted_user_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  backup_data jsonb NOT NULL,
  deletion_requested_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

-- ✅ Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_deleted_backups_user_id ON deleted_user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_backups_deletion_requested_at ON deleted_user_backups(deletion_requested_at);

-- ✅ Colonnes soft-delete sur users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_hard_deleted boolean DEFAULT false;

-- ✅ Index pour recherche utilisateurs supprimés
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_is_hard_deleted ON users(is_hard_deleted);

-- ✅ RLS: Soft-deleted users ne sont jamais visibles sauf par Kalvin (admin)
ALTER TABLE deleted_user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deleted_backups_admin_only" ON deleted_user_backups
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
