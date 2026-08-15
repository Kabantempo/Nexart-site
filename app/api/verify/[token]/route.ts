export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: doc, error } = await (supabaseAdmin as any)
      .from('event_documents')
      .select(`
        *,
        creator:profiles!creator_id(full_name),
        event:events!event_id(title, start_date)
      `)
      .eq('verification_token', params.token)
      .single()

    if (error || !doc) {
      return NextResponse.json({ valid: false })
    }

    const already_scanned = !!doc.verified_at

    if (!already_scanned) {
      await (supabaseAdmin as any)
        .from('event_documents')
        .update({ verified_at: new Date().toISOString() })
        .eq('verification_token', params.token)
    }

    return NextResponse.json({
      valid: true,
      creator_name: doc.creator?.full_name,
      event_title: doc.event?.title,
      event_date: doc.event?.start_date
        ? new Date(doc.event.start_date).toLocaleDateString('fr-FR')
        : undefined,
      stand_number: doc.stand_number || undefined,
      document_type: doc.type === 'convocation' ? 'Convocation' : 'Contrat',
      verified_at: doc.verified_at,
      already_scanned,
    })
  } catch (err) {
    console.error('[POST /api/verify/[token]]', err)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
