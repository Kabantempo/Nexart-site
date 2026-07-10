import type { Metadata } from 'next'
import CreatorAnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Mes Statistiques — Nexart',
  description: 'Votre tableau de bord de statistiques créateur',
}

export default function CreatorAnalyticsPage() {
  return <CreatorAnalyticsClient />
}
