import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET: List FAQs
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const { data: faqs, error } = await supabase
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

// POST: Add FAQ
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { question, answer, keywords } = body

    const { data, error } = await supabase
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
