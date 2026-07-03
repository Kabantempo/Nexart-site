import type { Metadata } from 'next'
import Script from 'next/script'
import HomeClient from './home-client'

export const metadata: Metadata = {
  title: 'Nexart — Marketplace créateurs & marchés artisanaux',
  description: 'Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France. Candidatez à des marchés, pop-ups, salons et festivals en quelques clics. Gratuit pour les créateurs.',
  alternates: { canonical: 'https://nexart.fr' },
  openGraph: {
    title: 'Nexart — Marketplace créateurs & marchés artisanaux',
    description: 'Nexart connecte créateurs, artisans et organisateurs de marchés artisanaux en France. Gratuit pour les créateurs.',
    url: 'https://nexart.fr',
    type: 'website',
    images: [{ url: '/logo-full.png', width: 502, height: 594, alt: 'Nexart' }],
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Nexart',
  url: 'https://nexart.fr',
  logo: 'https://nexart.fr/logo-full.png',
  description: 'Marketplace connectant créateurs artisanaux et organisateurs de marchés en France.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contact@nexart.fr',
    contactType: 'customer support',
    availableLanguage: 'French',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Nexart',
  url: 'https://nexart.fr',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://nexart.fr/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
}

export default function Home() {
  return (
    <>
      <Script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <Script id="website-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <HomeClient />
    </>
  )
}
