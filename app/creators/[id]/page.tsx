import { Metadata } from 'next'
import Script from 'next/script'
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
        images: creator.avatar_url
          ? [{ url: creator.avatar_url, width: 500, height: 500 }]
          : [{ url: `https://nexart.fr/api/og?title=${encodeURIComponent(creator.full_name)}&subtitle=Créateur artisanal&type=creator`, width: 1200, height: 630 }],
      },
    }
  } catch {
    return { title: 'Créateur' }
  }
}

export default async function CreatorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  // Fetch creator data for JSON-LD
  let creator = null
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', params.id).single()
    creator = data
  } catch (error) {
    console.error('Error fetching creator:', error)
  }

  const jsonLd = creator ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.full_name,
    description: creator.bio,
    image: creator.avatar_url,
    url: `https://nexart.fr/creators/${creator.id}`,
    jobTitle: 'Artisan créateur',
  } : null

  return (
    <>
      {jsonLd && (
        <Script
          id="creator-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CreatorProfileClient id={params.id} />
    </>
  )
}
