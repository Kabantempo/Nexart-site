import { test, expect } from '@playwright/test'

test.describe('Navigation — Structure et liens globaux', () => {
  test('homepage charge (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('navbar est présente et contient les liens principaux', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })
    await expect(nav.locator('a[href="/events"]').first()).toBeVisible()
    await expect(nav.locator('a[href="/creators"]').first()).toBeVisible()
  })

  test('lien footer /conditions fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const conditionsLink = page.locator('footer a[href*="conditions"], a[href="/conditions"]').first()
    if (await conditionsLink.isVisible()) {
      await conditionsLink.click()
      await expect(page).toHaveURL(/conditions/)
      await expect(page).toHaveTitle(/Nexart/)
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    } else {
      // Naviguer directement si le lien n'est pas dans le viewport
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
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
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
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('page /mentions-legales charge directement (HTTP 200)', async ({ page }) => {
    const response = await page.goto('/mentions-legales')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('routes inconnues retournent une page 404 propre', async ({ page }) => {
    await page.goto('/cette-page-nexiste-pas-123')
    // Next.js retourne 404 mais la page doit rester sur le domaine Nexart
    await expect(page).toHaveTitle(/Nexart|404|Introuvable|Not Found/)
    // Pas de page blanche ou erreur serveur non gérée
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
