/**
 * Tests de régression visuelle — Screenshots de comparaison
 * Premier run : crée les baselines dans tests/screenshots/
 * Runs suivants : compare et échoue si différence > seuil
 *
 * Mettre à jour les baselines : npx playwright test visual --update-snapshots
 */
import { test, expect } from '@playwright/test'

const PAGES = [
  { name: 'home',           path: '/' },
  { name: 'events',         path: '/events' },
  { name: 'creators',       path: '/creators' },
  { name: 'login',          path: '/login' },
  { name: 'contact',        path: '/contact' },
]

test.describe('Régression visuelle', () => {
  for (const { name, path } of PAGES) {
    test(`${name} — pas de régression visuelle`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Attendre que les animations Framer Motion soient terminées
      await page.waitForTimeout(800)
      // Masquer les éléments dynamiques (dates, compteurs, avatars)
      await page.addStyleTag({ content: `
        time, [data-testid="date"], [class*="date"], [class*="counter"],
        [class*="avatar"], img[src*="supabase"] {
          visibility: hidden !important;
        }
      ` })
      await expect(page).toHaveScreenshot(`${name}.png`, {
        maxDiffPixelRatio: 0.03, // tolère 3% de différence
        fullPage: false,          // viewport uniquement (plus stable)
      })
    })

    test(`${name} — mobile (375px)`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      await page.addStyleTag({ content: `
        time, [data-testid="date"], [class*="date"], [class*="counter"],
        [class*="avatar"], img[src*="supabase"] { visibility: hidden !important; }
      ` })
      await expect(page).toHaveScreenshot(`${name}-mobile.png`, {
        maxDiffPixelRatio: 0.03,
      })
    })
  }
})
