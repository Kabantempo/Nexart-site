export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

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
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admin = getAdminClient()
    const { validate: v, z } = await import('@/lib/validate')
    const postSchema = z.object({
      checklist_type: z.string().min(1).max(50),
      items: z.array(z.unknown()).optional(),
    })
    const { data: body, error: validErr } = v(postSchema, await req.json())
    if (validErr) return validErr
    const { checklist_type, items } = body

    const template = CHECKLIST_TEMPLATES[checklist_type] || CHECKLIST_TEMPLATES.salon
    const defaultItems = Object.values(template).flat()

    const { data, error } = await admin
      .from('event_checklists')
      .upsert({
        event_id: params.id,
        checklist_type,
        items: (items || defaultItems) as any
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, checklist: data?.[0] })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admin = getAdminClient()
    const { validate: v, z } = await import('@/lib/validate')
    const patchSchema = z.object({ items: z.array(z.unknown()) })
    const { data: body, error: validErr } = v(patchSchema, await req.json())
    if (validErr) return validErr
    const { items } = body

    const { data, error } = await admin
      .from('event_checklists')
      .update({ items, updated_at: new Date().toISOString() } as any)
      .eq('event_id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, checklist: data?.[0] })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
