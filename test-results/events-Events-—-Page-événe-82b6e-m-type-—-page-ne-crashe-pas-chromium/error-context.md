# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: events.spec.ts >> Events — Page événements >> filtre via query param ?type= — page ne crashe pas
- Location: tests/e2e/events.spec.ts:54:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('h1').first()

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
- main
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
  3  | test.describe('Events — Page événements', () => {
  4  |   test('page /events charge et affiche du contenu ou un état vide propre', async ({ page }) => {
  5  |     await page.goto('/events')
  6  |     await page.waitForLoadState('networkidle')
  7  |     await expect(page).toHaveTitle(/Nexart/)
  8  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  9  |     // La page doit afficher soit des cards, soit un message "aucun événement" — pas un crash
  10 |     const hasCards = await page.locator(
  11 |       '[data-testid="event-card"], article, [class*="event"], [class*="card"], [class*="skeleton"]'
  12 |     ).first().isVisible().catch(() => false)
  13 |     const hasEmptyState = await page.locator(
  14 |       '[data-testid="empty"], p:has-text("aucun"), p:has-text("Aucun"), p:has-text("pas d\'événement")'
  15 |     ).first().isVisible().catch(() => false)
  16 |     // Au moins l'un des deux doit être vrai, ou la page est simplement chargée (h1 suffit)
  17 |     expect(true).toBe(true)
  18 |   })
  19 | 
  20 |   test('filtres disciplines — sélection modifie l\'URL ou le contenu', async ({ page }) => {
  21 |     await page.goto('/events')
  22 |     await page.waitForLoadState('networkidle')
  23 |     // Chercher un filtre discipline (select, bouton, lien, checkbox)
  24 |     const filterSelect = page.locator(
  25 |       'select[name*="discipline"], select[name*="type"], select[id*="discipline"]'
  26 |     ).first()
  27 |     const filterButton = page.locator(
  28 |       'button:has-text("Pop-up"), button:has-text("Marché"), button:has-text("Atelier"), a:has-text("Pop-up")'
  29 |     ).first()
  30 | 
  31 |     if (await filterSelect.isVisible()) {
  32 |       const urlBefore = page.url()
  33 |       await filterSelect.selectOption({ index: 1 })
  34 |       await page.waitForTimeout(500)
  35 |       // L'URL ou le contenu a changé
  36 |       expect(true).toBe(true)
  37 |     } else if (await filterButton.isVisible()) {
  38 |       const urlBefore = page.url()
  39 |       await filterButton.click()
  40 |       await page.waitForTimeout(500)
  41 |       expect(true).toBe(true)
  42 |     } else {
  43 |       // Pas de filtre visible — test passe (fonctionnalité optionnelle)
  44 |       expect(true).toBe(true)
  45 |     }
  46 |   })
  47 | 
  48 |   test('filtre via query param ?discipline= — page ne crashe pas', async ({ page }) => {
  49 |     await page.goto('/events?discipline=ceramique')
  50 |     await expect(page).toHaveTitle(/Nexart/)
  51 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  52 |   })
  53 | 
  54 |   test('filtre via query param ?type= — page ne crashe pas', async ({ page }) => {
  55 |     await page.goto('/events?type=marche')
  56 |     await expect(page).toHaveTitle(/Nexart/)
> 57 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
     |                                              ^ Error: expect(locator).toBeVisible() failed
  58 |   })
  59 | 
  60 |   test('navigation vers la page détail d\'un événement', async ({ page }) => {
  61 |     await page.goto('/events')
  62 |     await page.waitForLoadState('networkidle')
  63 |     // Chercher un lien vers un événement
  64 |     const eventLink = page.locator(
  65 |       'a[href*="/events/"], [data-testid="event-card"] a, article a'
  66 |     ).first()
  67 |     if (await eventLink.isVisible()) {
  68 |       const href = await eventLink.getAttribute('href')
  69 |       await eventLink.click()
  70 |       // La page détail doit charger (soit avec le bon URL soit sans erreur 500)
  71 |       await page.waitForLoadState('domcontentloaded')
  72 |       await expect(page).not.toHaveURL(/error|404/)
  73 |       await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })
  74 |     } else {
  75 |       // Aucun événement en base — naviguer vers un ID fictif et vérifier la page 404 propre
  76 |       await page.goto('/events/not-found-test')
  77 |       await expect(page).toHaveTitle(/Nexart|404|Introuvable/)
  78 |     }
  79 |   })
  80 | })
  81 | 
```