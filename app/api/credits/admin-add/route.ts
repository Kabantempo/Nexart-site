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

    const { validate, creditAdminSchema } = await import('@/lib/validate')
    const { data: body, error: validErr } = validate(creditAdminSchema, await req.json())
    if (validErr) return validErr
    const { user_id, amount, description } = body

    const { error: insertError } = await admin.from('credits').insert({
      user_id,
      amount,
      type: 'admin',
      description: description || 'Ajout manuel par admin',
    })
    if (insertError) throw insertError
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMsg = (error as Error)?.message || 'Unknown error'
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
