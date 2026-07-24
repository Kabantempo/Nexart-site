# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation — Structure et liens globaux >> navbar est présente et contient les liens principaux
- Location: tests/e2e/navigation.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav').first().locator('a[href="/events"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav').first().locator('a[href="/events"]').first()

```

```yaml
- link "Aller au contenu principal":
  - /url: "#main-content"
- banner:
  - link "Nexart Nexart":
    - /url: /
    - img "Nexart"
    - text: Nexart
  - navigation:
    - button "Découvrir"
    - link "Offres":
      - /url: /offres
  - button
  - button "Passer en mode sombre"
  - link "Connexion":
    - /url: /login
  - link "S'inscrire":
    - /url: /register
- main:
  - text: La plateforme des artisans
  - heading "Exposez vos créations dans les meilleurs événements" [level=1]
  - paragraph: Nexart connecte créateurs et organisateurs d'événements artisanaux — marchés, pop-ups, salons, festivals.
  - link "S'inscrire gratuitement":
    - /url: /register
  - link "Explorer les événements":
    - /url: /events
  - paragraph: Gratuit pour les créateurs · Pas de carte bancaire requise
  - text: Céramique Illustration Bijouterie Maroquinerie Textile Photographie Sculpture Peinture Verrerie Broderie Cosmétique Papeterie Lutherie Gravure Forge artisanale Céramique Illustration Bijouterie Maroquinerie Textile Photographie Sculpture Peinture Verrerie Broderie Cosmétique Papeterie Lutherie Gravure Forge artisanale Céramique Illustration Bijouterie Maroquinerie Textile Photographie Sculpture Peinture Verrerie Broderie Cosmétique Papeterie Lutherie Gravure Forge artisanale
  - paragraph: Créateurs · Organisateurs · Visiteurs
  - heading "Pour qui est Nexart ?" [level=2]
  - paragraph: Créateurs
  - heading "Exposez sans galère." [level=3]
  - paragraph: Un profil, toutes les opportunités. Candidatez en 2 minutes, suivez vos réponses en temps réel.
  - list:
    - listitem:
      - paragraph: Candidature en 2 min
      - paragraph: Aucun email, aucun formulaire à rallonge.
    - listitem:
      - paragraph: Matching intelligent
      - paragraph: Les événements qui vous correspondent remontent en priorité.
    - listitem:
      - paragraph: Suivi en temps réel
      - paragraph: Notifications et timeline de statut instantanés.
    - listitem:
      - paragraph: Profil vérifiable
      - paragraph: SIRET, portfolio, avis — tout en un seul endroit.
  - link "Créer mon profil":
    - /url: /register
  - paragraph: Organisateurs
  - heading "Remplissez vos stands." [level=3]
  - paragraph: Publiez votre événement, recevez des candidatures qualifiées et gérez tout depuis votre tableau de bord.
  - list:
    - listitem:
      - paragraph: Publication en 5 min
      - paragraph: Dates, stands, critères — votre événement est en ligne immédiatement.
    - listitem:
      - paragraph: Candidatures triées
      - paragraph: Filtrez par discipline, ville, profil vérifié.
    - listitem:
      - paragraph: Événement validé
      - paragraph: Notre équipe vérifie chaque publication. Zéro arnaque.
    - listitem:
      - paragraph: Gestion centralisée
      - paragraph: Acceptez, refusez, communiquez — tout depuis un seul dashboard.
  - link "Publier un événement":
    - /url: /register
  - paragraph: Visiteurs
  - heading "Découvrez. Réservez. Soutenez." [level=3]
  - paragraph: Trouvez les marchés et événements artisanaux près de chez vous, réservez votre place et explorez les créateurs.
  - list:
    - listitem:
      - paragraph: Événements près de toi
      - paragraph: Géolocalisation et filtres par type, date, distance.
    - listitem:
      - paragraph: Portfolios créateurs
      - paragraph: Parcourez les artisans inscrits avant même le jour J.
    - listitem:
      - paragraph: Réservation de place
      - paragraph: Réservez votre entrée en quelques secondes.
    - listitem:
      - paragraph: Alertes personnalisées
      - paragraph: Notifié dès qu'un événement correspond à vos intérêts.
  - link "Explorer les événements":
    - /url: /events
  - paragraph: Ils nous font confiance
  - heading "Ce qu'ils en disent" [level=2]
  - paragraph: "\"Nexart m'a permis de remplir mon calendrier pour 6 mois. Incroyable.\""
  - text: ML
  - paragraph: Marie L.
  - paragraph: Céramiste
  - paragraph: "\"J'ai candidaté à 12 événements en une soirée. L'interface est parfaite.\""
  - text: TR
  - paragraph: Théo R.
  - paragraph: Illustrateur
  - paragraph: "\"Enfin un outil pensé par des artisans, pour des artisans.\""
  - text: CM
  - paragraph: Claire M.
  - paragraph: Bijoutière
  - paragraph: "\"J'ai trouvé des événements que je n'aurais jamais découverts autrement.\""
  - text: AB
  - paragraph: Antoine B.
  - paragraph: Photographe
  - paragraph: "\"Les organisateurs via Nexart sont sérieux. Zéro mauvaise surprise.\""
  - text: SD
  - paragraph: Sophie D.
  - paragraph: Maroquinière
  - paragraph: "\"Candidature envoyée, réponse en 24h. Exactement ce qu'il me fallait.\""
  - text: LP
  - paragraph: Lucas P.
  - paragraph: Sculpteur
  - paragraph: "\"Nexart m'a permis de remplir mon calendrier pour 6 mois. Incroyable.\""
  - text: ML
  - paragraph: Marie L.
  - paragraph: Céramiste
  - paragraph: "\"J'ai candidaté à 12 événements en une soirée. L'interface est parfaite.\""
  - text: TR
  - paragraph: Théo R.
  - paragraph: Illustrateur
  - paragraph: "\"Enfin un outil pensé par des artisans, pour des artisans.\""
  - text: CM
  - paragraph: Claire M.
  - paragraph: Bijoutière
  - paragraph: "\"J'ai trouvé des événements que je n'aurais jamais découverts autrement.\""
  - text: AB
  - paragraph: Antoine B.
  - paragraph: Photographe
  - paragraph: "\"Les organisateurs via Nexart sont sérieux. Zéro mauvaise surprise.\""
  - text: SD
  - paragraph: Sophie D.
  - paragraph: Maroquinière
  - paragraph: "\"Candidature envoyée, réponse en 24h. Exactement ce qu'il me fallait.\""
  - text: LP
  - paragraph: Lucas P.
  - paragraph: Sculpteur
  - paragraph: "\"Mon stand était complet pour la première fois. Merci Nexart.\""
  - text: EV
  - paragraph: Emma V.
  - paragraph: Potière
  - paragraph: "\"Interface impeccable, candidature en 2 minutes chrono.\""
  - text: JH
  - paragraph: Jules H.
  - paragraph: Peintre
  - paragraph: "\"Nexart a changé ma façon de développer mon activité artisanale.\""
  - text: CT
  - paragraph: Camille T.
  - paragraph: Textilière
  - paragraph: "\"La transparence sur les stands disponibles est vraiment appréciable.\""
  - text: HM
  - paragraph: Hugo M.
  - paragraph: Graveur
  - paragraph: "\"Je recommande à tous les artisans qui cherchent à se développer.\""
  - text: AR
  - paragraph: Alice R.
  - paragraph: Broderie
  - paragraph: "\"Le suivi des candidatures est clair et bien fait. Top.\""
  - text: MD
  - paragraph: Marc D.
  - paragraph: Luthier
  - paragraph: "\"Mon stand était complet pour la première fois. Merci Nexart.\""
  - text: EV
  - paragraph: Emma V.
  - paragraph: Potière
  - paragraph: "\"Interface impeccable, candidature en 2 minutes chrono.\""
  - text: JH
  - paragraph: Jules H.
  - paragraph: Peintre
  - paragraph: "\"Nexart a changé ma façon de développer mon activité artisanale.\""
  - text: CT
  - paragraph: Camille T.
  - paragraph: Textilière
  - paragraph: "\"La transparence sur les stands disponibles est vraiment appréciable.\""
  - text: HM
  - paragraph: Hugo M.
  - paragraph: Graveur
  - paragraph: "\"Je recommande à tous les artisans qui cherchent à se développer.\""
  - text: AR
  - paragraph: Alice R.
  - paragraph: Broderie
  - paragraph: "\"Le suivi des candidatures est clair et bien fait. Top.\""
  - text: MD
  - paragraph: Marc D.
  - paragraph: Luthier
  - paragraph: En 3 étapes
  - heading "Simple comme bonjour" [level=2]
  - text: "01"
  - heading "Créez votre profil" [level=3]
  - paragraph: Photos, disciplines, tarifs — en moins de 10 minutes.
  - text: "02"
  - heading "Explorez les événements" [level=3]
  - paragraph: Filtrez par type, date, ville ou nombre de stands.
  - text: "03"
  - heading "Postulez & exposez" [level=3]
  - paragraph: Recevez une réponse et préparez votre stand.
  - heading "Pour qui est Nexart ?" [level=2]
  - text: Créateurs
  - heading "Trouvez vos prochains événements" [level=3]
  - paragraph: Candidatez aux marchés, pop-ups et salons qui correspondent à votre univers créatif.
  - list:
    - listitem: Profil créateur en 10 min
    - listitem: Candidature en 2 clics
    - listitem: Suivi en temps réel
  - link "Créer mon profil":
    - /url: /register?role=creator
  - text: Organisateurs
  - heading "Remplissez vos événements" [level=3]
  - paragraph: Publiez votre événement et recevez des candidatures qualifiées en quelques heures.
  - list:
    - listitem: Publication en 5 min
    - listitem: Candidatures qualifiées auto
    - listitem: Gestion des stands simplifiée
  - link "Publier un événement":
    - /url: /register?role=organizer
  - text: Visiteurs
  - heading "Découvrez les marchés près de toi" [level=3]
  - paragraph: Trouvez les événements artisanaux autour de vous, réservez votre place et explorez les créateurs.
  - list:
    - listitem: Événements géolocalisés
    - listitem: Portfolios créateurs
    - listitem: Réservation en 2 clics
  - link "Explorer les événements":
    - /url: /events
  - paragraph: Bientôt disponible
  - heading "Nexart dans votre poche" [level=2]
  - paragraph: Candidatez, suivez vos marchés et échangez avec les organisateurs — où que vous soyez.
  - img
  - paragraph: Bientôt sur
  - paragraph: App Store
  - img
  - paragraph: Bientôt sur
  - paragraph: Google Play
  - text: 9:41
  - paragraph: Bonjour, Marie
  - heading "Événements près de toi" [level=3]
  - text: Rechercher… À proximité Voir tout
  - paragraph: Marché de Noël — Paris 12e
  - text: Marché · 14–16 déc. Voir
  - paragraph: Pop-up Créateurs Montmartre
  - text: Pop-up · 20 jan. Voir
  - paragraph: Salon du Fait Main Lyon
  - text: Salon · 3–5 fév. Voir
  - paragraph: Rejoignez la communauté
  - heading "Prêt à exposer vos créations ?" [level=2]
  - paragraph: Rejoignez 2 400 créateurs et 380 événements qui font confiance à Nexart.
  - link "S'inscrire gratuitement":
    - /url: /register
  - link "Explorer":
    - /url: /events
- contentinfo:
  - link "Nexart Nexart":
    - /url: /
    - img "Nexart"
    - text: Nexart
  - paragraph: La plateforme qui connecte créateurs artisanaux et organisateurs d'événements en France.
  - paragraph: Newsletter
  - textbox "votre@email.fr"
  - button
  - paragraph: Pour créateurs
  - navigation:
    - link "Parcourir les événements":
      - /url: /events
    - link "Comment ça marche":
      - /url: /about
    - link "S'inscrire":
      - /url: /register
    - link "Contact":
      - /url: /contact
  - paragraph: Pour organisateurs
  - navigation:
    - link "Créer un événement":
      - /url: /events
    - link "Trouver des créateurs":
      - /url: /creators
    - link "Offres & tarifs":
      - /url: /offres
    - link "S'inscrire":
      - /url: /register
  - paragraph: Pour visiteurs
  - navigation:
    - link "Carte interactive":
      - /url: /carte
    - link "Événements près de moi":
      - /url: /events
    - link "Découvrir les créateurs":
      - /url: /creators
    - link "S'inscrire":
      - /url: /register
  - paragraph: Ressources
  - navigation:
    - link "Patch Notes":
      - /url: /patch-notes
    - link "Carnet de route":
      - /url: /carnet-de-route
    - link "À propos":
      - /url: /about
  - paragraph: Nous suivre
  - link "Site web":
    - /url: "#"
  - link "Twitter / X":
    - /url: "#"
  - link "Instagram":
    - /url: "#"
  - link "Contact":
    - /url: "#"
  - paragraph: © 2026 Nexart. Tous droits réservés.
  - navigation:
    - link "Conditions d'utilisation":
      - /url: /conditions
    - link "Politique de confidentialité":
      - /url: /confidentialite
    - link "Mentions légales":
      - /url: /mentions-legales
    - link "Contact support":
      - /url: /contact
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Navigation — Structure et liens globaux', () => {
  4  |   test('homepage charge (HTTP 200)', async ({ page }) => {
  5  |     const response = await page.goto('/')
  6  |     expect(response?.status()).toBe(200)
  7  |     await expect(page).toHaveTitle(/Nexart/)
  8  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  9  |   })
  10 | 
  11 |   test('navbar est présente et contient les liens principaux', async ({ page }) => {
  12 |     await page.goto('/')
  13 |     const nav = page.locator('nav').first()
  14 |     await expect(nav).toBeVisible({ timeout: 10000 })
> 15 |     await expect(nav.locator('a[href="/events"]').first()).toBeVisible()
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  16 |     await expect(nav.locator('a[href="/creators"]').first()).toBeVisible()
  17 |   })
  18 | 
  19 |   test('lien footer /conditions fonctionne', async ({ page }) => {
  20 |     await page.goto('/')
  21 |     await page.waitForLoadState('networkidle')
  22 |     const conditionsLink = page.locator('footer a[href*="conditions"], a[href="/conditions"]').first()
  23 |     if (await conditionsLink.isVisible()) {
  24 |       await conditionsLink.click()
  25 |       await expect(page).toHaveURL(/conditions/)
  26 |       await expect(page).toHaveTitle(/Nexart/)
  27 |       await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  28 |     } else {
  29 |       // Naviguer directement si le lien n'est pas dans le viewport
  30 |       const response = await page.goto('/conditions')
  31 |       expect(response?.status()).toBe(200)
  32 |       await expect(page).toHaveTitle(/Nexart/)
  33 |     }
  34 |   })
  35 | 
  36 |   test('lien footer /mentions-legales fonctionne', async ({ page }) => {
  37 |     await page.goto('/')
  38 |     await page.waitForLoadState('networkidle')
  39 |     const mentionsLink = page.locator('footer a[href*="mentions-legales"], a[href="/mentions-legales"]').first()
  40 |     if (await mentionsLink.isVisible()) {
  41 |       await mentionsLink.click()
  42 |       await expect(page).toHaveURL(/mentions-legales/)
  43 |       await expect(page).toHaveTitle(/Nexart/)
  44 |       await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  45 |     } else {
  46 |       const response = await page.goto('/mentions-legales')
  47 |       expect(response?.status()).toBe(200)
  48 |       await expect(page).toHaveTitle(/Nexart/)
  49 |     }
  50 |   })
  51 | 
  52 |   test('page /conditions charge directement (HTTP 200)', async ({ page }) => {
  53 |     const response = await page.goto('/conditions')
  54 |     expect(response?.status()).toBe(200)
  55 |     await expect(page).toHaveTitle(/Nexart/)
  56 |     await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  57 |   })
  58 | 
  59 |   test('page /mentions-legales charge directement (HTTP 200)', async ({ page }) => {
  60 |     const response = await page.goto('/mentions-legales')
  61 |     expect(response?.status()).toBe(200)
  62 |     await expect(page).toHaveTitle(/Nexart/)
  63 |     await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  64 |   })
  65 | 
  66 |   test('routes inconnues retournent une page 404 propre', async ({ page }) => {
  67 |     await page.goto('/cette-page-nexiste-pas-123')
  68 |     // Next.js retourne 404 mais la page doit rester sur le domaine Nexart
  69 |     await expect(page).toHaveTitle(/Nexart|404|Introuvable|Not Found/)
  70 |     // Pas de page blanche ou erreur serveur non gérée
  71 |     await expect(page.locator('body')).not.toBeEmpty()
  72 |   })
  73 | })
  74 | 
```