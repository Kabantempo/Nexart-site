import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('text=Découvrir les événements')).toBeVisible()
  })

  test('events page loads and filters', async ({ page }) => {
    await page.goto('/events')
    await expect(page.locator('h1')).toContainText('Événements')

    // Check filter functionality
    const typeFilter = page.locator('[data-test="filter-type"]')
    if (await typeFilter.isVisible()) {
      await typeFilter.click()
      await expect(page.locator('text=Permanent')).toBeVisible()
    }
  })

  test('creators page loads', async ({ page }) => {
    await page.goto('/creators')
    await expect(page.locator('h1')).toContainText('Créateurs')
    await expect(page.locator('text=Parcourir')).toBeVisible()
  })

  test('contact page loads and submits', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('h1')).toContainText('Nous contacter')

    // Fill form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="subject"]', 'Test Subject')
    await page.fill('textarea[name="message"]', 'Test message content')

    // Submit
    await page.click('button:has-text("Envoyer")')

    // Check success message
    await expect(page.locator('text=envoyé avec succès')).toBeVisible({ timeout: 5000 })
  })

  test('search page works', async ({ page }) => {
    await page.goto('/search')
    await expect(page.locator('text=Rechercher')).toBeVisible()

    // Search for events
    await page.fill('input[placeholder*="événements"]', 'marché')
    await expect(page.locator('text=Marché')).toBeVisible({ timeout: 3000 })
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')

    // Check navbar links
    await expect(page.locator('a:has-text("Événements")')).toHaveAttribute('href', '/events')
    await expect(page.locator('a:has-text("Créateurs")')).toHaveAttribute('href', '/creators')
  })

  test('responsive design works', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check mobile menu is present
    await expect(page.locator('button[aria-label*="menu"]')).toBeVisible()
  })
})
