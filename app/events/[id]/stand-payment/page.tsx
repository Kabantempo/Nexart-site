import type { Metadata } from 'next'
import StandPaymentClient from './stand-payment-client'

export const metadata: Metadata = {
  title: 'Régler mon stand — Nexart',
}

export default function StandPaymentPage({ params }: { params: { id: string } }) {
  return <StandPaymentClient eventId={params.id} />
}
