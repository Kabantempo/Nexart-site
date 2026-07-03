import type { Metadata } from 'next'
import EventsClient from './events-client'

export const metadata: Metadata = {
  title: 'Événements artisanaux — Marchés, pop-ups, salons',
  description: 'Explorez tous les marchés artisanaux, pop-ups, salons et festivals en France. Filtrez par ville, date et type d\'événement. Candidatez en 2 clics.',
  alternates: { canonical: 'https://nexart.fr/events' },
  openGraph: {
    title: 'Événements artisanaux — Marchés, pop-ups, salons',
    description: 'Explorez tous les marchés artisanaux, pop-ups, salons et festivals en France.',
    url: 'https://nexart.fr/events',
    type: 'website',
  },
}

export default function EventsPage() {
  return <EventsClient />
}
