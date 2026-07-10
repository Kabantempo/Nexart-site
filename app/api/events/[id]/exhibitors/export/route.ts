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
    // Get event fields to know column order
    const { data: fields } = await supabase
      .from('event_exhibitor_fields')
      .select('field_name, field_label')
      .eq('event_id', params.id)
      .order('field_order', { ascending: true })

    // Get all exhibitor responses
    const { data: exhibitors, error } = await supabase
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

    // Build CSV
    const headers = ['ID', 'Name', 'Email', 'Status', 'Tables', 'Submitted At']
    const fieldLabels = (fields || []).map(f => f.field_label)
    const csvHeaders = [...headers, ...fieldLabels].join(',')

    const rows = (exhibitors || []).map(e => {
      const profile = (e as any).profiles
      const data = [
        `"${e.id}"`,
        `"${profile?.full_name || ''}"`,
        `"${profile?.email || ''}"`,
        `"${e.status}"`,
        e.tables_count,
        `"${new Date(e.submitted_at).toISOString()}"`
      ]

      // Add custom fields
      const responseData = e.response_data as Record<string, any>
      fieldLabels.forEach(label => {
        const fieldName = (fields || []).find(f => f.field_label === label)?.field_name
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
