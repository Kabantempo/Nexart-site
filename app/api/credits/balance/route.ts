import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const admin = getAdminClient()
  const auth = req.headers.get('Authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''))
  if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { data } = await admin
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)

  const balance = (data || []).reduce((sum, r) => sum + r.amount, 0)

  const { data: history } = await admin
    .from('credits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ balance, history: history || [] })
}
