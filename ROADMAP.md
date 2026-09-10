# Nexart — Roadmap et versions

**État au 09/09/26** : v1.5.0 en production sur https://nexart.fr
**Ce fichier était resté figé à v0.8.0 jusqu'au 09/09/26.** Le journal de bord fait foi : `Claude/work-log.md`.

---

## Historique — ce qui est livré

| Version | Contenu | Journal |
|---------|---------|---------|
| Fondation | Auth, DB Supabase, profils créateur/organisateur, candidatures, messagerie, carte | ~28/06/26 |
| v0.9.0 | Polish : géolocalisation, filtres persistants, loading states, toasts, mobile, validation | ~05/07/26 |
| v1.0.0 | RGPD complet (confidentialité, CGU, mentions légales), suppression et export de compte, audit logs, modération, outils organisateurs | 11/07/26 |
| v1.1.0 | Analytics organisateur, SIRET, filtres avancés, messages groupés, dark mode | 20/07/26 |
| v1.2.0 | Plan de stands, bénévoles, checklists, équipe, FAQ, suite marketing | 10/07/26 |
| v1.3.0 | Admin panel, documents d'événement, planning bénévoles, QA Playwright | 10/07/26 |
| v1.4.0 | Design system, SEO, Lighthouse, Stripe LIVE | 01/08 + 15/08/26 |
| v1.5.0 | Sécurité (bypass admin corrigés), slugs événements, GitHub Actions, Stripe backend, revenus organisateur, paiements créateur | 30/08/26 |
| v1.5.x | Stripe Connect, refonte bénévoles mobile, dark mode complet, refonte pages créateurs et événements, éditeur de page créateur | 01/09 au 09/09/26 |
| v2.0.0 | Programme de parrainage (partiel) | 15/08/26 |

---

## Chantiers ouverts — constatés le 09/09/26

### Dette technique
- [x] Code de production non versionné (~30 fichiers) — PR #221
- [x] Build GitHub Actions cassé (`verified-badge` manquant) — PR #221
- [x] `saved-searches-notify` planifié deux fois par jour (`cron.yml` + `cron-jobs.yml`) — fusionné
- [x] `CRON_SECRET_TOKEN` : secret GitHub resynchronisé sur le `.env` serveur le 09/09/26
- [ ] 4 routes cron sans planificateur GitHub : `cleanup-audit-logs`, `close-expired-events`, `stand-reminder-7days`, `volunteer-reminders` — vérifier EasyCron avant d'ajouter
- [x] PRs en souffrance triées : #201 et #141 fermées (déjà dans main / déjà en prod), #138 refaite depuis main en #224
- [x] `/blog` supprimé — pages, données et CSS mort retirés, `/blog` et `/blog/:path*` redirigés en 301 vers l'accueil
- [ ] `npx tsc --noEmit` : 53 erreurs, dont la majorité vient de `types/supabase.ts` généré sur un schéma à 61 tables alors que la prod en a 67. Le CI reste rouge tant que ce n'est pas repris.
- [ ] `next/font` télécharge Syne depuis Google Fonts à chaque build : un aléa réseau fait échouer le déploiement (arrivé le 09/09/26). À self-host.
- [ ] Tables Supabase en doublon : `exhibitor_*` (ancien) et `event_exhibitor_*` (actuel)

### Produit — à trancher
Le produit couvre déjà tout le parcours organisateur et créateur. La question n'est plus
« quelle fonctionnalité ajouter » mais « comment amener les premiers organisateurs et créateurs
réels dessus ». À arbitrer avant de lancer une v1.6.0 :

- Option A — **Acquisition** : parcours d'inscription et d'onboarding testés de bout en bout sur
  un vrai événement, avec un organisateur pilote.
- Option B — **Consolidation** : couverture de tests, monitoring, performance, avant d'ouvrir.
- Option C — **v2.0.0 mini-boutique** : voir `docs/TODO-v2.0.0.md` (dépend d'un volume d'utilisateurs
  qui n'existe pas encore).

---

## Process

### Versions
1. `npm run bump-version X.Y.Z`
2. Mettre à jour ce fichier
3. Tag : `git tag -a vX.Y.Z -m "vX.Y.Z: description"`

### Git
- Jamais de push direct sur `main`. Branche `feature/xxx` ou `fix/xxx`, puis PR.
- Conventional commits obligatoires.

### Déploiement
Automatique : tout push sur `main` déclenche `.github/workflows/deploy-hostinger.yml`
(build, rsync du standalone vers le VPS, restart). `deploy.sh` reste le secours manuel.

**Avant tout déploiement manuel, `git status` doit être propre** — c'est ce qui a cassé le build
CI le 08/09/26.
