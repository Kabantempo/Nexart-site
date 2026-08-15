/**
 * Configuration centrale des tests Nexart
 * → Ajoute ici chaque nouvelle page, endpoint ou feature
 * → npm test les vérifiera automatiquement
 */

export const BASE = 'https://nexart.fr'

// ─── Pages publiques ─────────────────────────────────────────
// Ajoute une entrée à chaque nouvelle route publique
export const PUBLIC_PAGES: { path: string; title: RegExp; heading?: string }[] = [
  { path: '/',                 title: /Nexart/ },
  { path: '/events',           title: /Nexart/, heading: 'Événements' },
  { path: '/creators',         title: /Nexart/ },
  { path: '/login',            title: /Nexart/ },
  { path: '/register',         title: /Nexart/ },
  { path: '/patch-notes',      title: /Nexart/ },
  { path: '/conditions',       title: /Nexart/ },
  { path: '/mentions-legales', title: /Nexart/ },
  { path: '/contact',          title: /Nexart/ },
  { path: '/offres',           title: /Nexart/ },
  { path: '/search',           title: /Nexart/ },
]

// ─── Routes protégées (doivent répondre 200 ou rediriger vers /login) ──
export const PROTECTED_PAGES: string[] = [
  '/dashboard',
  '/events/create',
  '/profile',
  '/admin',
]

// ─── Endpoints API publics ────────────────────────────────────
export const PUBLIC_APIS: {
  path: string
  fields: string[]
  minItems?: number
}[] = [
  {
    path: '/api/events',
    fields: ['id', 'title', 'city', 'start_date'],
    minItems: 1,
  },
  {
    path: '/api/health',
    fields: ['status'],
  },
]

// ─── Endpoints protégés (doivent retourner 401/403 sans token) ──
export const PROTECTED_APIS: string[] = [
  // Crédits & compte
  '/api/credits/balance',
  '/api/delete-account',
  '/api/account/delete-request',

  // Admin
  '/api/admin/stats',
  '/api/admin/users',
  '/api/admin/events',
  '/api/admin/reports',

  // Audit & logs
  '/api/audit-logs',

  // Créateur / organisateur
  '/api/creator/analytics',
  '/api/organizer/stats',

  // Cron (token requis)
  '/api/cron/hard-delete-users',
  '/api/cron/saved-searches-notify',

  // Features v1.2
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/analytics',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/team',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/campaigns',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/exhibitors',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/volunteers',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/waitlist',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/checklists',
  '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/tasks',
]

// ─── Endpoints qui doivent rejeter sans auth (POST/PATCH/DELETE) ──
export const PROTECTED_MUTATIONS: {
  method: 'POST' | 'PATCH' | 'DELETE'
  path: string
}[] = [
  { method: 'POST',   path: '/api/events' },
  { method: 'POST',   path: '/api/reviews' },
  { method: 'POST',   path: '/api/credits/use' },
  { method: 'POST',   path: '/api/reports' },
  { method: 'DELETE', path: '/api/events/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
]

// ─── Checks intégrité base de données ────────────────────────
export const DB_CHECKS: {
  label: string
  sql: string
  min: number
  mode?: 'gte' | 'eq'
}[] = [
  // Données de base
  { label: 'Events publiés',           sql: "SELECT count(*) FROM public.events WHERE status='published'",       min: 1 },
  { label: 'Profils créateurs',        sql: "SELECT count(*) FROM public.profiles WHERE role='creator'",         min: 1 },
  { label: 'Profils organisateurs',    sql: "SELECT count(*) FROM public.profiles WHERE role='organizer'",       min: 1 },
  { label: 'Table applications',       sql: "SELECT count(*) FROM public.applications",                          min: 0 },
  { label: 'Table messages',           sql: "SELECT count(*) FROM public.messages",                              min: 0 },
  { label: 'Changelog (WhatsNew)',     sql: "SELECT count(*) FROM public.changelog",                             min: 1 },

  // Intégrité relationnelle
  { label: 'Aucun event orphelin (organizer manquant)',     sql: "SELECT count(*) FROM public.events e WHERE e.status='published' AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = e.organizer_id)", min: 0, mode: 'eq' },
  { label: 'Aucun event publié sans titre',                 sql: "SELECT count(*) FROM public.events WHERE status='published' AND (title IS NULL OR title='')", min: 0, mode: 'eq' },
  { label: 'Aucune application orpheline (event)',          sql: "SELECT count(*) FROM public.applications a WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = a.event_id)", min: 0, mode: 'eq' },
  { label: 'Aucune application orpheline (creator)',        sql: "SELECT count(*) FROM public.applications a WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.creator_id)", min: 0, mode: 'eq' },
  { label: 'Aucun message orphelin (conversation)',         sql: "SELECT count(*) FROM public.messages m WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = m.conversation_id)", min: 0, mode: 'eq' },

  // Données business
  { label: 'Events terminés non fermés (> 30j)',            sql: "SELECT count(*) FROM public.events WHERE status='published' AND end_date < now() - interval '30 days'", min: 0, mode: 'eq' },
  { label: 'Aucun crédit négatif',                         sql: "SELECT count(*) FROM public.profiles WHERE credit_balance < 0", min: 0, mode: 'eq' },
  { label: 'Aucun contrat sans event',                     sql: "SELECT count(*) FROM public.contracts c WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = c.event_id)", min: 0, mode: 'eq' },
  { label: 'Aucun avis orphelin (reviewer)',                sql: "SELECT count(*) FROM public.reviews r WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = r.reviewer_id)", min: 0, mode: 'eq' },
]

// ─── Checks sécurité HTTP ─────────────────────────────────────
// Headers de sécurité attendus dans chaque réponse
export const SECURITY_HEADERS: string[] = [
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
]

// ─── Endpoints contact/newsletter (doivent accepter les requêtes valides) ──
export const PUBLIC_FORMS: {
  label: string
  path: string
  body: Record<string, string>
  expectedStatus: number[]
}[] = [
  {
    label: 'Newsletter — inscription email valide',
    path: '/api/newsletter',
    body: { email: 'test-playwright@nexart.fr' },
    expectedStatus: [200, 201, 409], // 409 si déjà inscrit
  },
  {
    label: 'Contact — formulaire valide',
    path: '/api/contact',
    body: { name: 'Test Playwright', email: 'test@nexart.fr', subject: 'Test', message: 'Message de test automatisé.' },
    expectedStatus: [200, 201],
  },
]
