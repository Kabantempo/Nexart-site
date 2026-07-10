# Registre des Traitements de Données Personnelles (ROPA)

**Nexart SAS**  
Marseille, France  
Document de conformité RGPD (Articles 30 & 32)  
Dernière mise à jour : 27 juillet 2026

---

## 1. RESPONSABLE DE TRAITEMENT

| Élément | Détail |
|--------|--------|
| **Entité** | Nexart SAS |
| **Siège** | Marseille, France |
| **Activité** | Plateforme marketplace (créateurs ↔ organisateurs) |
| **Contact RGPD** | contact@nexart.fr |
| **Représentant** | Kalvin (propriétaire) |

---

## 2. SOUS-TRAITANTS (Processeurs)

| Sous-traitant | Service | Base légale | Localisation | DPA |
|---|---|---|---|---|
| **Supabase** | Base données PostgreSQL | Contrat | EU (eu-central-1) | ✅ Signé |
| **Hostinger** | Hébergement Node.js | Contrat | EU | ✅ GDPR-compliant |
| **Resend** | Service emails | Contrat | EU | ✅ Signé |
| **Google Analytics / GTM** | Analytics (consentement requis) | Consentement | US (Privacy Shield/SCCs) | ✅ Conforme |

---

## 3. INVENTAIRE DES TRAITEMENTS

### Traitement A: Authentification & Gestion de Compte

**ID** : A-001  
**Catégorie** : Identité numérique

| Aspect | Détail |
|--------|--------|
| **Données** | Email, Mot de passe (hashé), ID utilisateur UUID |
| **Source** | L'utilisateur (formulaire signup) |
| **Finalité** | Authentifier utilisateur, accès plateforme |
| **Base légale** | Contrat (Article 6.1.b RGPD) |
| **Durée conservation** | Tant que compte actif + 30j après suppression (soft-delete) |
| **Durée hard-delete** | Après 30j |
| **Destinataires** | Kalvin (admin), Supabase (traitement) |
| **Droits** | Accès, rectification, suppression, portabilité |
| **Mesures sécurité** | HTTPS, mot de passe bcrypt, HTTPS seulement |

---

### Traitement B: Profil Utilisateur Public

**ID** : B-001  
**Catégorie** : Profil public

| Aspect | Détail |
|--------|--------|
| **Données** | Nom, Prénom, Bio, Photo profil, Disciplines/Tags, Localisation (ville/région), Évaluations/Notes |
| **Source** | L'utilisateur (remplissage formulaire profil) |
| **Finalité** | Permettre organisateurs découvrir créateurs, système de notation |
| **Base légale** | Intérêt légitime (Article 6.1.f RGPD) — pertinence plateforme |
| **Durée conservation** | Tant que compte actif + 30j après suppression |
| **Durée hard-delete** | Après 30j (anonymisation recommandée) |
| **Destinataires** | Public (lecture), Organisateurs (lecture complète si accepté), Kalvin (admin) |
| **Droits** | Accès, rectification, suppression, portabilité, opposition |
| **Mesures sécurité** | Pas données sensibles, contrôle d'accès RLS, HTTPS |
| **Transfert tiers** | Organisateurs lors candidature acceptée |

---

### Traitement C: Données Bancaires (IBAN)

**ID** : C-001  
**Catégorie** : Données financières (sensibles)

| Aspect | Détail |
|--------|--------|
| **Données** | IBAN, Titulaire compte, Historique virements |
| **Source** | L'utilisateur (ajout IBAN dans profil) |
| **Finalité** | Virements paiements créateurs (rémunération événements) |
| **Base légale** | Contrat (Article 6.1.b RGPD) — nécessaire exécution contrat |
| **Durée conservation** | 6 ans après dernier paiement (obligation comptable) |
| **Durée anonymisation** | Après 6 ans → anonymisation (conservation anonyme 1 an archive) |
| **Destinataires** | Service finance (Kalvin), Prestataire paiements, Supabase (traitement chiffré) |
| **Droits** | Accès, rectification, suppression, portabilité |
| **Mesures sécurité** | Chiffrement AES-256, RLS strict, accès Kalvin seul, HTTPS |
| **Incident protocol** | Notification email sous 72h si breach |

---

### Traitement D: Candidatures & Applications

**ID** : D-001  
**Catégorie** : Relation contractuelle

| Aspect | Détail |
|--------|--------|
| **Données** | Profil créateur, Statut candidature (pending/accepted/refused), Message candidature, Dates action |
| **Source** | Créateur → action candidature, Organisateur → décision |
| **Finalité** | Gérer candidatures à événements, tracking statut |
| **Base légale** | Contrat (Article 6.1.b RGPD) |
| **Durée conservation** | 2 ans après clôture événement (preuve légale) |
| **Durée anonymisation** | Après 2 ans → anonymification (stats conservées) |
| **Destinataires** | Organisateur événement (lecture), Créateur (lecture propre candidature), Kalvin (admin) |
| **Droits** | Accès, rectification (message avant acceptation), suppression, portabilité |
| **Mesures sécurité** | RLS par événement, HTTPS, audit logs |

---

### Traitement E: Contrats Signés (Conditions Générales)

**ID** : E-001  
**Catégorie** : Documentation légale

| Aspect | Détail |
|--------|--------|
| **Données** | Contrat PDF signé, Signatures numériques, IP signer, Timestamp signature |
| **Source** | Système signature électronique (DocuSign/similaire) |
| **Finalité** | Preuve légale engagement événement, archivage fiscal |
| **Base légale** | Obligation légale (Article 6.1.c RGPD) — preuves contrats |
| **Durée conservation** | 11 ans (6 ans impôts + 5 ans prescription civile) |
| **Durée anonymisation** | Après 11 ans → anonymification (conservation archive 1 an) |
| **Destinataires** | Expert-comptable, Autorités (sur demande mandat), Kalvin (admin) |
| **Droits** | Accès, rectification (données métadonnées), suppression après délai légal |
| **Mesures sécurité** | Chiffrement, archivage sécurisé, signature numérique, HTTPS |
| **Incident protocol** | Notification si accès non autorisé |

---

### Traitement F: Messages & Conversations

**ID** : F-001  
**Catégorie** : Communication

| Aspect | Détail |
|--------|--------|
| **Données** | Contenu messages, IDs participants, Timestamps, Pièces jointes |
| **Source** | Utilisateurs (envoi messages dans plateforme) |
| **Finalité** | Communication créateurs ↔ organisateurs (coordination événement) |
| **Base légale** | Contrat (Article 6.1.b RGPD) |
| **Durée conservation** | Tant que événement actif + 2 ans après clôture |
| **Durée suppression** | Après 2 ans → suppression (sauf si archivage spécifique) |
| **Destinataires** | Participants conversation, Kalvin (support/modération) |
| **Droits** | Accès, rectification (message propre), suppression, portabilité |
| **Mesures sécurité** | Chiffrement TLS, RLS par conversation, modération possible |
| **Modération** | Kalvin peut accéder pour abus/violations |

---

### Traitement G: Évaluations & Avis

**ID** : G-001  
**Catégorie** : Feedback utilisateur

| Aspect | Détail |
|--------|--------|
| **Données** | Note (1-5 étoiles), Commentaire review, Reviewer ID, Reviewed ID, Tags/categories, Date review |
| **Source** | Utilisateur (submission review après événement) |
| **Finalité** | Système réputation (créateurs/organisateurs), amélioration qualité |
| **Base légale** | Intérêt légitime (Article 6.1.f RGPD) + Contrat |
| **Durée conservation** | Illimitée (historique réputation) SAUF suppression compte → anonymification |
| **Anonymification** | Si compte supprimé : "Utilisateur anonyme" + conservation review |
| **Destinataires** | Public (affichage reviews), Reviewé (notifications), Kalvin (modération) |
| **Droits** | Accès, suppression propre review, rectification |
| **Mesures sécurité** | Modération possible (suppression abusive), RLS, HTTPS |
| **Modération** | Kalvin peut supprimer reviews violant CGU |

---

### Traitement H: Logs & Analytics

**ID** : H-001  
**Catégorie** : Analytics plateforme

| Aspect | Détail |
|--------|--------|
| **Données** | Adresse IP, User Agent (browser/OS), Pages visitées, Actions (clics, candidatures), Timestamps, Session ID |
| **Source** | Supabase logs, Google Analytics (si consentement), Hostinger logs |
| **Finalité** | Détecter bugs, améliorer UX, sécurité (détect piratage), stats utilisation |
| **Base légale** | Intérêt légitime (Article 6.1.f RGPD) — sécurité + amélioration service |
| **Durée conservation** | 30 jours (logs serveur), 13 mois (Google Analytics si consentement) |
| **Durée suppression** | Après 30j → suppression automatique logs, après 13 mois → suppression GA |
| **Destinataires** | Kalvin (debug/security), Google (Analytics — anonymisé) |
| **Droits** | Accès anonymisé (pas de drill-down IP), pas suppression individuelle |
| **Mesures sécurité** | Anonymisation IP, accès Kalvin seul, pas tracking crosssite |
| **Consentement** | GA = consentement via bandeau cookies (default "Refuser") |

---

### Traitement I: Cookies

**ID** : I-001  
**Catégorie** : Technologies tracking

| Aspect | Détail |
|--------|--------|
| **Cookies** | Session cookie (Supabase auth), CSRF token, Consentement cookie (js-cookie) |
| **Finalité** | Authentification, sécurité, tracking consentement |
| **Base légale** | Consentement (Article 6.1.a RGPD) pour cookies analytics |
| **Durée** | Session + 365 jours (consentement) |
| **Destinataires** | Browser utilisateur, Supabase |
| **Droits** | Droit de refuser, modifier paramètres browser |
| **Mesures sécurité** | HttpOnly flag (auth), Secure flag (HTTPS), SameSite=Strict |
| **Bandeau** | Affiché premier accès, default = "Refuser", "Accepter Tous" chargue GTM |

---

### Traitement J: Partage Données Organisateurs

**ID** : J-001  
**Catégorie** : Partage contrôlé tiers

| Aspect | Détail |
|--------|--------|
| **Données partagées** | Profil public créateur (nom, bio, disciplines), Email (si candidature acceptée), Historique acceptances |
| **Conditions** | Uniquement si candidature créée + organisateur visualise |
| **Finalité** | Permettre organisateur évaluer créateur, contact |
| **Base légale** | Contrat (Article 6.1.b RGPD) — nécessaire pour service |
| **Durée** | Tant que événement actif + 2 ans après |
| **Destinataires** | Organisateur événement uniquement |
| **Droits** | Accès (voir données partagées), suppression (après délai) |
| **Mesures sécurité** | RLS — organisateur ne voit QUE candidatures propres événements |
| **Limitation** | Données bancaires JAMAIS partagées |

---

### Traitement K: Backup & Suppression (Soft-Delete)

**ID** : K-001  
**Catégorie** : Conformité droit oubli

| Aspect | Détail |
|--------|--------|
| **Données** | Copie complète profil utilisateur avant hard-delete |
| **Finalité** | Implémenter droit rétractation 30j (soft-delete), preuve suppression |
| **Base légale** | Obligation légale (Article 17 RGPD — droit oubli) |
| **Stockage** | Table `deleted_user_backups` (Supabase) |
| **Durée** | 30 jours après soft-delete, puis hard-delete automatique |
| **Destinataires** | Kalvin uniquement (vérification suppression) |
| **Droits** | Droit rétractation (annuler suppression dans 30j) |
| **Mesures sécurité** | RLS strict, chiffrement, logs accès |
| **Automatisation** | Cron job chaque nuit → hard-delete après 30j |

---

## 4. IMPACTS RGPD PAR DROIT

### Droit d'Accès (Article 15)
- **Implémentation** : Email → contact@nexart.fr + endpoint `/api/account/export-data` (TODO)
- **Format** : JSON/CSV téléchargeable
- **Délai** : 30 jours max
- **Gratuit** : 1 accès/an gratuit, autres payants (€0 pour v1.0)

### Droit de Rectification (Article 16)
- **Implémentation** : Profil settings → modifier email/bio/localisation
- **Délai** : Immédiat
- **Historique** : Conservé pour audit

### Droit à l'Oubli (Article 17)
- **Implémentation** : Settings → "Supprimer mon compte"
- **Étapes** :
  1. Soft-delete immédiat (user.deleted_at = now)
  2. Backup créé (deleted_user_backups table)
  3. Email confirmation + lien annulation (24h)
  4. Après 30j → Hard-delete automatique
- **Exception** : Contrats restent 11 ans (obligation légale)

### Droit à la Portabilité (Article 20)
- **Implémentation** : Endpoint `/api/account/export-data`
- **Format** : JSON machine-readable
- **Délai** : 30 jours

### Droit d'Opposition (Article 21)
- **Implémentation** : Unsubscribe emails marketing
- **Stockage** : `user.unsubscribe_marketing = true`
- **Respect** : Pas d'emails marketing après opt-out

---

## 5. ÉVALUATION RISQUES (DPIA - Analyse d'Impact)

### Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| **Breach données bancaires** | Basse | CRITIQUE | Chiffrement AES-256, accès Kalvin seul, audit logs |
| **Fuite profils privés** | Très basse | Moyen | RLS Supabase, HTTPS, pas stockage plaintext |
| **Suppression incomplète** | Basse | Moyen | Soft-delete 30j + backup, cron hard-delete |
| **Emails non-consentis** | Très basse | Faible | Consentement explicite, unsubscribe fonctionnel |
| **Transferts non-autorisés** | Très basse | Moyen | RLS, destinataires liés à données, documenté ROPA |

### Pas de DPIA complète requise
- Traitement non-massif (< 10k utilisateurs actuellement)
- Pas de données sensibles (sauf IBAN = traitement protégé séparé)
- Pas de profilage/scoring algorithmique
- Pas de tracking crosssite

---

## 6. CONFORMITÉ RGPD

### Checklist
- ✅ Registre traitements complété (ce document)
- ✅ Sous-traitants documentés + DPA signés
- ✅ Mesures sécurité implémentées
- ✅ Droits utilisateurs accessibles
- ✅ Soft-delete 30j avant hard-delete
- ✅ Bandeau consentement cookies (default "Refuser")
- ✅ Politique confidentialité publiée (`/confidentialite`)
- ⏳ Contact CNIL si données sensibles massives

### Procédures Documentation
- **Incident data** : Notification contact@nexart.fr sous 72h
- **Demandes droits** : Traiter email contact@nexart.fr dans 30 jours
- **Mise à jour ROPA** : Annuellement + après ajout traitement

---

## 7. HISTORIQUE

| Date | Version | Changements |
|------|---------|-------------|
| 27 juil 2026 | 1.0 | Création ROPA initiale (traitements A-K) |

---

**Document conforme RGPD Article 30**  
**Responsable données : contact@nexart.fr**
