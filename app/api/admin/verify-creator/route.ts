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

    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const schema = z.object({
      userId: uuidSchema,
      field: z.enum(['siret_verified', 'insurance_verified', 'verification_doc_verified']),
      value: z.boolean(),
      table: z.enum(['creator_profiles', 'organizer_profiles']).optional(),
    })
    const { data, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { userId, field, value, table } = data

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
