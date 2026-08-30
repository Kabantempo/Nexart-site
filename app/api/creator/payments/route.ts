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

    const { data, error } = await admin
      .from('stand_payments')
      .select(`
        id,
        amount_cents,
        commission_cents,
        status,
        created_at,
        stripe_payment_id,
        application_id,
        event:event_id (
          id, title, start_date, city, cover_image,
          organizer:organizer_id ( full_name )
        )
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ payments: data ?? [] })
  } catch (e: unknown) {
    console.error('❌ GET /api/creator/payments:', (e as Error)?.message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
