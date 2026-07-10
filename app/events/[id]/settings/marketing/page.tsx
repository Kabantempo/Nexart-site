import type { Metadata } from 'next'
import MarketingClient from './marketing-client'

export const metadata: Metadata = {
  title: 'Suite Marketing — Nexart',
  description: 'Planifiez et gérez votre stratégie marketing',
  robots: 'noindex',
}

export default function MarketingPage({ params }: { params: { id: string } }) {
  return <MarketingClient eventId={params.id} />
}
