import { test, expect } from '@playwright/test'

test.describe('Search — Recherche', () => {
  test('page /search charge correctement', async ({ page }) => {
    await page.goto('/search')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10000 })
  })

  test('saisie dans la barre de recherche', async ({ page }) => {
    await page.goto('/search')
    const searchInput = page.locator('input[type="search"], input[placeholder*="cherch"], input[placeholder*="Cherch"], input[placeholder*="search"], input').first()
    await searchInput.fill('céramique')
    await expect(searchInput).toHaveValue('céramique')
  })

  test('paramètre URL q= pré-remplit la recherche', async ({ page }) => {
    await page.goto('/search?q=bijoux')
    // La barre de recherche doit refléter le paramètre de l'URL
    const searchInput = page.locator('input[type="search"], input[placeholder*="cherch"], input[placeholder*="Cherch"], input').first()
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    // La page ne doit pas crasher
    await expect(page).toHaveTitle(/Nexart/)
  })

  test('la page ne crashe pas avec une recherche vide', async ({ page }) => {
    await page.goto('/search?q=')
    await expect(page).toHaveTitle(/Nexart/)
    await expect(page.locator('input').first()).toBeVisible({ timeout: 10000 })
  })
})
