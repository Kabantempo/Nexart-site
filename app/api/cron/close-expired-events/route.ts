export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

// Ferme automatiquement les events publiés dont la date de fin est passée depuis +30 jours
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'CRON_SECRET_TOKEN non configuré' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.substring(7) !== process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('events')
      .update({ status: 'closed' })
      .eq('status', 'published')
      .lt('end_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .select('id, title')

    if (error) throw error

    return NextResponse.json({
      closed: data?.length ?? 0,
      events: data?.map(e => ({ id: e.id, title: e.title })) ?? [],
    })
  } catch (err) {
    console.error('[cron/close-expired-events]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
