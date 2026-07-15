export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const COSTS = {
  boost_application: 1,
  boost_profile: 2,
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const auth = req.headers.get('Authorization')
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: { user }, error: authError } = await admin.auth.getUser(auth.replace('Bearer ', ''))
    if (authError || !user) {
      console.warn('❌ Invalid auth on credits/use')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { type, ref_id } = await req.json()
    if (!COSTS[type as keyof typeof COSTS]) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    const cost = COSTS[type as keyof typeof COSTS]

    // Vérifier la balance
    const { data: rows, error: balanceError } = await admin.from('credits').select('amount').eq('user_id', user.id)
    if (balanceError) throw balanceError

    const balance = (rows || []).reduce((s, r) => s + r.amount, 0)

    if (balance < cost) {
      return NextResponse.json({ error: 'Crédits insuffisants', balance }, { status: 402 })
    }

    // Débiter
    const { error: debitError } = await admin.from('credits').insert({
      user_id: user.id,
      amount: -cost,
      type,
      ref_id: ref_id || null,
      description: type === 'boost_application' ? 'Boost candidature 48h' : 'Boost profil 7 jours',
    })
    if (debitError) throw debitError

    // Appliquer l'effet
    if (type === 'boost_application' && ref_id) {
      const { error: appError } = await admin.from('applications').update({ boosted_at: new Date().toISOString() } as any).eq('id', ref_id).eq('creator_id', user.id)
      if (appError) console.warn('⚠️  Failed to update application boost:', appError)
    }
    if (type === 'boost_profile') {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { error: profError } = await admin.from('profiles').update({ profile_boosted_until: until } as any).eq('id', user.id)
      if (profError) console.warn('⚠️  Failed to update profile boost:', profError)
    }

    console.log('✓ Credits used:', { userId: user.id, type, cost, balance: balance - cost })
    return NextResponse.json({ success: true, new_balance: balance - cost })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Credits use error:', {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur utilisation crédits', details: errorMsg },
      { status: 500 }
    )
  }
}
