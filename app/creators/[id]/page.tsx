import { supabase } from '@/lib/supabase'
import { CreatorProfileClient } from './creator-profile'

export async function generateStaticParams() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url.includes('placeholder')) return []
    const { data } = await supabase.from('profiles').select('id').eq('role', 'creator')
    return (data || []).map((p: { id: string }) => ({ id: p.id }))
  } catch {
    return []
  }
}

export default async function CreatorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <CreatorProfileClient id={params.id} />
}
