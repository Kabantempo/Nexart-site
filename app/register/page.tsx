import type { Metadata } from 'next'
import RegisterClient from './register-client'

export const metadata: Metadata = {
  title: { absolute: 'Inscription — Nexart' },
  description: 'Créez votre compte Nexart gratuitement. Rejoignez la plateforme des créateurs et organisateurs de marchés artisanaux.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/register' },
  openGraph: { title: 'Inscription — Nexart', description: 'Rejoignez Nexart gratuitement.', url: 'https://nexart.fr/register', type: 'website', images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Inscription gratuite' }] },
}

export default function RegisterPage() { return <RegisterClient /> }
