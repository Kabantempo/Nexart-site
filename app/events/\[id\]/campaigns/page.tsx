import type { Metadata } from 'next'
import EmailCampaignsClient from './campaigns-client'

export const metadata: Metadata = {
  title: 'Campagnes Email — Nexart',
  description: 'Gérer vos campagnes email aux créateurs',
}

export default function EmailCampaignsPage({ params }: { params: { id: string } }) {
  return <EmailCampaignsClient eventId={params.id} />
}
