import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const EVENT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

// ── Pages accessibility ──────────────────────────────────────────────────────

test.describe('Pages WCAG — chargement + éléments critiques', () => {
  test('homepage a un skip-to-content link', async ({ page }) => {
    await page.goto(BASE)
    const skip = page.locator('a[href="#main-content"]')
    await expect(skip).toBeAttached()
  })

  test('main a un id="main-content"', async ({ page }) => {
    await page.goto(BASE)
    const main = page.locator('#main-content')
    await expect(main).toBeAttached()
  })

  test('html lang="fr"', async ({ page }) => {
    await page.goto(BASE)
    const lang = await page.evaluate(() => document.documentElement.lang)
    expect(lang).toBe('fr')
  })

  test('/conditions charge sans erreur 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/conditions`)
    expect(res?.status()).toBeLessThan(500)
  })

  test('/mentions-legales charge sans erreur 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/mentions-legales`)
    expect(res?.status()).toBeLessThan(500)
  })

  test('/patch-notes charge sans erreur 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/patch-notes`)
    expect(res?.status()).toBeLessThan(500)
  })
})

// ── API Endpoints v1.0.0 ─────────────────────────────────────────────────────

test.describe('API exhibitor-fields — GET public', () => {
  test('GET /api/events/[id]/exhibitor-fields retourne 200 ou 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/events/${EVENT_ID}/exhibitor-fields`)
    expect([200, 404]).toContain(res.status())
  })

  test('réponse JSON valide', async ({ request }) => {
    const res = await request.get(`${BASE}/api/events/${EVENT_ID}/exhibitor-fields`)
    const body = await res.json()
    expect(body).toBeDefined()
  })
})

test.describe('API exhibitors — POST public sans auth', () => {
  test('POST sans body retourne 400 ou 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/events/${EVENT_ID}/exhibitors`, {
      data: {}
    })
    expect([400, 401, 422]).toContain(res.status())
  })
})

test.describe('API exhibitors export — GET sans auth', () => {
  test('GET /export retourne 401 sans token', async ({ request }) => {
    const res = await request.get(`${BASE}/api/events/${EVENT_ID}/exhibitors/export`)
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('API reports — POST public', () => {
  test('POST sans body retourne 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reports`, {
      data: {}
    })
    expect([400, 401, 422]).toContain(res.status())
  })

  test('POST avec raison invalide retourne 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reports`, {
      data: {
        reported_user_id: '00000000-0000-0000-0000-000000000000',
        reason: 'invalid_reason'
      }
    })
    expect([400, 401]).toContain(res.status())
  })
})

test.describe('API admin/reports — auth requise', () => {
  test('GET sans auth retourne 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/reports`)
    expect([401, 403]).toContain(res.status())
  })

  test('PATCH sans auth retourne 401', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/admin/reports/fake-id`, {
      data: { status: 'resolved' }
    })
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('API audit-logs — auth requise', () => {
  test('GET sans auth retourne 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/audit-logs`)
    expect([401, 403]).toContain(res.status())
  })
})

// ── Navigation ───────────────────────────────────────────────────────────────

test.describe('Navigation footer', () => {
  test('lien Conditions visible dans le footer', async ({ page }) => {
    await page.goto(BASE)
    const link = page.locator('a[href="/conditions"]')
    await expect(link.first()).toBeVisible()
  })

  test('lien Mentions légales visible dans le footer', async ({ page }) => {
    await page.goto(BASE)
    const link = page.locator('a[href="/mentions-legales"]')
    await expect(link.first()).toBeVisible()
  })
})
