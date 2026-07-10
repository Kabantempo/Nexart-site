import type { Metadata } from 'next'
import CampaignsClient from './campaigns-client'

export const metadata: Metadata = {
  title: 'Campagnes Email — Nexart',
  description: 'Gérer vos campagnes email pour les créateurs',
}

export default function CampaignsPage({ params }: { params: { id: string } }) {
  return <CampaignsClient eventId={params.id} />
}
