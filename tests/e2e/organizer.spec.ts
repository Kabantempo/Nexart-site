import { test, expect } from '@playwright/test'

test.describe('Organizer — Smoke tests (sans auth)', () => {
  test('/events → page charge, h1 visible', async ({ page }) => {
    const response = await page.goto('/events')
    expect(response?.status()).toBeLessThan(500)
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 })
  })

  test('/events/[id] invalide → redirect ou 404 propre', async ({ page }) => {
    await page.goto('/events/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('domcontentloaded')
    // Soit une page 404, soit un redirect — pas un crash 500
    const title = await page.title()
    expect(title).toMatch(/Nexart|404|Introuvable|Not Found/)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('/organizer/analytics → redirect vers login si non-authentifié', async ({ page }) => {
    await page.goto('/organizer/analytics')
    await page.waitForLoadState('domcontentloaded')
    // Doit rediriger vers /login ou afficher un écran d'auth
    const url = page.url()
    const isRedirectedToLogin = url.includes('/login') || url.includes('/auth')
    const hasLoginForm = await page.locator(
      'form, input[type="email"], input[type="password"], button:has-text("Connexion")'
    ).first().isVisible().catch(() => false)
    expect(isRedirectedToLogin || hasLoginForm).toBe(true)
  })

  test('/admin → redirect vers login si non-authentifié', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    const isRedirectedToLogin = url.includes('/login') || url.includes('/auth')
    const hasLoginForm = await page.locator(
      'form, input[type="email"], input[type="password"], button:has-text("Connexion")'
    ).first().isVisible().catch(() => false)
    expect(isRedirectedToLogin || hasLoginForm).toBe(true)
  })

  test('/api/admin/stats → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/stats')
    expect(response.status()).toBe(401)
  })

  test('/api/organizer/bulk-message → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.post('/api/organizer/bulk-message', {
      data: { message: 'test' },
    })
    expect(response.status()).toBe(401)
  })
})
