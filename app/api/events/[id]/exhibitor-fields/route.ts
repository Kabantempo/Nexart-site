import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('event_exhibitor_fields')
      .select('*')
      .eq('event_id', params.id)
      .order('field_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ fields: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { fields } = body

    // Delete existing fields
    await supabase
      .from('event_exhibitor_fields')
      .delete()
      .eq('event_id', params.id)

    // Insert new fields
    if (fields && fields.length > 0) {
      const { error } = await supabase
        .from('event_exhibitor_fields')
        .insert(
          fields.map((f: any, idx: number) => ({
            event_id: params.id,
            field_name: f.field_name,
            field_label: f.field_label,
            field_type: f.field_type,
            options: f.options,
            required: f.required,
            field_order: idx
          }))
        )

      if (error) throw error
    }

    return NextResponse.json({ success: true, count: fields?.length || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
