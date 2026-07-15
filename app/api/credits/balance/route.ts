export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const auth = req.headers.get('Authorization')
    if (!auth) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await admin.auth.getUser(auth.replace('Bearer ', ''))
    if (authError || !user) {
      console.warn('❌ Invalid auth on credits/balance')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { data, error: creditsError } = await admin
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)

    if (creditsError) throw creditsError

    const balance = (data || []).reduce((sum, r) => sum + r.amount, 0)

    const { data: history, error: historyError } = await admin
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (historyError) throw historyError

    return NextResponse.json({ balance, history: history || [] })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Credits balance error:', {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur chargement solde', details: errorMsg },
      { status: 500 }
    )
  }
}
