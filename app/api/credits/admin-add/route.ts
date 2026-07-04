import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: { user } } = await admin.auth.getUser(auth.replace('Bearer ', ''))
  if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // Vérifier que c'est un admin
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { user_id, amount, description } = await req.json()
  if (!user_id || !amount) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  await admin.from('credits').insert({
    user_id,
    amount: parseInt(amount),
    type: 'admin',
    description: description || `Ajout manuel par admin`,
  })

  return NextResponse.json({ success: true })
}
