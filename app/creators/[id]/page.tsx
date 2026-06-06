import { Metadata } from 'next'
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

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  try {
    const { data: creator } = await supabase.from('profiles').select('*').eq('id', params.id).single()
    if (!creator) return { title: 'Créateur non trouvé' }

    return {
      title: `${creator.full_name} — Nexart`,
      description: creator.bio?.substring(0, 160) || 'Découvrez ce créateur sur Nexart',
      openGraph: {
        title: creator.full_name,
        description: creator.bio?.substring(0, 160),
        type: 'profile',
        url: `https://nexart.fr/creators/${params.id}`,
        images: creator.avatar_url ? [{ url: creator.avatar_url, width: 500, height: 500 }] : [],
      },
    }
  } catch {
    return { title: 'Créateur' }
  }
}

export default async function CreatorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <CreatorProfileClient id={params.id} />
}
