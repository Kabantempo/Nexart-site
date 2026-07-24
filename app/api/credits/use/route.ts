export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const COSTS: Record<string, number> = {
  boost_application: 1,
  boost_profile: 2,
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) {
      console.warn('❌ Invalid auth on credits/use')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { validate, creditUseSchema } = await import('@/lib/validate')
    const { data: body, error: validErr } = validate(creditUseSchema, await req.json())
    if (validErr) return validErr
    const { type, ref_id } = body
    const cost = COSTS[type]
    if (!cost) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    const admin = getAdminClient()

    // Use atomic consume_credit() to prevent race conditions (uses FOR UPDATE internally)
    const { data: consumed, error: consumeError } = await (admin as any).rpc('consume_credit', {
      p_user_id: user.id,
      p_type: type,
    })
    if (consumeError) throw consumeError
    if (!consumed) return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 })

    if (type === 'boost_application' && ref_id) {
      await admin.from('applications').update({ boosted_at: new Date().toISOString() } as any).eq('id', ref_id).eq('creator_id', user.id)
    }
    if (type === 'boost_profile') {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await admin.from('profiles').update({ profile_boosted_until: until } as any).eq('id', user.id)
    }

    const { data: balRows } = await admin.from('credits').select('amount').eq('user_id', user.id)
    const new_balance = (balRows || []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    return NextResponse.json({ success: true, new_balance })
  } catch (error: unknown) {
    console.error('❌ Credits use error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur utilisation crédits' }, { status: 500 })
  }
}
