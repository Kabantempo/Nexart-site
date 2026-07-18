export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) {
      console.warn('❌ Invalid auth on credits/balance')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const admin = getAdminClient()
    const { data, error: creditsError } = await admin.from('credits').select('amount').eq('user_id', user.id)
    if (creditsError) throw creditsError

    const balance = (data || []).reduce((sum, r) => sum + r.amount, 0)

    const { data: history, error: historyError } = await admin
      .from('credits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    if (historyError) throw historyError

    return NextResponse.json({ balance, history: history || [] })
  } catch (error: unknown) {
    console.error('❌ Credits balance error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur chargement solde', details: (error as Error)?.message }, { status: 500 })
  }
}
