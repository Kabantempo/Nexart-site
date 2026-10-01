import { Metadata } from 'next'
import Script from 'next/script'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { supabaseImg } from '@/lib/image-utils'
import { CreatorProfileClient } from './creator-profile'

export const dynamicParams = true

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveCreatorId(idOrUsername: string): Promise<string> {
  if (UUID_RE.test(idOrUsername)) return idOrUsername
  const decoded = decodeURIComponent(idOrUsername)
  // Essai par username
  const { data: byUsername } = await supabase.from('profiles').select('id').eq('username', decoded).eq('role', 'creator').maybeSingle()
  if (byUsername) return byUsername.id
  // Fallback par full_name (insensible à la casse)
  const { data: byName } = await supabase.from('profiles').select('id').ilike('full_name', decoded).eq('role', 'creator').maybeSingle()
  return byName?.id ?? idOrUsername
}

export async function generateStaticParams() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url || url.includes('placeholder')) return []
    const { data } = await supabase.from('profiles').select('id, username').eq('role', 'creator')
    return (data || []).flatMap((p: { id: string; username: string | null }) => [
      { id: p.id },
      ...(p.username ? [{ id: p.username }] : []),
    ])
  } catch {
    return []
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params
  try {
    const resolvedId = await resolveCreatorId(params.id)
    const { data: creator } = await supabase.from('profiles').select('*').eq('id', resolvedId).single()
    if (!creator) return { title: 'Créateur non trouvé' }

    const title = creator.full_name
    const description = creator.bio?.substring(0, 160) || 'Découvrez ce créateur sur Nexart'
    const { data: extra } = await supabase.from('creator_profiles').select('disciplines, city').eq('user_id', resolvedId).maybeSingle()
    const ogUrl = new URL('https://nexart.fr/api/og/creator')
    ogUrl.searchParams.set('name', creator.full_name || '')
    if (extra?.city) ogUrl.searchParams.set('city', extra.city)
    if (extra?.disciplines?.length) ogUrl.searchParams.set('disciplines', extra.disciplines.slice(0, 3).join(','))
    if (creator.avatar_url) ogUrl.searchParams.set('avatar', supabaseImg(creator.avatar_url, { width: 440 }))
    const ogImages = [{ url: ogUrl.toString(), width: 1200, height: 630, alt: `${title} — Créateur sur Nexart` }]

    return {
      title,
      description,
      alternates: { canonical: `https://nexart.fr/creators/${params.id}` },
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `https://nexart.fr/creators/${params.id}`,
        images: ogImages,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImages[0].url],
      },
    }
  } catch {
    return { title: 'Créateur' }
  }
}

export default async function CreatorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const resolvedId = await resolveCreatorId(params.id)

  let creator = null
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', resolvedId).single()
    creator = data
  } catch (error) {
    console.error('Error fetching creator:', error)
  }



  const creatorJsonLd = creator ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: creator.full_name,
    description: creator.bio,
    image: creator.avatar_url,
    url: `https://nexart.fr/creators/${creator.id}`,
    jobTitle: 'Créateur',
  } : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://nexart.fr' },
      { '@type': 'ListItem', position: 2, name: 'Créateurs', item: 'https://nexart.fr/creators' },
      ...(creator ? [{ '@type': 'ListItem', position: 3, name: creator.full_name, item: `https://nexart.fr/creators/${creator.id}` }] : []),
    ],
  }

  return (
    <>
      {creatorJsonLd && (
        <Script
          id="creator-schema"
          type="application/ld+json"
          // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
          dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorJsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />
      <CreatorProfileClient id={resolvedId} />
    </>
  )
}
