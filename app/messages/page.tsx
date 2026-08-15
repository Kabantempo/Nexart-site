import type { Metadata } from 'next'
import MessagesClient from './messages-client'

export const metadata: Metadata = {
  title: 'Messages — Nexart',
  description: 'Gérez vos conversations avec les organisateurs et créateurs sur Nexart.',
  alternates: { canonical: 'https://nexart.fr/messages' },
  openGraph: {
    title: 'Messages — Nexart',
    description: 'Gérez vos conversations avec les organisateurs et créateurs sur Nexart.',
    url: 'https://nexart.fr/messages',
    type: 'website',
  },
}

export default function MessagesPage() {
  return <MessagesClient />
}
