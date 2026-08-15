import type { Metadata } from 'next'
import CarnetClient from './carnet-client'

export const metadata: Metadata = {
  title: { absolute: 'Carnet de route — Nexart' },
  description: 'Gérez votre itinéraire de créateur : planifiez vos déplacements et vos participations aux marchés artisanaux.',
  robots: { index: false, follow: false },
}

export default function CarnetDeRoutePage() { return <CarnetClient /> }
