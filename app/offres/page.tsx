import type { Metadata } from 'next'
import Script from 'next/script'
import OffresPageClient from './offres-client'

export const metadata: Metadata = {
  title: 'Tarifs & offres',
  description: 'Découvrez les offres Nexart pour créateurs et organisateurs. Gratuit pour toujours pour les créateurs, plans premium pour les organisateurs professionnels.',
  alternates: { canonical: 'https://nexart.fr/offres' },
  openGraph: {
    title: 'Tarifs & offres',
    description: 'Découvrez les offres Nexart pour créateurs et organisateurs.',
    url: 'https://nexart.fr/offres',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Tarifs & offres' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs & offres — Nexart',
    description: 'Découvrez les offres Nexart pour créateurs et organisateurs.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Puis-je annuler à tout moment ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, depuis votre tableau de bord → Facturation → Gérer mon abonnement. Aucun frais de résiliation.',
      },
    },
    {
      '@type': 'Question',
      name: 'Les crédits expirent-ils ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui, les crédits pay-as-you-go ont une validité de 6 mois à partir de la date d'achat.",
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je changer de plan à tout moment ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, upgrade ou downgrade depuis votre tableau de bord. La différence est calculée au prorata.',
      },
    },
    {
      '@type': 'Question',
      name: 'Les paiements sont-ils sécurisés ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, les paiements sont traités par Stripe, certifié PCI DSS niveau 1. Nexart ne stocke aucune donnée carte.',
      },
    },
  ],
}

export default function OffresPage() {
  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <OffresPageClient />
    </>
  )
}
