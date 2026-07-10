# TODO AUDIT RGPD v1.0.0

**Timeline**: 27 juil - 8 août 2026 (14 jours)  
**Status**: Phase 1/5 ✅ | Phase 2-5 🚀 en cours

---

## ✅ COMPLÉTÉ

- [x] **JOUR 1** : Setup Compliance folder + Supabase DPA (27 juil)
  - [x] mkdir Compliance/Contrats_Fournisseurs
  - [x] Copier Supabase_DPA.pdf
  - [x] Commit git

---

## 🚀 À FAIRE

### JOUR 2-3 (VENDREDI-SAMEDI 28-29 juil) : POLITIQUE CONFIDENTIALITÉ
- [ ] Créer `/app/confidentialite/page.mdx`
- [ ] Copy-paste contenu (fourni par Claude)
- [ ] Remplacer infos:
  - [ ] contact@nexart.fr ✅
  - [ ] GTM-PC469WF9 ✅
  - [ ] eu-central-1 ✅
- [ ] Test local: http://localhost:3000/confidentialite
- [ ] Deploy Hostinger
- [ ] Test public: https://nexart.fr/confidentialite

**Durée**: 2h | **Responsable**: Kalvin

---

### JOUR 4-5 (DIMANCHE-LUNDI 30-31 juil) : BANDEAU COOKIES
- [ ] Créer `/components/CookieConsent.tsx` (fichier fourni)
- [ ] Update `/app/layout.tsx` (ajouter composant)
- [ ] `npm install js-cookie` (si nécessaire)
- [ ] Test local: bandeau visible, default "Refuser"
- [ ] Deploy Hostinger
- [ ] Test public: nexart.fr bandeau cookies

**Durée**: 1.5h | **Responsable**: Kalvin

---

### JOUR 6-7 (MARDI-MERCREDI 1-2 août) : REGISTRE TRAITEMENTS
- [ ] Créer `/Compliance/Registre_Traitements_Nexart.md` (fichier fourni)
- [ ] Vérifier toutes infos pré-remplies:
  - [ ] contact@nexart.fr ✅
  - [ ] Hostinger ✅
  - [ ] Supabase DPA ✅
  - [ ] Google Analytics ✅
- [ ] Signer: "Signé Kalvin le [date]"
- [ ] Commit git

**Durée**: 1h | **Responsable**: Kalvin

---

### JOUR 8-9 (MERCREDI-JEUDI 2-3 août) : SUPPRESSION COMPTE
- [ ] Créer tables Supabase (SQL fourni)
  - [ ] `deleted_user_backups`
  - [ ] `deleted_at` colonne
- [ ] Créer `/app/api/user/delete-account/route.ts` (fichier fourni)
- [ ] Créer `/app/settings/delete-account/page.tsx` (fichier fourni)
- [ ] Test local: Crée compte → Settings → Delete → Email reçu
- [ ] Deploy Hostinger
- [ ] Test public: flow complet fonctionnel

**Durée**: 3h | **Responsable**: Kalvin

---

### JOUR 10 (VENDREDI 4 août) : CRON HARD-DELETE
- [ ] Choisir option:
  - [ ] Option A: Script Node.js + cron Hostinger
  - [ ] Option B: Service externe (EasyCron)
- [ ] Implémenter hard-delete automatique (30j après soft-delete)
- [ ] Test: Créer compte → Delete → Vérifier hard-delete après 30j
- [ ] Commit git

**Durée**: 1h | **Responsable**: Kalvin

---

### JOUR 11-12 (SAMEDI-DIMANCHE 5-6 août) : DOCUMENTATION
- [ ] Créer `/Compliance/Procedure_Droits_RGPD.md` (fichier fourni)
- [ ] Créer `/Compliance/README.md` (fichier fourni)
- [ ] Créer dossiers:
  - [ ] `Compliance/Demandes_RGPD/`
  - [ ] `Compliance/Suppressions/`
  - [ ] `Compliance/Incidents/`
- [ ] Commit git

**Durée**: 1h | **Responsable**: Kalvin

---

### JOUR 13-14 (LUNDI-MARDI 7-8 août) : FINAL CHECKS
- [ ] Vérifier toutes pages live:
  - [ ] https://nexart.fr/confidentialite ✅
  - [ ] Bandeau cookies ✅
  - [ ] /settings/delete-account ✅
- [ ] Tester flow complet:
  - [ ] Signup → Confidentialité acceptée
  - [ ] Analytics consentement fonctionne
  - [ ] Suppression compte fonctionnelle
  - [ ] Email confirmation reçu
- [ ] Vérifier git logs (5 commits RGPD)
- [ ] Prêt pour v1.0.0 launch

**Durée**: 1h | **Responsable**: Kalvin

---

## 📊 STATISTIQUES

| Phase | Durée | Status |
|-------|-------|--------|
| 1. Setup | 30 min | ✅ DONE |
| 2. Politique | 2h | 🚀 Prochain |
| 3. Cookies | 1.5h | 📅 Après phase 2 |
| 4. Registre | 1h | 📅 Après phase 3 |
| 5. Suppression | 3h | 📅 Après phase 4 |
| 6. Cron | 1h | 📅 Après phase 5 |
| 7. Documentation | 1h | 📅 Après phase 6 |
| 8. Final | 1h | 📅 Après phase 7 |
| **TOTAL** | **~11h** | **🎯 Par 8 août** |

---

## 🎯 PROCHAINE ACTION

**JOUR 2 (VENDREDI 28 juil - MATIN)** :

Attendre les fichiers de Claude pour:
1. `/app/confidentialite/page.mdx`
2. `/components/CookieConsent.tsx`
3. SQL Supabase

→ Claude fournit tout demain matin

---

**Signé**: Kalvin  
**Créé**: 27 juillet 2026  
**Mise à jour**: À chaque étape
