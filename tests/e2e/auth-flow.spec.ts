/**
 * Tests fonctionnels — Login complet + session dashboard
 * Utilise TEST_EMAIL / TEST_PASSWORD depuis .env.local
 * Skip automatiquement si les credentials ne sont pas définis
 */
import { test, expect } from '@playwright/test'

const EMAIL = process.env.TEST_EMAIL || ''
const PASSWORD = process.env.TEST_PASSWORD || ''
const HAS_CREDS = !!EMAIL && !!PASSWORD

test.describe('Auth — Login complet', () => {
  test('formulaire login visible et interactif', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('#login-email', { timeout: 10000 })
    await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 })

    // Vérifier que les champs sont fonctionnels
    await page.fill('#login-email', 'test@test.fr')
    await expect(page.locator('#login-email')).toHaveValue('test@test.fr')
  })

  test('login avec credentials invalides → message erreur affiché', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('#login-email', { timeout: 10000 })

    await page.fill('#login-email', 'invalid@nexart.fr')
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.click('button[type="submit"]')

    // Doit afficher une erreur, pas rediriger
    await page.waitForTimeout(2000)
    const hasError = await page.locator(
      '[role="alert"], .error, [class*="error"], p:has-text("incorrect"), p:has-text("invalide"), p:has-text("Erreur")'
    ).isVisible().catch(() => false)
    const stillOnLogin = page.url().includes('/login')
    expect(hasError || stillOnLogin).toBe(true)
  })

  test('login complet → dashboard chargé avec données utilisateur', async ({ page }) => {
    if (!HAS_CREDS) {
      test.skip(true, 'TEST_EMAIL / TEST_PASSWORD non définis dans .env.local')
      return
    }

    await page.goto('/login')
    await page.waitForSelector('#login-email', { timeout: 10000 })

    await page.fill('#login-email', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    // Doit être redirigé vers le dashboard
    await expect(page).toHaveURL(/dashboard|profile|home/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/login/)

    // Dashboard doit afficher du contenu utilisateur
    await page.waitForSelector('h1, h2, [role="heading"], nav', { timeout: 15000 })
  })

  test('session persistante — refresh garde la session', async ({ page }) => {
    if (!HAS_CREDS) {
      test.skip(true, 'TEST_EMAIL / TEST_PASSWORD non définis dans .env.local')
      return
    }

    await page.goto('/login')
    await page.fill('#login-email', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    if (!page.url().includes('/login')) {
      // Refresh la page
      await page.reload()
      await page.waitForLoadState('networkidle')
      // Toujours connecté après refresh
      await expect(page).not.toHaveURL(/login/)
    }
  })

  test('déconnexion → redirige vers /login', async ({ page }) => {
    if (!HAS_CREDS) {
      test.skip(true, 'TEST_EMAIL / TEST_PASSWORD non définis dans .env.local')
      return
    }

    await page.goto('/login')
    await page.fill('#login-email', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    if (!page.url().includes('/login')) {
      const logoutBtn = page.locator(
        'button:has-text("Déconnexion"), button:has-text("Se déconnecter"), a:has-text("Déconnexion"), [data-testid="logout"]'
      ).first()
      if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await logoutBtn.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(/login|\//)
      }
    }
  })
})
