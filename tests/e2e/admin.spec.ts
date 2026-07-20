import { test, expect } from '@playwright/test'

test.describe('Admin — Smoke tests (sans auth)', () => {
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

  test('/api/admin/users → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/users')
    expect(response.status()).toBe(401)
  })

  test('/api/admin/events → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/events')
    expect(response.status()).toBe(401)
  })

  test('/api/admin/reports → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/reports')
    expect(response.status()).toBe(401)
  })

  test('/api/audit-logs → retourne 401 sans auth', async ({ page }) => {
    const response = await page.request.get('/api/audit-logs')
    expect(response.status()).toBe(401)
  })

  test('/api/cron/hard-delete-users → retourne 401 sans token', async ({ page }) => {
    const response = await page.request.post('/api/cron/hard-delete-users')
    expect(response.status()).toBe(401)
  })
})
