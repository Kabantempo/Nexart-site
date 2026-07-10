import type { Metadata } from 'next'
import TeamCollaborationClient from './team-client'

export const metadata: Metadata = {
  title: 'Équipe — Nexart',
  description: 'Gérer votre équipe pour cet événement',
}

export default function TeamPage({ params }: { params: { id: string } }) {
  return <TeamCollaborationClient eventId={params.id} />
}
