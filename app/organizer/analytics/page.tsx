import type { Metadata } from 'next'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Statistiques et performances de vos événements organisateur',
  alternates: { canonical: 'https://nexart.fr/organizer/analytics' },
  openGraph: {
    title: 'Analytics',
    description: 'Statistiques et performances de vos événements organisateur',
    url: 'https://nexart.fr/organizer/analytics',
    type: 'website',
  },
}

export default function OrganizerAnalyticsPage() {
  return <AnalyticsClient />
}
