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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const admin = getAdminClient()
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', params.id).single()
    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: fields } = await (admin as any)
      .from('event_exhibitor_fields')
      .select('field_name, field_label')
      .eq('event_id', params.id)
      .order('field_order', { ascending: true })

    const { data: exhibitors, error } = await (admin as any)
      .from('event_exhibitor_responses')
      .select(`
        id,
        exhibitor_id,
        response_data,
        status,
        tables_count,
        submitted_at,
        profiles!event_exhibitor_responses_exhibitor_id_fkey (full_name)
      `)
      .eq('event_id', params.id)

    if (error) throw error

    const headers = ['ID', 'Name', 'Email', 'Status', 'Tables', 'Submitted At']
    const fieldLabels = (fields || []).map((f: any) => f.field_label)
    const csvHeaders = [...headers, ...fieldLabels].join(',')

    const rows = (exhibitors || []).map((e: any) => {
      const profile = e.profiles
      const data = [
        `"${e.id}"`,
        `"${profile?.full_name || ''}"`,
        `"${profile?.email || ''}"`,
        `"${e.status}"`,
        e.tables_count,
        `"${new Date(e.submitted_at).toISOString()}"`
      ]

      const responseData = e.response_data as Record<string, any>
      fieldLabels.forEach((label: string) => {
        const fieldName = (fields || []).find((f: any) => f.field_label === label)?.field_name
        const value = fieldName ? responseData?.[fieldName] : ''
        data.push(`"${value || ''}"`)
      })

      return data.join(',')
    })

    const csv = [csvHeaders, ...rows].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="exhibitors-${params.id}-${Date.now()}.csv"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
