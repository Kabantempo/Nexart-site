import type { Metadata } from 'next'
import VolunteersClient from './volunteers-client'

export const metadata: Metadata = {
  title: 'Bénévoles — Nexart',
  description: 'Gérez les bénévoles de votre événement',
}

export default async function VolunteersPage({ params }: { params: { id: string } }) {
  return <VolunteersClient eventId={params.id} />
}
