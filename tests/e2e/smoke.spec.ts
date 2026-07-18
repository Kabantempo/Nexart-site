import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('events page loads', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Événements', { timeout: 15000 })
    await expect(page.locator('text=Type d\'événement')).toBeVisible()
    await expect(page.locator('text=Pop-up')).toBeVisible()
  })

  test('creators page loads', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText('Créateurs', { timeout: 15000 })
  })

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("Envoyer")')).toBeVisible()
  })

  test('offres page loads', async ({ page }) => {
    await page.goto('/offres')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10000 })
  })

  test('navbar links work', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav a[href="/events"]').first()).toBeVisible()
    await expect(page.locator('nav a[href="/creators"]').first()).toBeVisible()
  })

  test('responsive mobile — homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('button[aria-label="Menu"]')).toBeVisible({ timeout: 10000 })
  })

  test('responsive mobile — events no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('responsive tablet — events', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
  })

  test('legal pages load', async ({ page }) => {
    for (const path of ['/mentions-legales', '/conditions', '/confidentialite']) {
      await page.goto(path)
      await expect(page).toHaveTitle(/Nexart/)
    }
  })

  test('auth pages load', async ({ page }) => {
    for (const path of ['/login', '/register']) {
      await page.goto(path)
      await expect(page).toHaveTitle(/Nexart/)
      await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    // Doit rediriger vers /login
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 10000 })
  })
})
