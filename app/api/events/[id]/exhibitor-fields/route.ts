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
  const admin = getAdminClient()
  try {
    const { data, error } = await (admin as any)
      .from('exhibitor_fields')
      .select('*')
      .eq('event_id', params.id)
      .order('field_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ fields: data || [] })
  } catch (error: any) {
    console.error('Exhibitor fields GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch fields' }, { status: 500 })
  }
}

// POST accepte { fields: [...] } (bulk replace) OU un champ unique
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const admin = getAdminClient()

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }
  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await admin.from('events').select('organizer_id').eq('id', params.id).single()
  if (event?.organizer_id !== user.id) {
    return NextResponse.json({ error: 'Only event organizer can update fields' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Bulk replace: { fields: [...] }
    if (Array.isArray(body.fields)) {
      await (admin as any).from('exhibitor_fields').delete().eq('event_id', params.id)

      if (body.fields.length === 0) {
        return NextResponse.json({ success: true, fields: [] })
      }

      const rows = body.fields.map((f: any, idx: number) => ({
        event_id: params.id,
        field_name: f.field_name || f.field_label?.toLowerCase().replace(/[^a-z0-9]/g, '_') || `field_${idx}`,
        field_type: f.field_type || 'text',
        label: f.field_label || f.label || f.field_name,
        is_required: f.required ?? f.is_required ?? false,
        field_order: idx,
        placeholder: f.placeholder || null,
        options: f.options || null,
      }))

      const { data, error } = await (admin as any)
        .from('exhibitor_fields')
        .insert(rows)
        .select()

      if (error) throw error
      return NextResponse.json({ success: true, fields: data }, { status: 201 })
    }

    // Single field insert (legacy)
    const { field_name, field_type, label, field_label, placeholder, is_required, required, options, field_order } = body
    const resolvedLabel = label || field_label || field_name
    if (!field_name || !field_type || !resolvedLabel) {
      return NextResponse.json({ error: 'field_name, field_type, and label required' }, { status: 400 })
    }

    const { data, error } = await (admin as any)
      .from('exhibitor_fields')
      .insert({
        event_id: params.id,
        field_name,
        field_type,
        label: resolvedLabel,
        placeholder: placeholder || null,
        is_required: required ?? is_required ?? false,
        options: options || null,
        field_order: field_order ?? 0,
      })
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, field: data?.[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor field POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save fields' }, { status: 500 })
  }
}
