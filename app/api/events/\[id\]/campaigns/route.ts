import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Campaigns error:', error)
    return NextResponse.json({ error: 'Erreur chargement campagnes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { title, subject, message } = await req.json()

    if (!title || !subject) {
      return NextResponse.json({ error: 'Titre et sujet requis' }, { status: 400 })
    }

    // Get event organizer ID (current user)
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.substring(7)

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        event_id: params.id,
        title,
        subject,
        message,
        status: 'draft',
        recipient_count: 0,
        open_rate: 0,
        click_rate: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: 'Erreur création campagne' }, { status: 500 })
  }
}
