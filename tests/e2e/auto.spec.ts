/**
 * Tests auto-générés depuis tests/config.ts
 * Ajoute une page/endpoint/db check dans config.ts → ce fichier le teste automatiquement
 */
import { test, expect } from '@playwright/test'
import { PUBLIC_PAGES, PROTECTED_PAGES, PUBLIC_APIS, PROTECTED_APIS } from '../config'

// ─── Pages publiques ─────────────────────────────────────────
test.describe('Auto — Pages publiques', () => {
  for (const { path, title, heading } of PUBLIC_PAGES) {
    test(`${path} charge correctement`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      await expect(page).toHaveTitle(title)
      if (heading) {
        await page.waitForSelector(`h1, [role="heading"]`, { timeout: 15000 })
        const text = await page.locator('h1, [role="heading"]').first().textContent()
        expect(text).toMatch(new RegExp(heading, 'i'))
      }
    })
  }
})

// ─── Pages protégées ─────────────────────────────────────────
test.describe('Auto — Pages protégées', () => {
  for (const path of PROTECTED_PAGES) {
    test(`${path} répond 200 ou redirige vers /login`, async ({ page }) => {
      const res = await page.goto(path)
      const status = res?.status() ?? 0
      const url = page.url()
      const ok = status === 200 || url.includes('/login') || status === 401 || status === 403
      expect(ok).toBe(true)
    })
  }
})

// ─── APIs publiques ───────────────────────────────────────────
test.describe('Auto — APIs publiques', () => {
  for (const { path, fields, minItems } of PUBLIC_APIS) {
    test(`GET ${path} — JSON valide avec champs attendus`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)

      const body = await res.json()
      // Supporte tableau direct ou wrapper objet
      const items: unknown[] = Array.isArray(body)
        ? body
        : Object.values(body).find(v => Array.isArray(v)) as unknown[] ?? []

      if (minItems && minItems > 0) {
        expect(items.length).toBeGreaterThanOrEqual(minItems)
      }

      if (items.length > 0) {
        const first = items[0] as Record<string, unknown>
        for (const field of fields) {
          expect(first).toHaveProperty(field)
        }
      }
    })
  }
})

// ─── APIs protégées ───────────────────────────────────────────
test.describe('Auto — APIs protégées', () => {
  for (const path of PROTECTED_APIS) {
    test(`GET ${path} — 401/403 sans token`, async ({ request }) => {
      const res = await request.get(path)
      expect([401, 403, 404, 405]).toContain(res.status())
    })
  }
})
