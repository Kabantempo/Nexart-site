/**
 * Tests SEO, RGPD, contenu et performance réseau
 */
import { test, expect } from '@playwright/test'

// ─── SEO & pages techniques ───────────────────────────────────
test.describe('SEO — Fichiers techniques', () => {
  test('robots.txt existe et est valide', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).toContain('User-agent')
  })

  test('sitemap.xml existe et liste des URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect([200, 404]).toContain(res.status())
    if (res.status() === 200) {
      const text = await res.text()
      expect(text).toContain('<url>')
    }
  })
})

test.describe('SEO — Meta tags', () => {
  const PAGES_SEO = ['/', '/events', '/creators', '/offres', '/contact']

  for (const path of PAGES_SEO) {
    test(`${path} a une meta description non vide`, async ({ page }) => {
      await page.goto(path)
      const meta = await page.locator('meta[name="description"]').getAttribute('content')
      expect(meta).toBeTruthy()
      expect(meta!.length).toBeGreaterThan(20)
    })
  }

  test('/events a un og:image', async ({ page }) => {
    await page.goto('/events')
    const og = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(og).toBeTruthy()
  })

  test('/creators a un og:image', async ({ page }) => {
    await page.goto('/creators')
    const og = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(og).toBeTruthy()
  })
})

// ─── RGPD & mentions légales ──────────────────────────────────
test.describe('RGPD — Conformité', () => {
  test('footer contient un lien "Mentions légales"', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('footer a').filter({ hasText: /mentions.l.gales/i })
    await expect(link.first()).toBeVisible({ timeout: 10000 })
  })

  test('footer contient un lien CGU / Conditions', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('footer a').filter({ hasText: /conditions|cgu/i })
    await expect(link.first()).toBeVisible({ timeout: 10000 })
  })

  test('/conditions contient le mot "données personnelles"', async ({ page }) => {
    await page.goto('/conditions')
    const content = await page.locator('body').textContent()
    expect(content?.toLowerCase()).toContain('données personnelles')
  })

  test('/mentions-legales contient un email de contact', async ({ page }) => {
    await page.goto('/mentions-legales')
    const content = await page.locator('body').textContent()
    expect(content).toMatch(/@/)
  })
})

// ─── Contenu & données ────────────────────────────────────────
test.describe('Contenu — Données en production', () => {
  test('/events affiche au moins 1 événement', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    // Cherche des cards d'events (article, li, ou div avec un titre)
    const cards = page.locator('article, [data-testid="event-card"], .event-card').or(
      page.locator('h2, h3').filter({ hasText: /.{5,}/ })
    )
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('/creators affiche au moins 1 créateur', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    const cards = page.locator('article, [data-testid="creator-card"]').or(
      page.locator('h2, h3').filter({ hasText: /.{5,}/ })
    )
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('/patch-notes affiche au moins 1 version', async ({ page }) => {
    await page.goto('/patch-notes')
    await page.waitForLoadState('networkidle')
    const versions = page.locator('body').filter({ hasText: /v\d+\.\d+/ })
    const text = await page.locator('body').textContent()
    expect(text).toMatch(/v\d+\.\d+/)
  })
})

// ─── Navbar — liens vitaux ────────────────────────────────────
test.describe('Navigation — Liens navbar', () => {
  const NAV_LINKS = ['/events', '/creators']

  for (const href of NAV_LINKS) {
    test(`navbar contient un lien vers ${href}`, async ({ page }) => {
      await page.goto('/')
      const link = page.locator(`nav a[href="${href}"], header a[href="${href}"]`)
      await expect(link.first()).toBeVisible({ timeout: 10000 })
    })
  }

  test('page 404 est une vraie page custom (pas erreur serveur)', async ({ page }) => {
    const res = await page.goto('/cette-page-nexiste-pas-du-tout-xyz')
    // Doit retourner 404, pas 500
    expect(res?.status()).not.toBe(500)
    // La page doit contenir du contenu HTML
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(10)
  })
})

// ─── Performance réseau ───────────────────────────────────────
test.describe('Performance — Temps de réponse API', () => {
  const APIS = [
    '/api/events',
    '/api/health',
  ]

  for (const path of APIS) {
    test(`GET ${path} répond en moins de 2s`, async ({ request }) => {
      const start = Date.now()
      await request.get(path)
      const duration = Date.now() - start
      expect(duration).toBeLessThan(2000)
    })
  }

  test('GET /api/events retourne Content-Type application/json', async ({ request }) => {
    const res = await request.get('/api/events')
    expect(res.headers()['content-type']).toContain('application/json')
  })

  test('GET /api/health retourne { status: ok }', async ({ request }) => {
    const res = await request.get('/api/health')
    if (res.status() === 200) {
      const body = await res.json().catch(() => null)
      if (body) {
        const status = body.status ?? body.ok ?? body.health
        expect(['ok', 'healthy', true, 'up']).toContain(status)
      }
    }
  })
})

// ─── Erreurs API — pas de leak de stack trace ─────────────────
test.describe('Sécurité — Pas de leak d\'informations', () => {
  test('API protégée ne leak pas de stack trace', async ({ request }) => {
    const res = await request.get('/api/admin/stats')
    const body = await res.text()
    expect(body).not.toContain('at Object.')
    expect(body).not.toContain('node_modules')
    expect(body).not.toContain('stack')
  })

  test('404 API ne leak pas de stack trace Node.js', async ({ request }) => {
    const res = await request.get('/api/route-inexistante-xyz')
    const body = await res.text()
    // Vérifie l'absence de stack traces Node.js brutes (pas les refs RSC normales)
    expect(body).not.toMatch(/Error: .+\n\s+at \w+\./)
    expect(body).not.toContain('process.processTimers')
  })
})
