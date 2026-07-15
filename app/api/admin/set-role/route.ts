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

    const { userId, field, value } = await req.json()
    if (!userId || !field || typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }
    if (!['is_creator', 'is_organizer'].includes(field)) {
      return NextResponse.json({ error: 'Champ invalide' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error } = await admin.from('profiles').update({ [field]: value } as any).eq('id', userId)
    if (error) throw error

    console.log('✓ Role set:', { userId, field, value })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('❌ Set-role error:', { error: error?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur modification rôle', details: error?.message }, { status: 500 })
  }
}
