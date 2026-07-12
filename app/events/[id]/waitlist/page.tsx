import type { Metadata } from 'next'
import WaitlistClient from './waitlist-client'

export const metadata: Metadata = {
  title: 'Liste d\'attente — Nexart',
  description: 'Gérez la liste d\'attente de votre événement',
  robots: 'noindex',
}

export default function WaitlistPage({ params }: { params: { id: string } }) {
  return <WaitlistClient eventId={params.id} />
}
