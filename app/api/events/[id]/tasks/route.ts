export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('event_tasks')
      .select(`
        *,
        profiles!event_tasks_assignee_id_fkey (full_name)
      `)
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tasks: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { title, description, assignee_id, deadline } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await admin
      .from('event_tasks')
      .insert({
        event_id: params.id,
        creator_id: user.id,
        assignee_id,
        title,
        description,
        deadline,
        status: 'not_started'
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, task: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
