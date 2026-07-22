import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { REGIONS, slugToRegion } from '@/lib/regions'
import RegionPageClient from './region-client'

export async function generateStaticParams() {
  return Object.keys(REGIONS).map((slug) => ({ slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const region = slugToRegion(slug)
  if (!region) return { title: 'Région introuvable' }

  const title = `Marchés artisanaux en ${region.name}`
  const description = `Découvrez tous les marchés artisanaux, pop-ups et salons de créateurs en ${region.name}. Trouvez des événements près de chez vous sur Nexart.`

  return {
    title,
    description,
    keywords: [
      `marché artisanal ${region.name}`,
      `salon artisanat ${region.name}`,
      `créateurs ${region.name}`,
      `événement artisanal ${region.name}`,
      ...region.villes.map((v) => `marché artisanal ${v}`),
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://nexart.fr/events/region/${slug}`,
      locale: 'fr_FR',
      siteName: 'Nexart',
    },
    alternates: { canonical: `https://nexart.fr/events/region/${slug}` },
    other: {
      'geo.region': region.code,
      'geo.placename': region.name,
      'geo.position': `${region.lat};${region.lng}`,
      'ICBM': `${region.lat}, ${region.lng}`,
    },
  }
}

export default async function RegionPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const region = slugToRegion(slug)
  if (!region) notFound()

  let events: any[] = []
  try {
    const { data } = await supabase
      .from('events')
      .select('id, title, city, region, start_date, end_date, cover_image, discipline_tags, lat, lng')
      .eq('status', 'published')
      .ilike('region', `%${region.name}%`)
      .order('start_date', { ascending: true })
      .limit(50)
    events = data || []
  } catch { /* ignore */ }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Marchés artisanaux en ${region.name}`,
    description: `Liste des marchés artisanaux et événements créateurs en ${region.name}, France`,
    url: `https://nexart.fr/events/region/${slug}`,
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: e.title,
        startDate: e.start_date,
        endDate: e.end_date,
        url: `https://nexart.fr/events/${e.id}`,
        location: {
          '@type': 'Place',
          name: e.city || region.name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: e.city,
            addressRegion: region.name,
            addressCountry: 'FR',
          },
          ...(e.lat && e.lng ? { geo: { '@type': 'GeoCoordinates', latitude: e.lat, longitude: e.lng } } : {}),
        },
        image: e.cover_image,
      },
    })),
  }

  return (
    <>
      <Script id="region-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RegionPageClient slug={slug} region={region} initialEvents={events} />
    </>
  )
}
