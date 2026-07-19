export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getAuthUser(req: NextRequest) {
  const header = req.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  if (!token) return null
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error } = await anon.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('event_tasks')
      .select(`*, profiles!event_tasks_assignee_id_fkey (full_name)`)
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ tasks: data || [] })
  } catch (error: unknown) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admin = getAdminClient()
    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const schema = z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      assignee_id: uuidSchema.optional(),
      deadline: z.string().datetime().optional(),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { title, description, assignee_id, deadline } = body
    const { data, error } = await admin
      .from('event_tasks')
      .insert({ event_id: params.id, creator_id: user.id, assignee_id, title, description, deadline, status: 'not_started' })
      .select()
    if (error) throw error
    return NextResponse.json({ success: true, task: data?.[0] })
  } catch (error: unknown) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
