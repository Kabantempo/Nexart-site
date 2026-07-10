# Checklist Vérification Complète v1.0.0

**Objectif**: Valider que tout fonctionne avant lancement v1.0.0  
**Status**: En cours  
**Cible**: v1.0.0 release (Hostinger production)

---

## PHASE 1: RGPD / Compliance ✅ (DONE)

### Politique de confidentialité
- [x] Créé `/app/confidentialite/page.tsx`
- [x] Contenu conforme RGPD (Articles 15-21)
- [x] Accessible via URL publique
- [ ] **TEST**: Vérifier affichage et accessibilité page

### Bandeau consentement cookies
- [x] Créé `/components/CookieConsent.tsx`
- [x] Default "Refuser" (recommandé)
- [x] "Accepter Tous" charge GTM-PC469WF9
- [x] Stockage consentement (js-cookie, 365 jours)
- [ ] **TEST**: Vérifier bandeau s'affiche, clique "Refuser", clique "Accepter"

### Registre des Traitements (ROPA)
- [x] Créé `Compliance/Registre_Traitements_ROPA.md`
- [x] 11 traitements documentés (A-K)
- [x] Base légale chaque traitement
- [x] Sous-traitants + DPA signés
- [ ] **TEST**: Relire + valider conformité CNIL

### SQL Soft-Delete
- [x] Migration créée: `supabase/migrations/20260727_rgpd_soft_delete.sql`
- [x] Colonnes: `deleted_at`, `is_hard_deleted`
- [x] Table: `deleted_user_backups` (backup)
- [ ] **TEST**: Vérifier tables existent en prod (Supabase)

---

## PHASE 2: Endpoints Suppression Compte ✅ (DONE)

### Delete Request
- [x] Route: `POST /api/account/delete-request`
- [x] Payload: `{ userId, email }`
- [x] Backup création avant soft-delete
- [x] Email confirmation avec lien annulation
- [ ] **TEST**: Curl POST request, vérifier email envoyé

### Cancel Deletion
- [x] Route: `GET /api/account/cancel-deletion?token=...`
- [x] Token validation (24h expiry)
- [x] Restore account + delete backup
- [x] Email de confirmation
- [ ] **TEST**: Cliquer lien email, vérifier compte restauré

### Hard-Delete Cron
- [x] Route: `POST /api/cron/hard-delete-users`
- [x] Bearer token authentication
- [x] Supprime users 30j+ après soft-delete
- [x] Supprime profiles + related data
- [x] Nettoie backups
- [ ] **TEST**: Curl POST avec token, vérifier dry-run GET endpoint

### Environment Config
- [ ] `RESEND_API_KEY` configuré (.env.local)
- [ ] `CRON_SECRET_TOKEN` configuré + stocké sécurisé
- [ ] `NEXT_PUBLIC_APP_URL` set correctement
- [ ] `SUPABASE_SERVICE_ROLE_KEY` accès API

---

## PHASE 3: Frontend Integration ✅ (DONE)

### Settings / Account Page
- [x] Créé `/app/settings/page.tsx`
- [x] Bouton "Supprimer mon compte"
- [x] Modal confirmation (2-step)
- [x] Call `POST /api/account/delete-request`
- [x] Message succès + email instruction
- [ ] **TEST**: Cliquer bouton, voir modal, soumettre (fin)

### Account Export
- [x] Créé `GET /api/account/export-data`
- [x] Retourne JSON téléchargeable
- [x] Inclure: profile, conversations, reviews, posts, messages
- [x] Lien "Télécharger mes données" dans settings
- [ ] **TEST**: Download données, vérifier format (fin)

### Auth Endpoint
- [x] Créé `GET /api/auth/me` (current user info)
- [x] Retourne userId + email + profile
- [ ] **TEST**: Vérifier retour données (fin)

### RLS Policies (Soft-Delete)
- [ ] Profile queries filtrées (deleted_at IS NULL)
- [ ] Applications queries filtrées
- [ ] Messages queries filtrées
- [ ] Posts queries filtrées
- [ ] **TEST**: Soft-delete user → vérifier pas visible (Phase 6)

---

## PHASE 4: Configuration Déploiement ⏳ (TODO)

### Supabase Production
- [ ] Vérifier region EU (eu-central-1)
- [ ] Appliquer SQL migration si pas fait
- [ ] Vérifier RLS policies activées
- [ ] Vérifier backups activés
- [ ] Test requête simple (SELECT users)
- [ ] **TEST**: Dashboard Supabase → confirmer

### Hostinger Environment
- [ ] Copier `.env.local` → `.env.production` (sécurisé)
- [ ] Vérifier `NEXT_PUBLIC_*` vars visibles frontend
- [ ] Vérifier `SUPABASE_SERVICE_ROLE_KEY` secret (backend seul)
- [ ] Vérifier `RESEND_API_KEY` présent
- [ ] Vérifier `CRON_SECRET_TOKEN` présent
- [ ] **TEST**: SSH Hostinger → cat .env pour vérifier

### Cron Job Setup (Hostinger ou EasyCron)
- [ ] Enregistrer compte EasyCron
- [ ] Créer cron: `POST https://nexart.fr/api/cron/hard-delete-users`
- [ ] Header: `Authorization: Bearer <CRON_SECRET_TOKEN>`
- [ ] Schedule: Tous les jours 02:00 UTC
- [ ] Test trigger manuel
- [ ] **TEST**: Appeler cron endpoint, vérifier log

---

## PHASE 5: Build & Deploy ⏳ (TODO)

### Local Build
- [ ] `npm run build` succeed sans erreurs
- [ ] Vérifier size bundle (NextJS default check)
- [ ] Pas de warnings TypeScript
- [ ] Linter clean: `npm run lint`
- [ ] **TEST**: Build localement

### Hostinger Deploy
- [ ] `./deploy.sh` execute avec succès
- [ ] Code push vers serveur
- [ ] PM2 restart l'app
- [ ] Site accessible: https://nexart.fr
- [ ] **TEST**: SSH verifier logs, curl homepage

### Version Bump
- [ ] Mettre à jour `package.json` → v1.0.0
- [ ] Git tag: `git tag -a v1.0.0 -m "v1.0.0: RGPD + Account Deletion"`
- [ ] `git push origin main --tags`
- [ ] **TEST**: Vérifier tag sur GitHub

---

## PHASE 6: Smoke Tests (Production) ⏳ (TODO)

### Homepage & Navigation
- [ ] [ ] Accueil charge (https://nexart.fr)
- [ ] [ ] Navbar visible + clickable
- [ ] [ ] Footer visible
- [ ] [ ] Bandeau cookies affiche
- [ ] [ ] Tous liens internes fonctionnent

### RGPD Pages
- [ ] [ ] `/confidentialite` charge complètement
- [ ] [ ] Contenu lisible + formaté
- [ ] [ ] Lien "contact@nexart.fr" cliquable
- [ ] [ ] Lien CNIL cliquable

### Auth Flow
- [ ] [ ] Login page accessible
- [ ] [ ] Signup page accessible
- [ ] [ ] Créer compte test → valider email
- [ ] [ ] Se connecter avec compte test
- [ ] [ ] Profil settings visible

### Settings / Account Deletion
- [ ] [ ] Settings page charge
- [ ] [ ] Bouton "Supprimer compte" visible
- [ ] [ ] Cliquer → modal appears
- [ ] [ ] Confirmer suppression → API call
- [ ] [ ] Email reçu avec lien annulation
- [ ] [ ] Cliquer lien → restaure compte
- [ ] [ ] Vérifier compte accessible après restauration

### Emails (Resend)
- [ ] [ ] Email "Suppression demandée" reçu
- [ ] [ ] Email "Annulation confirmée" reçu
- [ ] [ ] Lien dans email valide + clickable
- [ ] [ ] Pas de spam folder

### Database (Supabase)
- [ ] [ ] Vérifier user test créé dans `users` table
- [ ] [ ] Vérifier profile créé dans `profiles` table
- [ ] [ ] Soft-delete: vérifier `deleted_at` set
- [ ] [ ] Annulation: vérifier `deleted_at` NULL
- [ ] [ ] Cron test: appeler endpoint, vérifier log

### Performance & Security
- [ ] [ ] Page load < 3s (Lighthouse check)
- [ ] [ ] HTTPS actif (lock icon visible)
- [ ] [ ] Pas d'erreurs console (DevTools)
- [ ] [ ] Pas de secrets exposés (grep CLAUDE.md contents)
- [ ] [ ] CORS headers correct

---

## PHASE 7: Final Validation ⏳ (TODO)

### Legal Compliance
- [ ] [ ] Politique confidentialité conforme CNIL
- [ ] [ ] ROPA document complet + signé
- [ ] [ ] Droit d'accès implémenté (export endpoint)
- [ ] [ ] Droit d'oubli implémenté (soft-delete + cron)
- [ ] [ ] Droit de rectification possible (profil edit)
- [ ] [ ] Droit de portabilité implémenté (export)
- [ ] [ ] Consent management fonctionnel

### Documentation
- [ ] [ ] README.md à jour
- [ ] [ ] CLAUDE.md complet avec secrets
- [ ] [ ] Compliance folder complète
- [ ] [ ] Changelog mis à jour pour v1.0.0
- [ ] [ ] Patch notes créés

### Code Quality
- [ ] [ ] Pas de TODOs laissés
- [ ] [ ] Pas de console.log en prod
- [ ] [ ] Pas de hardcoded secrets
- [ ] [ ] Types TypeScript strict
- [ ] [ ] Import/export organized

### Git History
- [ ] [ ] Commits sont atomiques + bien nommés
- [ ] [ ] Pas de merge commits inutiles
- [ ] [ ] Tags v1.0.0 créé + pusher
- [ ] [ ] Branch main protégée

---

## PHASE 8: Go-Live ⏳ (TODO)

### Pre-Launch
- [ ] [ ] Toutes checklist phases 1-7 ✅
- [ ] [ ] Backup Supabase créé
- [ ] [ ] Rollback plan documenté
- [ ] [ ] Support email monitored (contact@nexart.fr)

### Launch Day
- [ ] [ ] Announce v1.0.0 (si applicable)
- [ ] [ ] Monitor logs Hostinger (premières heures)
- [ ] [ ] Vérifier pas d'erreurs de crash
- [ ] [ ] Test account suppression flow une fois en prod

### Post-Launch
- [ ] [ ] Vérifier cron hard-delete exécuté (jour 1)
- [ ] [ ] Recueillir feedback utilisateurs
- [ ] [ ] Fix bugs critiques rapidement
- [ ] [ ] Mettre à jour documentation

---

## Status Summary

| Phase | Status | Tests | Notes |
|-------|--------|-------|-------|
| 1: RGPD | ✅ Code | ⏳ Tests | Compliance fichiers créés |
| 2: Endpoints | ✅ Code | ⏳ Tests | Delete/Cancel/Cron prêts |
| 3: Frontend | ⏳ TODO | ⏳ Tests | Settings page manquante |
| 4: Config | ⏳ TODO | ⏳ Tests | Hostinger env à setup |
| 5: Deploy | ⏳ TODO | ⏳ Tests | Build + push en attente |
| 6: Smoke | ⏳ TODO | ⏳ Tests | Production checks |
| 7: Final | ⏳ TODO | ⏳ Tests | Validation légale |
| 8: Launch | ⏳ TODO | ⏳ Opéra | Go-live readiness |

**Next Step**: Phase 3 (Frontend Settings page + export endpoint)

---

## Notes Importantes

- **Pas de tests avant Phase 5** (selon instruction utilisateur)
- Tests endpoints endpoint après build complet
- Tous tests faits en production (Hostinger) après deploy
- Garde tokens secrets sécurisés (CLAUDE.md gitignored)
- Documenter tout changement dans CHANGELOG

**Estimated Time to v1.0.0**: 3-4 semaines (à partir d'ici)

Last updated: 27 juillet 2026
