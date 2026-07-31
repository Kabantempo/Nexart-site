import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchPageClient from './search-client'

export const metadata: Metadata = {
  title: 'Recherche — Événements & créateurs',
  description: 'Recherchez parmi des centaines d\'événements artisanaux et de créateurs référencés sur Nexart. Trouvez le marché ou l\'artisan qui vous correspond.',
  alternates: { canonical: 'https://nexart.fr/search' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Recherche — Nexart',
    description: 'Recherchez parmi des centaines d\'événements artisanaux et de créateurs sur Nexart.',
    url: 'https://nexart.fr/search',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Recherche' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recherche — Nexart',
    description: 'Recherchez parmi des centaines d\'événements artisanaux et de créateurs sur Nexart.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  )
}
