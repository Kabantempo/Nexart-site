import type { Metadata } from 'next'
import ResetPasswordClient from './reset-password-client'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe — Nexart',
  description: 'Réinitialisez votre mot de passe Nexart en toute sécurité.',
  alternates: { canonical: 'https://nexart.fr/reset-password' },
  openGraph: {
    title: 'Réinitialiser le mot de passe — Nexart',
    description: 'Réinitialisez votre mot de passe Nexart en toute sécurité.',
    url: 'https://nexart.fr/reset-password',
    type: 'website',
  },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
