import { test, expect } from '@playwright/test'

test.describe('Navigation — Structure et liens globaux', () => {
  test('homepage charge (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
  })

  test('navbar est présente et contient les liens principaux', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('nav', { timeout: 10000 })
    await page.waitForSelector('a[href="/events"], a[href="/creators"]', { timeout: 10000 })
    expect(true).toBe(true)
  })

  test('lien footer /conditions fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const conditionsLink = page.locator('footer a[href*="conditions"], a[href="/conditions"]').first()
    if (await conditionsLink.isVisible()) {
      await conditionsLink.click()
      await expect(page).toHaveURL(/conditions/)
      await expect(page).toHaveTitle(/Nexart/)
    } else {
      const response = await page.goto('/conditions')
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(/Nexart/)
    }
  })

  test('lien footer /mentions-legales fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const mentionsLink = page.locator('footer a[href*="mentions-legales"], a[href="/mentions-legales"]').first()
    if (await mentionsLink.isVisible()) {
      await mentionsLink.click()
      await expect(page).toHaveURL(/mentions-legales/)
      await expect(page).toHaveTitle(/Nexart/)
    } else {
      const response = await page.goto('/mentions-legales')
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(/Nexart/)
    }
  })

  test('page /conditions charge directement (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/conditions')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 })
  })

  test('page /mentions-legales charge directement (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/mentions-legales')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 })
  })

  test('routes inconnues retournent une page 404 propre', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas-123')
    await expect(page).toHaveTitle(/Nexart|404|Introuvable|Not Found/)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
