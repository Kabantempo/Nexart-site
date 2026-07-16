export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const auth = req.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) {
      console.warn('❌ Invalid auth on credits/admin-add')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    // Vérifier que c'est un admin
    const { data: profile, error: profileError } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (profileError) throw profileError
    if (!profile?.is_admin) {
      console.warn('❌ Non-admin tried to add credits:', { userId: user.id })
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { user_id, amount, description } = await req.json()
    if (!user_id || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const { error: insertError } = await admin.from('credits').insert({
      user_id,
      amount: parseInt(amount),
      type: 'admin',
      description: description || `Ajout manuel par admin`,
    })
    if (insertError) throw insertError
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Admin add credits error:', {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur ajout crédits', details: errorMsg },
      { status: 500 }
    )
  }
}
