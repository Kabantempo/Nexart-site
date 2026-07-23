# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke Tests >> responsive tablet — events
- Location: tests/e2e/smoke.spec.ts:63:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('h1')

```

```yaml
- link "Aller au contenu principal":
  - /url: "#main-content"
- banner:
  - link "Nexart Nexart":
    - /url: /
    - img "Nexart"
    - text: Nexart
  - button "Menu"
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
  3  | test.describe('Smoke Tests', () => {
  4  |   test('homepage loads', async ({ page }) => {
  5  |     await page.goto('/')
  6  |     await expect(page).toHaveTitle(/Nexart/)
  7  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  8  |   })
  9  | 
  10 |   test('events page loads', async ({ page }) => {
  11 |     await page.goto('/events')
  12 |     await page.waitForLoadState('networkidle')
  13 |     await expect(page.locator('h1')).toContainText('Événements', { timeout: 15000 })
  14 |     await expect(page.locator('text=Type d\'événement')).toBeVisible()
  15 |     await expect(page.locator('text=Pop-up')).toBeVisible()
  16 |   })
  17 | 
  18 |   test('creators page loads', async ({ page }) => {
  19 |     await page.goto('/creators')
  20 |     await page.waitForLoadState('networkidle')
  21 |     await expect(page.locator('h1')).toContainText('Créateurs', { timeout: 15000 })
  22 |   })
  23 | 
  24 |   test('contact page loads', async ({ page }) => {
  25 |     await page.goto('/contact')
  26 |     await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
  27 |     await expect(page.locator('button:has-text("Envoyer")')).toBeVisible()
  28 |   })
  29 | 
  30 |   test('offres page loads', async ({ page }) => {
  31 |     await page.goto('/offres')
  32 |     await expect(page).toHaveTitle(/Nexart/)
  33 |     await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  34 |   })
  35 | 
  36 |   test('search page loads', async ({ page }) => {
  37 |     await page.goto('/search')
  38 |     await expect(page).toHaveTitle(/Nexart/)
  39 |     await expect(page.locator('input').first()).toBeVisible({ timeout: 10000 })
  40 |   })
  41 | 
  42 |   test('navbar links work', async ({ page }) => {
  43 |     await page.goto('/')
  44 |     await expect(page.locator('nav a[href="/events"]').first()).toBeVisible()
  45 |     await expect(page.locator('nav a[href="/creators"]').first()).toBeVisible()
  46 |   })
  47 | 
  48 |   test('responsive mobile — homepage', async ({ page }) => {
  49 |     await page.setViewportSize({ width: 375, height: 812 })
  50 |     await page.goto('/')
  51 |     await expect(page.locator('button[aria-label="Menu"]')).toBeVisible({ timeout: 10000 })
  52 |   })
  53 | 
  54 |   test('responsive mobile — events no horizontal scroll', async ({ page }) => {
  55 |     await page.setViewportSize({ width: 375, height: 812 })
  56 |     await page.goto('/events')
  57 |     await page.waitForLoadState('networkidle')
  58 |     const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
  59 |     const viewportWidth = await page.evaluate(() => window.innerWidth)
  60 |     expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  61 |   })
  62 | 
  63 |   test('responsive tablet — events', async ({ page }) => {
  64 |     await page.setViewportSize({ width: 768, height: 1024 })
  65 |     await page.goto('/events')
  66 |     await page.waitForLoadState('networkidle')
> 67 |     await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
     |                                      ^ Error: expect(locator).toBeVisible() failed
  68 |   })
  69 | 
  70 |   test('legal pages load', async ({ page }) => {
  71 |     for (const path of ['/mentions-legales', '/conditions', '/confidentialite']) {
  72 |       await page.goto(path)
  73 |       await expect(page).toHaveTitle(/Nexart/)
  74 |     }
  75 |   })
  76 | 
  77 |   test('auth pages load', async ({ page }) => {
  78 |     for (const path of ['/login', '/register']) {
  79 |       await page.goto(path)
  80 |       await expect(page).toHaveTitle(/Nexart/)
  81 |       await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 10000 })
  82 |     }
  83 |   })
  84 | 
  85 |   test('protected routes redirect to login', async ({ page }) => {
  86 |     await page.goto('/dashboard')
  87 |     // Doit rediriger vers /login
  88 |     await expect(page).toHaveURL(/login|dashboard/, { timeout: 10000 })
  89 |   })
  90 | })
  91 | 
```