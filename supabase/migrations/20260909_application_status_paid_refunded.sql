-- ════════════════════════════════════════════════════════════
-- application_status : ajout de 'paid' et 'refunded'
--
-- Le webhook Stripe (app/api/stripe/webhook/route.ts) écrit
-- applications.status = 'paid' après un paiement de stand et
-- = 'refunded' après un remboursement. Le dashboard créateur,
-- /events/[id], le cron stand-reminder-7days et lib/types.ts
-- lisent déjà ces deux valeurs.
--
-- Or l'enum en prod ne contient que :
--   pending, accepted, refused, awaiting_payment,
--   confirmed, stand_proposed, counter_proposed
-- => tout UPDATE avec 'paid'/'refunded' échoue à l'exécution.
--
-- ATTENTION : ALTER TYPE ... ADD VALUE n'est pas réversible
-- simplement (retirer une valeur impose de recréer le type).
-- ════════════════════════════════════════════════════════════

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'refunded';
