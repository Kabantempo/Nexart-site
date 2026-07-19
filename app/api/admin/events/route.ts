export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
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
    const status = searchParams.get('status') || 'draft'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await supabase
      .from('events')
      .select(`
        id,
        title,
        organizer_id,
        status,
        start_date,
        end_date,
        stand_count,
        created_at,
        profiles!events_organizer_id_fkey (full_name, email)
      `, { count: 'exact' })
      .eq('status', status as 'draft' | 'published' | 'closed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin_user = await requireAdmin(req)
  if (!admin_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminClient()
  try {
    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const schema = z.object({
      event_id: uuidSchema,
      action: z.enum(['approve', 'reject', 'unpublish']),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { event_id, action } = body

    if (action === 'approve') {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', event_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Event approved' })
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('id', event_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Event rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
