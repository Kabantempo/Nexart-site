import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from './supabase-admin'

type AdminCheckResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

export async function requireAdmin(req: NextRequest): Promise<AdminCheckResult> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  }
  const admin = getAdminClient()
  const { data: { user }, error } = await admin.auth.getUser(authHeader.substring(7))
  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Session invalide' }, { status: 401 }) }
  }
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) {
    return { ok: false, response: NextResponse.json({ error: 'Accès interdit' }, { status: 403 }) }
  }
  return { ok: true, userId: user.id }
}
