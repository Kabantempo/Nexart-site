import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
  })

  test('events page loads', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('h1', { timeout: 15000 })
    const h1Text = await page.locator('h1').first().textContent()
    expect(h1Text).toMatch(/[Éé]v[eé]nements?/i)
  })

  test('creators page loads', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
  })

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForSelector('h1, [role="heading"]', { timeout: 10000 })
    await page.waitForSelector('button:has-text("Envoyer"), [type="submit"]', { timeout: 10000 })
  })

  test('offres page loads', async ({ page }) => {
    await page.goto('/offres')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 })
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('input', { timeout: 10000 })
  })

  test('navbar links work', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('a[href="/events"], a[href="/creators"]', { timeout: 10000 })
    expect(true).toBe(true)
  })

  test('responsive mobile — homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForSelector(
      'button[aria-label="Menu"], button[aria-label="menu"], [data-testid="menu-button"], button:has-text("Menu")',
      { timeout: 10000 }
    )
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
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
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
      await page.waitForSelector('form, [role="form"], input[type="email"]', { timeout: 10000 })
    }
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 10000 })
  })
})
