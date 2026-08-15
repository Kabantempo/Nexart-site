import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — Nexart',
  description: 'Définissez un nouveau mot de passe pour votre compte Nexart.',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
