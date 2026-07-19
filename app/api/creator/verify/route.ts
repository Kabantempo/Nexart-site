export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { validate as v, z } from '@/lib/validate'

const bodySchema = z.object({
  siret: z.string().regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres'),
  document_url: z.string().url().optional(),
})

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user } } = await anon.auth.getUser(token)
  return user ?? null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const parsed = v(bodySchema, body)
    if (parsed.error) return parsed.error

    const { siret, document_url } = parsed.data
    const supabase = getAdminClient()

    // Insert verification request
    const { error: insertError } = await supabase
      .from('creator_verifications' as any)
      .insert({
        creator_id: user.id,
        siret,
        document_url: document_url ?? null,
        status: 'pending',
      })

    if (insertError) throw insertError

    // Update siret on creator_profiles (not yet verified)
    await supabase
      .from('creator_profiles')
      .upsert({ user_id: user.id, siret } as any, { onConflict: 'user_id' })

    return NextResponse.json({ ok: true, message: 'Demande soumise, vérification sous 48h' })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
