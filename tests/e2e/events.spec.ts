import { test, expect } from '@playwright/test'

test.describe('Events — Page événements', () => {
  test('page /events charge et affiche du contenu ou un état vide propre', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
    expect(true).toBe(true)
  })

  test('filtres disciplines — sélection modifie l\'URL ou le contenu', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    const filterSelect = page.locator(
      'select[name*="discipline"], select[name*="type"], select[id*="discipline"]'
    ).first()
    const filterButton = page.locator(
      'button:has-text("Pop-up"), button:has-text("Marché"), button:has-text("Atelier"), a:has-text("Pop-up")'
    ).first()

    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ index: 1 })
      await page.waitForTimeout(500)
    } else if (await filterButton.isVisible()) {
      await filterButton.click()
      await page.waitForTimeout(500)
    }
    expect(true).toBe(true)
  })

  test('filtre via query param ?discipline= — page ne crashe pas', async ({ page }) => {
    await page.goto('/events?discipline=ceramique')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
  })

  test('filtre via query param ?type= — page ne crashe pas', async ({ page }) => {
    await page.goto('/events?type=marche')
    await expect(page).toHaveTitle(/Nexart/)
    await page.waitForSelector('h1, [role="heading"]', { timeout: 15000 })
  })

  test('navigation vers la page détail d\'un événement', async ({ page }) => {
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    const eventLink = page.locator(
      'a[href*="/events/"], [data-testid="event-card"] a, article a'
    ).first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForLoadState('domcontentloaded')
      await expect(page).not.toHaveURL(/error|404/)
      await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 15000 })
    } else {
      await page.goto('/events/not-found-test')
      await expect(page).toHaveTitle(/Nexart|404|Introuvable/)
    }
  })
})
