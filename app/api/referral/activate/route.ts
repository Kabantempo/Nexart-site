export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const { referral_code } = await req.json()
    if (!referral_code || typeof referral_code !== 'string') {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getAdminClient() as any

    const { data: referrer } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_code', referral_code.toUpperCase())
      .maybeSingle()

    if (!referrer) return NextResponse.json({ error: 'Code introuvable' }, { status: 404 })
    if (referrer.id === user.id) return NextResponse.json({ error: 'Autoparrainage interdit' }, { status: 400 })

    const { data: existingRef } = await admin
      .from('referrals')
      .select('id, credited_at')
      .eq('referee_id', user.id)
      .maybeSingle()

    if (existingRef?.credited_at) {
      return NextResponse.json({ success: true, already_credited: true })
    }

    if (!existingRef) {
      await admin.from('referrals').insert({ referrer_id: referrer.id, referee_id: user.id })
    }

    const now = new Date().toISOString()
    await Promise.all([
      admin.from('credits').insert({ user_id: referrer.id, amount: 1, type: 'gift', description: 'Parrainage créateur accepté', ref_id: user.id }),
      admin.from('credits').insert({ user_id: user.id, amount: 1, type: 'gift', description: 'Bienvenue via parrainage', ref_id: referrer.id }),
      admin.from('referrals').update({ credited_at: now }).eq('referee_id', user.id),
    ])

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('❌ POST /api/referral/activate:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
