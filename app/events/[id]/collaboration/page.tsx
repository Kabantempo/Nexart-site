import type { Metadata } from 'next'
import CollaborationClient from './collaboration-client'

export const metadata: Metadata = {
  title: 'Espace Collaboration — Nexart',
  description: 'Gérez les tâches et la communication de votre équipe',
  robots: 'noindex',
}

export default function CollaborationPage({ params }: { params: { id: string } }) {
  return <CollaborationClient eventId={params.id} />
}
