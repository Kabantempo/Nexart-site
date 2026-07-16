export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') ?? ''
    )
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!prof?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const { userId, field, value, table } = await req.json()

    if (!['siret_verified', 'insurance_verified', 'verification_doc_verified'].includes(field)) {
      return NextResponse.json({ error: 'Champ invalide' }, { status: 400 })
    }

    const admin = getAdminClient()

    if (table === 'organizer_profiles') {
      const { error } = await admin.from('organizer_profiles').update({ [field]: value } as any).eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await admin.from('creator_profiles').update({ [field]: value } as any).eq('user_id', userId)
      if (error) throw error
    }
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('❌ Verify-creator error:', { error: (error as Error)?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur vérification créateur', details: (error as Error)?.message }, { status: 500 })
  }
}
