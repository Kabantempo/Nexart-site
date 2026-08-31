/**
 * Profile — Tests Playwright
 *
 * Ces tests couvrent :
 * 1. Protection auth — /profile redirige vers /login
 * 2. Profil créateur public — page /creators/[id] accessible
 * 3. Hero visible en mode clair et sombre
 * 4. Lightbox portfolio (clic sur image)
 * 5. Mobile responsive (375px)
 */

import { test, expect } from '@playwright/test'

// ── 1. Auth protection ────────────────────────────────────────────────────────
test.describe('Profile — Auth', () => {
  test('GET /profile sans auth → redirect /login', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('domcontentloaded')
    const url = page.url()
    const onLogin = url.includes('/login')
    const hasLoginForm = await page
      .locator('input[type="email"], input[type="password"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(onLogin || hasLoginForm).toBeTruthy()
  })
})

// ── 2. Page créateur publique ─────────────────────────────────────────────────
test.describe('Profile — Page publique créateur', () => {
  test('/creators — liste accessible, lien vers profil', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('/creators/[id] — page profil répond (si créateur existe)', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')

    const creatorLink = page.locator('a[href*="/creators/"]').first()
    if (await creatorLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await creatorLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForLoadState('domcontentloaded')
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 })
      }
    } else {
      // Pas de créateurs — vérifier simplement que /creators répond
      await expect(page).toHaveTitle(/Nexart/)
    }
  })

  test('Hero dark — texte blanc visible en light mode', async ({ page }) => {
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')

    const creatorLink = page.locator('a[href*="/creators/"]').first()
    if (await creatorLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await creatorLink.getAttribute('href')
      if (href) {
        // Forcer le mode clair
        await page.emulateMedia({ colorScheme: 'light' })
        await page.goto(href)
        await page.waitForLoadState('domcontentloaded')

        // Le data-theme="dark" sur le hero doit forcer les variables CSS sombres
        const heroHasDarkTheme = await page.evaluate(() => {
          const hero = document.querySelector('[data-theme="dark"]')
          return hero !== null
        })
        expect(heroHasDarkTheme).toBeTruthy()
      }
    }
  })
})

// ── 3. Mobile responsive ──────────────────────────────────────────────────────
test.describe('Profile — Mobile', () => {
  test('/creators — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
  })

  test('/creators/[id] — pas de scroll horizontal sur 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/creators')
    await page.waitForLoadState('networkidle')

    const creatorLink = page.locator('a[href*="/creators/"]').first()
    if (await creatorLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await creatorLink.getAttribute('href')
      if (href) {
        await page.goto(href)
        await page.waitForLoadState('networkidle')
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
        const viewportWidth = await page.evaluate(() => window.innerWidth)
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
      }
    }
  })
})

// ── 4. Lightbox portfolio @live ───────────────────────────────────────────────
test.describe('Profile — Lightbox portfolio @live', () => {
  test.skip(
    !process.env.TEST_CREATOR_PROFILE_URL,
    'Variable TEST_CREATOR_PROFILE_URL requise (ex: /creators/uuid-du-createur)'
  )

  test('clic image portfolio → lightbox s\'ouvre', async ({ page }) => {
    await page.goto(process.env.TEST_CREATOR_PROFILE_URL!)
    await page.waitForLoadState('networkidle')

    // Attendre la section portfolio
    const portfolioImg = page.locator('section').filter({ hasText: 'Portfolio' }).locator('[style*="cursor: zoom-in"], [style*="zoom-in"]').first()
    if (await portfolioImg.isVisible({ timeout: 5000 }).catch(() => false)) {
      await portfolioImg.click()
      // Vérifier que le lightbox (overlay fixe) est apparu
      const lightbox = page.locator('[style*="position: fixed"][style*="rgba(0,0,0"]')
      await expect(lightbox).toBeVisible({ timeout: 3000 })

      // Fermer avec Escape
      await page.keyboard.press('Escape')
      await expect(lightbox).not.toBeVisible({ timeout: 3000 })
    }
  })
})
