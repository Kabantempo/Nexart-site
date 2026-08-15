import type { Metadata } from 'next'
import RegisterClient from './register-client'

export const metadata: Metadata = {
  title: 'Inscription bénévole — Nexart',
  description: 'Inscrivez-vous comme bénévole pour cet événement.',
  robots: 'noindex',
}

export default function VolunteerRegisterPage({ params }: { params: { id: string } }) {
  return <RegisterClient eventId={params.id} />
}
