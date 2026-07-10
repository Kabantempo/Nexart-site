import type { Metadata } from 'next'
import ExhibitorsClient from './exhibitors-client'

export const metadata: Metadata = {
  title: 'Gestion Exposants — Nexart',
  description: 'Gérez vos candidatures d\'exposants et organisez votre événement',
  robots: 'noindex',
}

export default function ExhibitorsPage({ params }: { params: { id: string } }) {
  return <ExhibitorsClient eventId={params.id} />
}
