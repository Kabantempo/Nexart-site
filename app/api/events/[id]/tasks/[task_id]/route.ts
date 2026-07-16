export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; task_id: string } }
) {
  if (!UUID_RE.test(params.id) || !UUID_RE.test(params.task_id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { status, title, description, assignee_id, deadline } = body

    const admin = getAdminClient()
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updates.status = status
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (assignee_id !== undefined) updates.assignee_id = assignee_id
    if (deadline !== undefined) updates.deadline = deadline

    const { data, error } = await admin
      .from('event_tasks')
      .update(updates)
      .eq('id', params.task_id)
      .eq('event_id', params.id)
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, task: data?.[0] })
  } catch (error: any) {
    console.error('PATCH /tasks/[task_id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; task_id: string } }
) {
  if (!UUID_RE.test(params.id) || !UUID_RE.test(params.task_id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const token = req.headers.get('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { error } = await admin
      .from('event_tasks')
      .delete()
      .eq('id', params.task_id)
      .eq('event_id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /tasks/[task_id]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
