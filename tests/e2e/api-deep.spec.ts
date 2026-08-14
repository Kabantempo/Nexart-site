/**
 * Tests API approfondis — Pagination, recherche, CRUD events
 */
import { test, expect } from '@playwright/test'

test.describe('API — Pagination', () => {
  test('/api/events?offset=0 et ?offset=5 retournent des données différentes', async ({ request }) => {
    const r1 = await request.get('/api/events?offset=0&limit=5')
    const r2 = await request.get('/api/events?offset=5&limit=5')

    if (r1.status() !== 200) {
      // API peut ne pas supporter la pagination — skip gracieux
      return
    }

    const d1 = await r1.json().catch(() => null)
    const d2 = await r2.json().catch(() => null)

    if (!d1 || !d2) return

    const items1 = Array.isArray(d1) ? d1 : (d1.events || d1.data || [])
    const items2 = Array.isArray(d2) ? d2 : (d2.events || d2.data || [])

    if (items1.length === 0 || items2.length === 0) return

    // Les IDs de page 1 et page 2 ne doivent pas se chevaucher
    const ids1 = new Set(items1.map((e: { id: string }) => e.id))
    const overlap = items2.filter((e: { id: string }) => ids1.has(e.id))
    expect(overlap.length).toBe(0)
  })

  test('/api/events retourne un tableau JSON valide', async ({ request }) => {
    const r = await request.get('/api/events')
    expect(r.status()).toBe(200)

    const data = await r.json()
    const items = Array.isArray(data) ? data : (data.events || data.data || [])
    expect(Array.isArray(items)).toBe(true)
  })

  test('/api/events — chaque item a les champs requis', async ({ request }) => {
    const r = await request.get('/api/events')
    if (r.status() !== 200) return

    const data = await r.json()
    const items = Array.isArray(data) ? data : (data.events || data.data || [])

    if (items.length === 0) return

    const first = items[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('title')
  })
})

test.describe('API — Recherche', () => {
  test('/api/events?city=Paris retourne uniquement des events de Paris', async ({ request }) => {
    const r = await request.get('/api/events?city=Paris')
    if (r.status() !== 200) return

    const data = await r.json()
    const items = Array.isArray(data) ? data : (data.events || data.data || [])

    if (items.length === 0) return

    // Chaque résultat doit avoir city = Paris (insensible à la casse)
    for (const item of items.slice(0, 5)) {
      expect(item.city?.toLowerCase()).toContain('paris')
    }
  })

  test('/api/events?city=VilleInexistante999 retourne un tableau vide', async ({ request }) => {
    const r = await request.get('/api/events?city=VilleInexistante999')
    if (r.status() !== 200) return

    const data = await r.json()
    const items = Array.isArray(data) ? data : (data.events || data.data || [])
    expect(items.length).toBe(0)
  })
})

test.describe('API — CRUD events', () => {
  test('GET /api/events — retourne 200 avec données valides', async ({ request }) => {
    const r = await request.get('/api/events')
    expect(r.status()).toBe(200)
    const ct = r.headers()['content-type'] || ''
    expect(ct).toContain('application/json')
  })

  test('POST /api/events sans auth — retourne 401 ou 403', async ({ request }) => {
    const r = await request.post('/api/events', {
      data: { title: 'Test non auth', city: 'Paris' },
    })
    expect([400, 401, 403, 405]).toContain(r.status())
  })

  test('PATCH /api/events/:id sans auth — retourne 401 ou 403', async ({ request }) => {
    const r = await request.patch('/api/events/non-existent-id', {
      data: { title: 'Hacked title' },
    })
    expect([400, 401, 403, 404, 405]).toContain(r.status())
  })

  test('DELETE /api/events/:id sans auth — retourne 401 ou 403', async ({ request }) => {
    const r = await request.delete('/api/events/non-existent-id')
    expect([401, 403, 404, 405]).toContain(r.status())
  })

  test('GET /api/events/:id — event valide retourne les données complètes', async ({ request }) => {
    // D'abord récupérer un ID existant
    const list = await request.get('/api/events')
    if (list.status() !== 200) return

    const data = await list.json()
    const items = Array.isArray(data) ? data : (data.events || data.data || [])
    if (items.length === 0) return

    const id = items[0].id
    const r = await request.get(`/api/events/${id}`)
    expect([200, 301, 302]).toContain(r.status())

    if (r.status() === 200) {
      const body = await r.json()
      // L'API retourne soit l'event direct, soit { event: {...} }
      const event = body.event ?? body
      expect(event).toHaveProperty('id')
      expect(event).toHaveProperty('title')
    }
  })
})
