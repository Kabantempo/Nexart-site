import type { Metadata } from 'next'
import ContactPageClient from './contact-client'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe Nexart pour toute question sur la plateforme, un partenariat ou de l\'aide. Nous vous répondons rapidement.',
  alternates: { canonical: 'https://nexart.fr/contact' },
  openGraph: {
    title: 'Contact — Nexart',
    description: 'Contactez l\'équipe Nexart pour toute question.',
    url: 'https://nexart.fr/contact',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Contact' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact — Nexart',
    description: 'Contactez l\'équipe Nexart pour toute question.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
