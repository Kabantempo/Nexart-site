export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  try {
    const { data: faqs, error } = await (admin as any)
      .from('event_faqs')
      .select('*')
      .eq('event_id', params.id)
      .order('faq_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ faqs: faqs || [] })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { question, answer, keywords } = body

    const { data, error } = await (admin as any)
      .from('event_faqs')
      .insert({
        event_id: params.id,
        question,
        answer,
        keywords: keywords || []
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, faq: data?.[0] })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
