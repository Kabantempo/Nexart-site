import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginClient from './login-client'

export const metadata: Metadata = {
  title: { absolute: 'Connexion — Nexart' },
  description: 'Connectez-vous à votre compte Nexart pour accéder à votre dashboard créateur ou organisateur.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/login' },
  openGraph: { title: 'Connexion — Nexart', description: 'Accédez à votre espace Nexart.', url: 'https://nexart.fr/login', type: 'website', images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Connexion' }] },
}

export default function LoginPage() { return <Suspense><LoginClient /></Suspense> }
