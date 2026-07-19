export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const { data: prof } = await anon.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return null
  return user
}

export async function GET(req: NextRequest) {
  const admin_user = await requireAdmin(req)
  if (!admin_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminClient()
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const query = supabase
      .from('creator_verifications' as any)
      .select(`
        id,
        creator_id,
        siret,
        document_url,
        status,
        rejection_reason,
        reviewed_at,
        created_at,
        profiles!creator_verifications_creator_id_fkey (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    const { data, error } = status === 'all'
      ? await query
      : await query.eq('status', status)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin_user = await requireAdmin(req)
  if (!admin_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminClient()
  try {
    const body = await req.json()
    const { verification_id, action, rejection_reason } = body

    if (!verification_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
    }

    // Fetch the verification to get creator_id & siret
    const { data: verifRaw, error: fetchError } = await supabase
      .from('creator_verifications' as any)
      .select('creator_id, siret')
      .eq('id', verification_id)
      .single()

    if (fetchError || !verifRaw) return NextResponse.json({ error: 'Vérification introuvable' }, { status: 404 })

    const verif = verifRaw as unknown as { creator_id: string; siret: string }
    const { creator_id, siret } = verif

    if (action === 'approve') {
      // Update verification status
      await supabase
        .from('creator_verifications' as any)
        .update({ status: 'approved', reviewed_by: admin_user.id, reviewed_at: new Date().toISOString() })
        .eq('id', verification_id)

      // Mark creator siret_verified
      await supabase
        .from('creator_profiles')
        .upsert({ user_id: creator_id, siret, siret_verified: true } as any, { onConflict: 'user_id' })
    } else {
      await supabase
        .from('creator_verifications' as any)
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason ?? null,
          reviewed_by: admin_user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verification_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
