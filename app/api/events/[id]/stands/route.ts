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

interface StandTypeData {
  count: string
  dimensions: string
  price_min: string
  price_max: string
}

// GET /api/events/[id]/stands — retourne les types de stands définis par l'organisateur
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id))
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  const { data: ev } = await admin
    .from('events')
    .select('stand_types_data, stand_price, stand_dimensions')
    .eq('id', params.id)
    .single()

  if (!ev) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

  // Utiliser stand_types_data (JSONB complet) comme source principale
  if (Array.isArray(ev.stand_types_data) && ev.stand_types_data.length > 0) {
    // Convertir chaque type de stand en "slots" individuels disponibles
    const stands = (ev.stand_types_data as unknown as StandTypeData[]).flatMap((t, typeIdx) => {
      const count = Number(t.count) || 0
      const price = Number(t.price_min) || 0
      const dim = t.dimensions?.trim() || ''
      return Array.from({ length: count }, (_, i) => ({
        id: `type_${typeIdx}_${i}`,
        label: dim ? `${dim} #${i + 1}` : `Stand #${typeIdx + 1}-${i + 1}`,
        status: 'available',
        price,
        price_max: Number(t.price_max) || 0,
        dimensions: dim,
        type_index: typeIdx,
        slot_index: i,
      }))
    })
    return NextResponse.json({ stands, default_price: ev.stand_price ?? 0, source: 'types' })
  }

  // Fallback legacy: stand_dimensions string
  if (ev.stand_dimensions) {
    const stands = String(ev.stand_dimensions).split(',').map((s: string, i: number) => {
      const trimmed = s.trim()
      const spaceIdx = trimmed.indexOf(' x ')
      const count = spaceIdx >= 0 ? trimmed.slice(0, spaceIdx).trim() : '1'
      const dim = spaceIdx >= 0 ? trimmed.slice(spaceIdx + 3).trim() : trimmed
      return Array.from({ length: Number(count) || 1 }, (_, j) => ({
        id: `legacy_${i}_${j}`,
        label: dim ? `${dim} #${j + 1}` : `Stand #${i + 1}-${j + 1}`,
        status: 'available',
        price: ev.stand_price ?? 0,
        dimensions: dim,
      }))
    }).flat()
    return NextResponse.json({ stands, default_price: ev.stand_price ?? 0, source: 'legacy' })
  }

  return NextResponse.json({ stands: [], default_price: ev.stand_price ?? 0 })
}
