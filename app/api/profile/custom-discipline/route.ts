export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminClient } from '@/lib/supabase-admin'

function getUserFromToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return supabase.auth.getUser(token)
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: { user }, error: authErr } = await getUserFromToken(token)
  if (authErr || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('custom_discipline_requests' as any)
    .select('id, name, status, rejection_reason, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: { user }, error: authErr } = await getUserFromToken(token)
  if (authErr || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

  const body = await req.json()
  const name = (body.name ?? '').trim()
  if (!name || name.length < 2 || name.length > 50) {
    return NextResponse.json({ error: 'Nom invalide (2-50 caractères)' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Limite 1 par jour
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count } = await admin
    .from('custom_discipline_requests' as any)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  if ((count ?? 0) >= 1) {
    return NextResponse.json({ error: 'Limite atteinte : 1 discipline personnalisée par jour' }, { status: 429 })
  }

  const { data, error } = await admin
    .from('custom_discipline_requests' as any)
    .insert({ user_id: user.id, name })
    .select('id, name, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
