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

export default async function EventPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <EventDetailClient id={params.id} />
}
