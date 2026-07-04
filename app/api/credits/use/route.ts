import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const COSTS = {
  boost_application: 1,
  boost_profile: 2,
}

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  const auth = req.headers.get('Authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''))
  if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { type, ref_id } = await req.json()
  if (!COSTS[type as keyof typeof COSTS]) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  const cost = COSTS[type as keyof typeof COSTS]

  // Vérifier la balance
  const { data: rows } = await admin.from('credits').select('amount').eq('user_id', user.id)
  const balance = (rows || []).reduce((s, r) => s + r.amount, 0)

  if (balance < cost) {
    return NextResponse.json({ error: 'Crédits insuffisants', balance }, { status: 402 })
  }

  // Débiter
  await admin.from('credits').insert({
    user_id: user.id,
    amount: -cost,
    type,
    ref_id: ref_id || null,
    description: type === 'boost_application' ? 'Boost candidature 48h' : 'Boost profil 7 jours',
  })

  // Appliquer l'effet
  if (type === 'boost_application' && ref_id) {
    await admin.from('applications').update({ boosted_at: new Date().toISOString() }).eq('id', ref_id).eq('creator_id', user.id)
  }
  if (type === 'boost_profile') {
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await admin.from('profiles').update({ profile_boosted_until: until }).eq('id', user.id)
  }

  return NextResponse.json({ success: true, new_balance: balance - cost })
}
