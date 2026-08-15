-- Fix audit_logs: le CHECK constraint ne permet pas 'TEST' (utilisé dans les docs)
-- On étend les actions autorisées pour inclure les actions admin courantes
-- et on corrige la contrainte d'index deferrable incorrecte

-- Supprimer l'ancien CHECK constraint
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- Ajouter le nouveau CHECK étendu
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'DECRYPT', 'LOGIN', 'LOGOUT', 'ADMIN'));

-- Supprimer la fausse contrainte UNIQUE sur id (c'était déjà la PK)
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_idx;
