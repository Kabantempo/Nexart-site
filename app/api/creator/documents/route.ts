export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function requireCreator(req: NextRequest) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  return user ?? null
}

// GET /api/creator/documents — liste les candidatures confirmed/awaiting_payment du créateur avec leurs contrats
export async function GET(req: NextRequest) {
  const user = await requireCreator(req)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data, error } = await admin
      .from('applications')
      .select(`
        id, status, created_at, stand_price_cents, paid_at,
        event:event_id (id, title, city, start_date, end_date)
      `)
      .eq('creator_id', user.id)
      .in('status', ['confirmed', 'awaiting_payment', 'accepted'])
      .order('created_at', { ascending: false })

    if (error) throw error

    // Charger les contrats séparément
    const appIds = (data || []).map((a: any) => a.id)
    let contracts: any[] = []
    if (appIds.length > 0) {
      const { data: c } = await admin
        .from('contracts')
        .select('id, application_id, pdf_url, status')
        .in('application_id', appIds)
      contracts = c || []
    }

    const contractByApp = Object.fromEntries(contracts.map((c: any) => [c.application_id, c]))

    const documents = (data || []).map((a: any) => ({
      ...a,
      contract: contractByApp[a.id] || null,
    }))

    return NextResponse.json({ documents })
  } catch (err) {
    console.error('[GET /api/creator/documents]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
