import { NextResponse } from 'next/server'

const PAT = process.env.SUPABASE_PAT!
const PROJECT = process.env.SUPABASE_PROJECT_REF!

async function sql(query: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function GET() {
  const [
    users, events, applications, dailySignups, eventTypes, verifications, messages,
    conversionCreator, conversionOrganizer, fillRate, liquidity, retention30,
  ] = await Promise.all([
    sql(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'creator')::int AS creators,
        COUNT(*) FILTER (WHERE role = 'organizer')::int AS organizers,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_month,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::int AS new_today
      FROM profiles
    `),
    sql(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
      FROM events
    `),
    sql(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
        COUNT(*) FILTER (WHERE status = 'refused')::int AS refused
      FROM applications
    `),
    sql(`
      SELECT
        TO_CHAR(created_at::date, 'DD/MM') AS date,
        COUNT(*)::int AS count
      FROM profiles
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY created_at::date ASC
    `),
    sql(`
      SELECT event_type, COUNT(*)::int AS count
      FROM events
      GROUP BY event_type
      ORDER BY count DESC
    `),
    sql(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE siret_verified = true)::int AS siret_verified,
        COUNT(*) FILTER (WHERE siret_verified = false AND siret_number IS NOT NULL)::int AS siret_pending,
        COUNT(*) FILTER (WHERE insurance_verified = true)::int AS insurance_verified,
        COUNT(*) FILTER (WHERE insurance_verified = false AND insurance_doc_url IS NOT NULL)::int AS insurance_pending
      FROM creator_profiles
    `),
    sql(`SELECT COUNT(*)::int AS total FROM messages`),

    // Taux de conversion créateurs (au moins 1 candidature / total créateurs)
    sql(`
      SELECT
        COUNT(DISTINCT a.creator_id)::int AS active,
        COUNT(p.id)::int AS total
      FROM profiles p
      LEFT JOIN applications a ON a.creator_id = p.id
      WHERE p.role = 'creator'
    `),

    // Taux de conversion organisateurs (au moins 1 événement publié / total organisateurs)
    sql(`
      SELECT
        COUNT(DISTINCT e.organizer_id)::int AS active,
        COUNT(p.id)::int AS total
      FROM profiles p
      LEFT JOIN events e ON e.organizer_id = p.id AND e.status = 'published'
      WHERE p.role = 'organizer'
    `),

    // Taux de remplissage : candidatures acceptées / total stands publiés
    sql(`
      SELECT
        COALESCE(SUM(e.stand_count), 0)::int AS total_stands,
        COUNT(a.id) FILTER (WHERE a.status = 'accepted')::int AS filled_stands
      FROM events e
      LEFT JOIN applications a ON a.event_id = e.id
      WHERE e.status = 'published' AND e.stand_count IS NOT NULL
    `),

    // Liquidité : temps moyen (en heures) entre création événement et première candidature
    sql(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (first_app.created_at - e.created_at)) / 3600))::int AS avg_hours
      FROM events e
      INNER JOIN (
        SELECT event_id, MIN(created_at) AS created_at
        FROM applications
        GROUP BY event_id
      ) first_app ON first_app.event_id = e.id
    `),

    // Rétention 30 jours : utilisateurs inscrits il y a 30-60 jours ayant une activité récente
    sql(`
      SELECT
        COUNT(*)::int AS cohort_total,
        COUNT(*) FILTER (
          WHERE id IN (
            SELECT DISTINCT creator_id FROM applications WHERE created_at >= NOW() - INTERVAL '30 days'
            UNION
            SELECT DISTINCT organizer_id FROM events WHERE updated_at >= NOW() - INTERVAL '30 days'
            UNION
            SELECT DISTINCT sender_id FROM messages WHERE created_at >= NOW() - INTERVAL '30 days'
          )
        )::int AS retained
      FROM profiles
      WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
    `),
  ])

  return NextResponse.json({
    users: users[0] ?? {},
    events: events[0] ?? {},
    applications: applications[0] ?? {},
    dailySignups: dailySignups ?? [],
    eventTypes: eventTypes ?? [],
    verifications: verifications[0] ?? {},
    messages: messages[0] ?? {},
    kpi: {
      conversionCreator: conversionCreator[0] ?? { active: 0, total: 0 },
      conversionOrganizer: conversionOrganizer[0] ?? { active: 0, total: 0 },
      fillRate: fillRate[0] ?? { total_stands: 0, filled_stands: 0 },
      liquidity: liquidity[0] ?? { avg_hours: null },
      retention30: retention30[0] ?? { cohort_total: 0, retained: 0 },
      // Stripe / abonnements — disponible après intégration Stripe Connect
      mrr: 0,
      churnRate: null,
      cac: null,
      ltv: null,
      gmv: 0,
      arpu: 0,
    },
  })
}
