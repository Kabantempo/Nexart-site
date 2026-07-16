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

    const { type, ref_id } = await req.json()
    const cost = COSTS[type]
    if (!cost) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    const admin = getAdminClient()
    const { data: rows, error: balanceError } = await admin.from('credits').select('amount').eq('user_id', user.id)
    if (balanceError) throw balanceError

    const balance = (rows || []).reduce((s, r) => s + r.amount, 0)
    if (balance < cost) return NextResponse.json({ error: 'Crédits insuffisants', balance }, { status: 402 })

    const { error: debitError } = await admin.from('credits').insert({
      user_id: user.id, amount: -cost, type, ref_id: ref_id || null,
      description: type === 'boost_application' ? 'Boost candidature 48h' : 'Boost profil 7 jours',
    })
    if (debitError) throw debitError

    if (type === 'boost_application' && ref_id) {
      await admin.from('applications').update({ boosted_at: new Date().toISOString() } as any).eq('id', ref_id).eq('creator_id', user.id)
    }
    if (type === 'boost_profile') {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await admin.from('profiles').update({ profile_boosted_until: until } as any).eq('id', user.id)
    }
    return NextResponse.json({ success: true, new_balance: balance - cost })
  } catch (error: any) {
    console.error('❌ Credits use error:', { error: error?.message })
    return NextResponse.json({ error: 'Erreur utilisation crédits', details: error?.message }, { status: 500 })
  }
}
