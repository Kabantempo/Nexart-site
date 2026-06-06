import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { EventDetailClient } from './event-detail'

export async function generateStaticParams() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url.includes('placeholder')) return []
    const { data } = await supabase.from('events').select('id').eq('status', 'published')
    return (data || []).map((e: { id: string }) => ({ id: e.id }))
  } catch {
    return []
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  try {
    const { data: event } = await supabase.from('events').select('*').eq('id', params.id).single()
    if (!event) return { title: 'Événement non trouvé' }

    return {
      title: `${event.title} — Nexart`,
      description: event.description?.substring(0, 160) || 'Découvrez cet événement sur Nexart',
      openGraph: {
        title: event.title,
        description: event.description?.substring(0, 160),
        type: 'website',
        url: `https://nexart.fr/events/${params.id}`,
        images: event.cover_image ? [{ url: event.cover_image, width: 1200, height: 630 }] : [],
      },
    }
  } catch {
    return { title: 'Événement' }
  }
}

export default async function EventPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <EventDetailClient id={params.id} />
}
