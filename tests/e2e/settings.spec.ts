/**
 * Settings — Tests Playwright
 *
 * Ces tests couvrent :
 * 1. Auth protection (redirect /login)
 * 2. Sections clés visibles quand authentifié
 * 3. Mobile responsive (375px)
 */

import { test, expect } from '@playwright/test'

// ── 1. Auth protection ────────────────────────────────────────────────────────
test.describe('Settings — Auth', () => {
  test('GET /settings sans auth → redirect /login', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    const onLogin = url.includes('/login')
    const hasLoginForm = await page
      .locator('input[type="email"], input[type="password"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(onLogin || hasLoginForm).toBeTruthy()
  })
})

// ── 2. Settings authentifié (optionnel) ───────────────────────────────────────
test.describe('Settings — Authentifié @settings-live', () => {
  test.skip(
    !process.env.TEST_CREATOR_EMAIL || !process.env.TEST_CREATOR_PASSWORD,
    'Variables TEST_CREATOR_EMAIL et TEST_CREATOR_PASSWORD requises'
  )

  test('sections settings chargées après login', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.TEST_CREATOR_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_CREATOR_PASSWORD!)
    await page.locator('button[type="submit"], button:has-text("Connexion")').first().click()
    await page.waitForURL(/\/(dashboard|events|profile)/, { timeout: 15000 })

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Vérifier que la page settings est bien chargée (au moins un titre de section)
    await expect(
      page.locator('h1, h2, h3').filter({ hasText: /profil|notifications|données|compte|apparence/i }).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('section Données Personnelles présente en bas de page', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.TEST_CREATOR_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_CREATOR_PASSWORD!)
    await page.locator('button[type="submit"], button:has-text("Connexion")').first().click()
    await page.waitForURL(/\/(dashboard|events|profile)/, { timeout: 15000 })

    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Scroller vers le bas pour trouver la section RGPD
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const section = page.locator('h2, h3').filter({ hasText: /données personnelles|suppression|compte/i }).first()
    await expect(section).toBeVisible({ timeout: 8000 })
  })

  test('Settings mobile — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.TEST_CREATOR_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_CREATOR_PASSWORD!)
    await page.locator('button[type="submit"], button:has-text("Connexion")').first().click()
    await page.waitForURL(/\/(dashboard|events|profile)/, { timeout: 15000 })

    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })
})
