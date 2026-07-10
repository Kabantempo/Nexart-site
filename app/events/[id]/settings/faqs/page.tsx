import type { Metadata } from 'next'
import FAQsClient from './faqs-client'

export const metadata: Metadata = {
  title: 'FAQ & Auto-répondeur — Nexart',
  description: 'Gérez les réponses automatiques et la base de FAQ',
  robots: 'noindex',
}

export default function FAQsPage({ params }: { params: { id: string } }) {
  return <FAQsClient eventId={params.id} />
}
