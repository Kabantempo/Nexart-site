import type { Metadata } from 'next'
import DashboardClient from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard organisateur — Nexart',
  description: 'Gérez votre événement : candidatures, exposants, équipe, analytics.',
}

export default function EventDashboardPage({ params }: { params: { id: string } }) {
  return <DashboardClient eventId={params.id} />
}
