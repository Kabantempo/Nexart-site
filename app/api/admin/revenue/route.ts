export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const admin = getAdminClient()

  const { data: payments, error } = await (admin as any)
    .from('stand_payments')
    .select(`
      id,
      amount_cents,
      commission_cents,
      status,
      created_at,
      stripe_payment_id,
      application_id,
      event_id,
      creator_id,
      organizer_id,
      events ( title ),
      profiles!stand_payments_creator_id_fkey ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (payments ?? []) as Array<{
    id: string
    amount_cents: number
    commission_cents: number
    status: string
    created_at: string
    stripe_payment_id: string
    application_id: string
    event_id: string
    creator_id: string
    organizer_id: string
    events: { title: string } | null
    profiles: { full_name: string | null } | null
  }>

  const totalRevenue = rows.reduce((s, r) => s + (r.amount_cents ?? 0), 0)
  const totalCommission = rows.reduce((s, r) => s + (r.commission_cents ?? 0), 0)
  const totalRefunded = rows.filter(r => r.status === 'refunded').reduce((s, r) => s + (r.amount_cents ?? 0), 0)
  const paid = rows.filter(r => r.status !== 'refunded').length
  const refunded = rows.filter(r => r.status === 'refunded').length

  return NextResponse.json({
    kpi: {
      total_revenue_cents: totalRevenue,
      total_commission_cents: totalCommission,
      total_refunded_cents: totalRefunded,
      paid_count: paid,
      refunded_count: refunded,
    },
    transactions: rows.map(r => ({
      id: r.id,
      amount_cents: r.amount_cents,
      commission_cents: r.commission_cents,
      status: r.status,
      created_at: r.created_at,
      stripe_payment_id: r.stripe_payment_id,
      event_title: r.events?.title ?? '—',
      creator_name: r.profiles?.full_name ?? '—',
      event_id: r.event_id,
    })),
  })
}
