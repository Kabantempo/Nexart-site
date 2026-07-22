import type { Metadata } from 'next'
import ContactPageClient from './contact-client'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe Nexart pour toute question sur la plateforme, un partenariat ou de l\'aide. Nous vous répondons rapidement.',
  alternates: { canonical: 'https://nexart.fr/contact' },
  openGraph: {
    title: 'Contact',
    description: 'Contactez l\'équipe Nexart pour toute question.',
    url: 'https://nexart.fr/contact',
    type: 'website',
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
