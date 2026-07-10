import type { Metadata } from 'next'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytique — Nexart',
  description: 'Statistiques et métriques de votre événement',
}

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  return <AnalyticsClient eventId={params.id} />
}
