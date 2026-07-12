import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const admin = getAdminClient()
  try {
    const { data: faqs, error } = await (admin as any)
      .from('event_faqs')
      .select('*')
      .eq('event_id', params.id)
      .order('faq_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ faqs: faqs || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
