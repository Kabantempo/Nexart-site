import type { Metadata } from 'next'
import VolunteersClient from './volunteers-client'

export const metadata: Metadata = {
  title: 'Bénévoles — Nexart',
  description: 'Gérez les shifts et assignations des bénévoles pour votre événement',
  robots: 'noindex',
}

export default function VolunteersPage({ params }: { params: { id: string } }) {
  return <VolunteersClient eventId={params.id} />
}
