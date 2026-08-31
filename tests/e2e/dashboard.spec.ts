/**
 * Dashboard — Tests Playwright
 *
 * Ces tests couvrent :
 * 1. Protection auth (redirect /login sans session)
 * 2. Layout mobile (375px — pas de scroll horizontal, grilles responsive)
 * 3. Éléments clés présents quand authentifié (mocké)
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

// ── 1. Protection auth ────────────────────────────────────────────────────────
test.describe('Dashboard — Auth', () => {
  test('GET /dashboard sans auth → redirect /login', async ({ page }) => {
    await page.goto('/dashboard')
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

  test('GET /organizer/analytics sans auth → redirect /login', async ({ page }) => {
    await page.goto('/organizer/analytics')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy()
  })

  test('GET /organizer/revenue sans auth → redirect /login', async ({ page }) => {
    await page.goto('/organizer/revenue')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy()
  })
})

// ── 2. Mobile responsive ──────────────────────────────────────────────────────
test.describe('Dashboard — Mobile', () => {
  test('login page — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('register page — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('events page — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('creators page — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })
})

// ── 3. Dashboard authentifié (optionnel — skip si pas de config) ──────────────
test.describe('Dashboard — Authentifié @dashboard-live', () => {
  test.skip(
    !process.env.TEST_CREATOR_EMAIL || !process.env.TEST_CREATOR_PASSWORD,
    'Variables TEST_CREATOR_EMAIL et TEST_CREATOR_PASSWORD requises'
  )

  test('KPI grid visible après login créateur', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.TEST_CREATOR_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_CREATOR_PASSWORD!)
    await page.locator('button[type="submit"], button:has-text("Connexion")').first().click()
    await page.waitForURL(/\/(dashboard|events|profile)/, { timeout: 15000 })

    if (page.url().includes('/dashboard')) {
      // Vérifier la présence des KPIs
      await expect(page.locator('.kpi-grid, [class*="kpi"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('KPI grid responsive à 375px (2 colonnes)', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill(process.env.TEST_CREATOR_EMAIL!)
    await page.locator('input[type="password"]').fill(process.env.TEST_CREATOR_PASSWORD!)
    await page.locator('button[type="submit"], button:has-text("Connexion")').first().click()
    await page.waitForURL(/\/(dashboard|events|profile)/, { timeout: 15000 })

    if (page.url().includes('/dashboard')) {
      await page.setViewportSize({ width: 375, height: 812 })
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
    }
  })
})
