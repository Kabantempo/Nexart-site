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
      .from('exhibitor_fields')
      .select('*')
      .eq('event_id', params.id)
      .order('field_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ fields: data || [] })
  } catch (error: any) {
    console.error('Exhibitor fields GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fields' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: event } = await admin
      .from('events')
      .select('organizer_id')
      .eq('id', params.id)
      .single()

    if (event?.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only event organizer can create fields' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      field_name,
      field_type,
      label,
      placeholder,
      description,
      is_required,
      validation_pattern,
      min_length,
      max_length,
      options,
      field_order,
    } = body

    if (!field_name || !field_type || !label) {
      return NextResponse.json(
        { error: 'field_name, field_type, and label required' },
        { status: 400 }
      )
    }

    const { data, error } = await admin
      .from('exhibitor_fields')
      .insert({
        event_id: params.id,
        field_name,
        field_type,
        label,
        placeholder: placeholder || null,
        description: description || null,
        is_required: is_required !== false,
        validation_pattern: validation_pattern || null,
        min_length: min_length || null,
        max_length: max_length || null,
        options: options || null,
        field_order: field_order || 0,
      })
      .select()

    if (error) throw error

    return NextResponse.json(
      { success: true, field: data?.[0] },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Exhibitor field POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create field' },
      { status: 500 }
    )
  }
}
