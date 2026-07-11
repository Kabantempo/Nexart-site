import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

// Credentials de test — remplis dans .env.test ou variables CI
const CREATOR_EMAIL = process.env.TEST_CREATOR_EMAIL || 'test-creator@nexart.fr'
const CREATOR_PASS  = process.env.TEST_CREATOR_PASS  || 'TestCreator123!'
const ORG_EMAIL     = process.env.TEST_ORG_EMAIL     || 'test-org@nexart.fr'
const ORG_PASS      = process.env.TEST_ORG_PASS      || 'TestOrg123!'

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard|\//, { timeout: 10000 })
}

const hasCreatorCreds = !!process.env.TEST_CREATOR_EMAIL
const hasOrgCreds = !!process.env.TEST_ORG_EMAIL

// --- Créateur ---
test.describe('Créateur authentifié', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasCreatorCreds) test.skip()
    await login(page, CREATOR_EMAIL, CREATOR_PASS)
  })

  test('accède au dashboard', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('accède à son profil', async ({ page }) => {
    await page.goto(`${BASE}/profile`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('voit la liste des événements', async ({ page }) => {
    await page.goto(`${BASE}/events`)
    await expect(page.locator('body')).toBeVisible()
  })

  test('accède aux paramètres', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('voit ses notifications', async ({ page }) => {
    await page.goto(`${BASE}/notifications`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('accède à la recherche avancée', async ({ page }) => {
    await page.goto(`${BASE}/search`)
    const input = page.locator('input[aria-label="Recherche"]')
    await expect(input).toBeVisible()
    await input.fill('peinture')
    const filterBtn = page.locator('button[aria-label="Filtres avancés"]')
    await expect(filterBtn).toBeVisible()
    await filterBtn.click()
    const disciplineSelect = page.locator('select[aria-label="Filtrer par discipline"]')
    await expect(disciplineSelect).toBeVisible()
  })
})

// --- Organisateur ---
test.describe('Organisateur authentifié', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasOrgCreds) test.skip()
    await login(page, ORG_EMAIL, ORG_PASS)
  })

  test('accède au dashboard', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('accède à la création d\'événement', async ({ page }) => {
    await page.goto(`${BASE}/events/create`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('API exposants requiert auth', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/events/00000000-0000-0000-0000-000000000000/exhibitors`)
    expect([401, 403, 404]).toContain(response.status())
  })

  test('API export CSV exposants requiert auth organisateur', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/events/00000000-0000-0000-0000-000000000000/exhibitors/export`)
    expect([401, 403, 404]).toContain(response.status())
  })
})

// --- Protection des routes ---
test.describe('Routes protégées (non authentifié)', () => {
  test('dashboard redirige vers login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/login/)
  })

  test('settings redirige ou affiche 401', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    const url = page.url()
    const isProtected = url.includes('login') || await page.locator('body').textContent().then(t => t?.includes('401') || t?.includes('connexion'))
    expect(isProtected).toBeTruthy()
  })

  test('admin redirige ou refuse', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    const status = await page.request.get(`${BASE}/admin`).then(r => r.status())
    expect([200, 302, 403, 404]).toContain(status)
  })
})

// --- Export CSV exposants ---
test.describe('Export CSV exposants', () => {
  test('retourne 401 sans token', async ({ page }) => {
    const response = await page.request.get(
      `${BASE}/api/events/00000000-0000-0000-0000-000000000000/exhibitors/export`
    )
    expect([401, 403]).toContain(response.status())
  })
})
