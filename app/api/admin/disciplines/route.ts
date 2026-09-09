export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/require-admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const admin = getAdminClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const query = admin
    .from('custom_discipline_requests' as any)
    .select(`
      id, name, status, rejection_reason, created_at,
      profiles!custom_discipline_requests_user_id_fkey (id, full_name, avatar_url)
    `)
    .order('created_at', { ascending: true })

  const { data, error } = status === 'all' ? await query : await query.eq('status', status)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  const admin = getAdminClient()
  const { id, action, rejection_reason } = await req.json()

  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  // Récupérer la demande
  const { data: req_data, error: fetchErr } = await admin
    .from('custom_discipline_requests' as any)
    .select('user_id, name')
    .eq('id', id)
    .single()

  if (fetchErr || !req_data) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
  const { user_id, name } = req_data as unknown as { user_id: string; name: string }

  const status = action === 'approve' ? 'approved' : 'rejected'
  await admin
    .from('custom_discipline_requests' as any)
    .update({ status, rejection_reason: rejection_reason ?? null, reviewed_by: auth.userId, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  // Si approuvé → ajouter à creator_profiles.disciplines
  if (action === 'approve') {
    const { data: cp } = await admin
      .from('creator_profiles')
      .select('disciplines')
      .eq('user_id', user_id)
      .maybeSingle()

    const current: string[] = (cp as any)?.disciplines ?? []
    if (!current.includes(name)) {
      await admin
        .from('creator_profiles')
        .update({ disciplines: [...current, name] })
        .eq('user_id', user_id)
    }
  }

  return NextResponse.json({ ok: true })
}
