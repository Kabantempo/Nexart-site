import type { Metadata } from 'next'
import SettingsClient from './settings-client'

export const metadata: Metadata = {
  title: 'Paramètres — Nexart',
  description: 'Gestion compte, données personnelles et préférences.',
  alternates: { canonical: 'https://nexart.fr/settings' },
}

export default function SettingsPage() {
  return <SettingsClient />
}
