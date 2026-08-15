export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getAdminClient() as any
    const { data: profile } = await admin.from('profiles').select('referral_code').eq('id', user.id).single()

    let code = profile?.referral_code as string | null | undefined
    if (!code) {
      let attempts = 0
      do {
        const candidate = generateCode()
        attempts++
        if (attempts > 10) return NextResponse.json({ error: 'Génération impossible' }, { status: 500 })
        const { data: existing } = await admin.from('profiles').select('id').eq('referral_code', candidate).maybeSingle()
        if (!existing) { code = candidate; break }
      } while (true)
      await admin.from('profiles').update({ referral_code: code } as any).eq('id', user.id)
    }

    const { count: creditedCount } = await admin
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .not('credited_at', 'is', null)

    const { count: pendingCount } = await admin
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .is('credited_at', null)

    return NextResponse.json({ code, credited: creditedCount ?? 0, pending: pendingCount ?? 0 })
  } catch (error: unknown) {
    console.error('❌ GET /api/referral:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
