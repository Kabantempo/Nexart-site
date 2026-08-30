export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getAdminClient() as any

    const { data: payments, error } = await admin
      .from('stand_payments')
      .select('id, amount_cents, commission_cents, status, created_at, stripe_payment_id, creator:creator_id(full_name, avatar_url), event:event_id(id, title, start_date, city)')
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (payments ?? []) as {
      id: string
      amount_cents: number
      commission_cents: number
      status: string
      created_at: string
      stripe_payment_id: string | null
      creator: { full_name: string; avatar_url: string | null } | null
      event: { id: string; title: string; start_date: string; city: string } | null
    }[]

    // KPIs
    const completed = rows.filter(p => p.status === 'completed')
    const refunded  = rows.filter(p => p.status === 'refunded')
    const pending   = rows.filter(p => p.status === 'pending')

    const totalBrut      = completed.reduce((s, p) => s + p.amount_cents, 0)
    const totalCommission = completed.reduce((s, p) => s + p.commission_cents, 0)
    const totalNet       = totalBrut - totalCommission
    const totalRefunded  = refunded.reduce((s, p) => s + p.amount_cents, 0)
    const totalPending   = pending.reduce((s, p) => s + p.amount_cents, 0)

    // Par événement
    const byEvent: Record<string, {
      event_id: string
      title: string
      city: string
      start_date: string
      stands_paid: number
      brut_cents: number
      commission_cents: number
      net_cents: number
      refunded_cents: number
    }> = {}

    for (const p of completed) {
      const eid = p.event?.id ?? 'unknown'
      if (!byEvent[eid]) {
        byEvent[eid] = {
          event_id: eid,
          title: p.event?.title ?? '—',
          city: p.event?.city ?? '—',
          start_date: p.event?.start_date ?? '',
          stands_paid: 0,
          brut_cents: 0,
          commission_cents: 0,
          net_cents: 0,
          refunded_cents: 0,
        }
      }
      byEvent[eid].stands_paid++
      byEvent[eid].brut_cents += p.amount_cents
      byEvent[eid].commission_cents += p.commission_cents
      byEvent[eid].net_cents += p.amount_cents - p.commission_cents
    }
    for (const p of refunded) {
      const eid = p.event?.id ?? 'unknown'
      if (byEvent[eid]) byEvent[eid].refunded_cents += p.amount_cents
    }

    return NextResponse.json({
      kpi: {
        brut_cents: totalBrut,
        commission_cents: totalCommission,
        net_cents: totalNet,
        refunded_cents: totalRefunded,
        pending_cents: totalPending,
        transactions: completed.length,
      },
      by_event: Object.values(byEvent).sort((a, b) => b.brut_cents - a.brut_cents),
      recent: rows.slice(0, 50),
    })
  } catch (e: unknown) {
    console.error('❌ GET /api/organizer/revenue:', (e as Error)?.message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
