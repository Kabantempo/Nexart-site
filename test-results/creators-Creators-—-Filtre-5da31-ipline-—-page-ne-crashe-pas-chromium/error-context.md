# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: creators.spec.ts >> Creators — Filtres créateurs >> filtres par discipline — page ne crashe pas
- Location: tests/e2e/creators.spec.ts:43:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
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
  3  | test.describe('Creators — Filtres créateurs', () => {
  4  |   test('page /creators charge avec du contenu ou un skeleton', async ({ page }) => {
  5  |     await page.goto('/creators')
  6  |     await expect(page).toHaveTitle(/Nexart/)
  7  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  8  |     // Grille de créateurs ou skeleton de chargement
  9  |     const hasContent = await page.locator('[data-testid="creator-card"], .creator-card, article, [class*="creator"], [class*="skeleton"]').first().isVisible().catch(() => false)
  10 |     // Accepter aussi une liste vide (aucun créateur en base) — la page ne doit pas crasher
  11 |     expect(true).toBe(true)
  12 |   })
  13 | 
  14 |   test('barre de recherche créateurs — saisie fonctionne', async ({ page }) => {
  15 |     await page.goto('/creators')
  16 |     await page.waitForLoadState('networkidle')
  17 |     const searchInput = page.locator('input[type="search"], input[placeholder*="cherch"], input[placeholder*="Cherch"], input[placeholder*="Recherch"], input[placeholder*="créat"], input').first()
  18 |     if (await searchInput.isVisible()) {
  19 |       await searchInput.fill('céramique')
  20 |       await expect(searchInput).toHaveValue('céramique')
  21 |     } else {
  22 |       // Pas de barre de recherche visible — le test passe (fonctionnalité optionnelle)
  23 |       expect(true).toBe(true)
  24 |     }
  25 |   })
  26 | 
  27 |   test('dropdown ou suggestions autocomplete — apparaît si disponible', async ({ page }) => {
  28 |     await page.goto('/creators')
  29 |     await page.waitForLoadState('networkidle')
  30 |     const searchInput = page.locator('input').first()
  31 |     if (await searchInput.isVisible()) {
  32 |       await searchInput.fill('ce')
  33 |       // Attendre un peu pour laisser les suggestions charger
  34 |       await page.waitForTimeout(500)
  35 |       // Si une dropdown/liste de suggestions existe, elle est visible (non bloquant)
  36 |       const dropdown = page.locator('[role="listbox"], [role="combobox"] + *, [data-testid="suggestions"], .autocomplete, ul[class*="suggest"]').first()
  37 |       const dropdownVisible = await dropdown.isVisible().catch(() => false)
  38 |       // Le test vérifie seulement que la page ne crashe pas — pas que la dropdown existe
  39 |       expect(true).toBe(true)
  40 |     }
  41 |   })
  42 | 
  43 |   test('filtres par discipline — page ne crashe pas', async ({ page }) => {
  44 |     await page.goto('/creators?discipline=ceramique')
  45 |     await expect(page).toHaveTitle(/Nexart/)
> 46 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
     |                                              ^ Error: expect(locator).toBeVisible() failed
  47 |   })
  48 | })
  49 | 
```