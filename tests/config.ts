/**
 * Configuration centrale des tests Nexart
 * → Ajoute ici chaque nouvelle page, endpoint ou feature
 * → npm test les vérifiera automatiquement
 */

export const BASE = 'https://nexart.fr'

// ─── Pages publiques ─────────────────────────────────────────
// Ajoute une entrée à chaque nouvelle route publique
export const PUBLIC_PAGES: { path: string; title: RegExp; heading?: string }[] = [
  { path: '/',               title: /Nexart/ },
  { path: '/events',         title: /Nexart/, heading: 'Événements' },
  { path: '/creators',       title: /Nexart/ },
  { path: '/login',          title: /Nexart/ },
  { path: '/register',       title: /Nexart/ },
  { path: '/patch-notes',    title: /Nexart/ },
  { path: '/conditions',     title: /Nexart/ },
  { path: '/mentions-legales', title: /Nexart/ },
  { path: '/contact',        title: /Nexart/ },
  { path: '/offres',         title: /Nexart/ },
]

// ─── Routes protégées (doivent répondre 200 ou rediriger vers /login) ──
export const PROTECTED_PAGES: string[] = [
  '/dashboard',
  '/events/create',
  '/profile',
]

// ─── Endpoints API publics ────────────────────────────────────
// Ajoute un endpoint à chaque nouvelle API route GET publique
export const PUBLIC_APIS: {
  path: string
  fields: string[]   // champs attendus dans la réponse JSON
  minItems?: number  // nombre minimum d'éléments si tableau
}[] = [
  {
    path: '/api/events',
    fields: ['id', 'title', 'city', 'start_date'],
    minItems: 1,
  },
]

// ─── Endpoints protégés (doivent retourner 401/403 sans token) ──
export const PROTECTED_APIS: string[] = [
  '/api/credits/balance',
  '/api/audit-logs',
  '/api/admin/stats',
  '/api/creator/analytics',
]

// ─── Checks intégrité base de données ────────────────────────
// Ajoute une entrée pour chaque nouvelle table critique
export const DB_CHECKS: {
  label: string
  sql: string
  min: number
  mode?: 'gte' | 'eq'  // gte = attendu >= min | eq = attendu == min (pour vérifier 0 orphelins)
}[] = [
  { label: 'Events publiés',        sql: "SELECT count(*) FROM public.events WHERE status='published'",       min: 1 },
  { label: 'Profils créateurs',     sql: "SELECT count(*) FROM public.profiles WHERE role='creator'",         min: 1 },
  { label: 'Profils organisateurs', sql: "SELECT count(*) FROM public.profiles WHERE role='organizer'",       min: 1 },
  { label: 'Table applications',    sql: "SELECT count(*) FROM public.applications",                          min: 0 },
  { label: 'Table messages',        sql: "SELECT count(*) FROM public.messages",                              min: 0 },
  { label: 'Changelog (WhatsNew)',  sql: "SELECT count(*) FROM public.changelog",                             min: 1 },
  // Intégrité avancée
  { label: 'Aucun event orphelin (organizer manquant)',    sql: "SELECT count(*) FROM public.events e WHERE e.status='published' AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = e.organizer_id)", min: 0, mode: 'eq' },
  { label: 'Aucun event publié sans titre',                sql: "SELECT count(*) FROM public.events WHERE status='published' AND (title IS NULL OR title='')",  min: 0, mode: 'eq' },
  { label: 'Aucune application orpheline (event)',         sql: "SELECT count(*) FROM public.applications a WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = a.event_id)", min: 0, mode: 'eq' },
  { label: 'Aucune application orpheline (creator)',       sql: "SELECT count(*) FROM public.applications a WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.creator_id)", min: 0, mode: 'eq' },
  { label: 'Aucun message orphelin (conversation)',        sql: "SELECT count(*) FROM public.messages m WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = m.conversation_id)", min: 0, mode: 'eq' },
  { label: 'Events terminés non fermés (> 30j)',          sql: "SELECT count(*) FROM public.events WHERE status='published' AND end_date < now() - interval '30 days'", min: 0, mode: 'eq' },
]
