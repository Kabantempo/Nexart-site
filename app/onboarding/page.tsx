import type { Metadata } from 'next'
import OnboardingClient from './onboarding-client'

export const metadata: Metadata = {
  title: 'Bienvenue sur Nexart',
  description: 'Configurez votre profil Nexart en quelques étapes et rejoignez la communauté des créateurs artisanaux.',
  alternates: { canonical: 'https://nexart.fr/onboarding' },
  openGraph: {
    title: 'Bienvenue sur Nexart',
    description: 'Configurez votre profil Nexart en quelques étapes et rejoignez la communauté des créateurs artisanaux.',
    url: 'https://nexart.fr/onboarding',
    type: 'website',
  },
}

export default function OnboardingPage() {
  return <OnboardingClient />
}
