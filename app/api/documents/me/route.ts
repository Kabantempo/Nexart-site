export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// GET /api/documents/me
// Auth: créateur connecté
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user } } = await admin.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data, error } = await (admin as any)
      .from('event_documents')
      .select('*, event:events!event_id(title, start_date, city)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ documents: data })
  } catch (err) {
    console.error('[GET /api/documents/me]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
