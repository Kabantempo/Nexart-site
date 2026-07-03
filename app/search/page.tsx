import type { Metadata } from 'next'
import { Suspense } from 'react'
import SearchPageClient from './search-client'

export const metadata: Metadata = {
  title: 'Recherche — Événements & créateurs',
  description: 'Recherchez parmi des centaines d\'événements artisanaux et de créateurs référencés sur Nexart. Trouvez le marché ou l\'artisan qui vous correspond.',
  alternates: { canonical: 'https://nexart.fr/search' },
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  )
}
