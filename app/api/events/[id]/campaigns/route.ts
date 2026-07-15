export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_campaigns')
      .select('*')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('❌ Campaigns GET error:', { error: error?.message, details: error })
    return NextResponse.json({ error: 'Erreur chargement campagnes', details: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { title, subject, message } = body

    const { data, error } = await supabase
      .from('event_campaigns')
      .insert([{ event_id: params.id, title, subject, message, status: 'draft' }])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Erreur création campagne' }, { status: 500 })
  }
}

// PATCH: send campaign to all approved exhibitors via Resend
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { campaign_id } = await req.json()

    if (!campaign_id) return NextResponse.json({ error: 'campaign_id requis' }, { status: 400 })

    // Get campaign
    const { data: campaign, error: camErr } = await supabase
      .from('event_campaigns').select('*').eq('id', campaign_id).eq('event_id', params.id).single()
    if (camErr || !campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    if (campaign.status === 'sent') return NextResponse.json({ error: 'Déjà envoyée' }, { status: 400 })

    // Get event title
    const { data: event } = await supabase.from('events').select('title').eq('id', params.id).single()

    // Get approved exhibitors emails
    const { data: exhibitors } = await supabase
      .from('event_exhibitor_responses')
      .select('exhibitor_id, profiles:exhibitor_id(full_name, email)')
      .eq('event_id', params.id)
      .eq('status', 'approved')

    const recipients = (exhibitors ?? [])
      .map((e: any) => ({ name: e.profiles?.full_name || 'Exposant', email: e.profiles?.email }))
      .filter((r: any) => r.email)

    if (!recipients.length) return NextResponse.json({ error: 'Aucun exposant approuvé', sent: 0 }, { status: 200 })

    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping email send')
      await supabase.from('event_campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', campaign_id)
      return NextResponse.json({ success: true, sent: 0, warning: 'RESEND_API_KEY manquant' })
    }

    let sent = 0
    for (const r of recipients) {
      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1a1a1a">${event?.title || 'Événement'}</h2>
          <h3>${campaign.subject}</h3>
          <div style="white-space:pre-wrap;color:#444;line-height:1.6">${campaign.message}</div>
          <p style="color:#888;font-size:12px;margin-top:32px">Nexart — La plateforme des marchés artisanaux</p>
        </div>`
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'noreply@nexart.fr', to: r.email, subject: campaign.subject, html }),
      })
      if (res.ok) sent++
    }

    await supabase.from('event_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString(), open_rate: 0 })
      .eq('id', campaign_id)

    console.log(`✓ Campaign sent: ${campaign_id} → ${sent}/${recipients.length} emails`)
    return NextResponse.json({ success: true, sent, total: recipients.length })
  } catch (error: any) {
    console.error('Campaigns PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
