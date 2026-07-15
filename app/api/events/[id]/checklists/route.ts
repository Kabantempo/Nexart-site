export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Checklist templates by event type
const CHECKLIST_TEMPLATES: Record<string, any> = {
  salon: {
    admin: [
      { title: 'Demande d\'autorisation mairie', description: 'Demander permis d\'occupation' },
      { title: 'Assurance responsabilité civile', description: 'Vérifier couverture' },
      { title: 'Permis de stationnement', description: 'Si applicable' }
    ],
    logistique: [
      { title: 'Réservation lieu', description: 'Confirmer disponibilité' },
      { title: 'Tables et chaises', description: 'Commander mobilier' },
      { title: 'Setup jour J', description: 'Planifier installation' }
    ],
    comms: [
      { title: 'Communiqué de presse', description: 'Rédiger et diffuser' },
      { title: 'Réseaux sociaux', description: 'Posts quotidiens' },
      { title: 'Email marketing', description: 'Campagne annonce' }
    ]
  },
  popup: {
    admin: [
      { title: 'Contrats exposants', description: 'Préparer documents' }
    ],
    logistique: [
      { title: 'Espace location', description: 'Confirmer lieu' },
      { title: 'Mobilier minimal', description: 'Tables/éclairage' }
    ],
    comms: [
      { title: 'Annonce réseaux', description: 'Posts Instagram/FB' }
    ]
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('event_checklists')
      .select('*')
      .eq('event_id', params.id)
      .single()

    if (error?.code === 'PGRST116') {
      // Not found, return empty
      return NextResponse.json({ checklist: null })
    }

    if (error) throw error

    return NextResponse.json({ checklist: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { checklist_type, items } = body

    const template = CHECKLIST_TEMPLATES[checklist_type] || CHECKLIST_TEMPLATES.salon
    const defaultItems = Object.values(template).flat()

    const { data, error } = await admin
      .from('event_checklists')
      .upsert({
        event_id: params.id,
        checklist_type,
        items: items || defaultItems
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, checklist: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { items } = body

    const { data, error } = await admin
      .from('event_checklists')
      .update({ items, updated_at: new Date().toISOString() } as any)
      .eq('event_id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, checklist: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
