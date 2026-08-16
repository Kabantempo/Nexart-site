export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

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

    const { insurance_doc_url } = await req.json()
    if (!insurance_doc_url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

    const supabase = getAdminClient()

    // Save doc URL on creator_profiles
    await supabase
      .from('creator_profiles')
      .update({ insurance_doc_url, insurance_verified: false })
      .eq('user_id', user.id)

    // Notify all admins
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map((a: { id: string }) => ({
          user_id: a.id,
          type: 'rc_pro_pending',
          title: 'RC Pro à vérifier',
          body: `Nouveau document de ${profile?.full_name ?? 'Créateur'}`,
          link: '/profile?tab=admin&section=creators',
        }))
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
