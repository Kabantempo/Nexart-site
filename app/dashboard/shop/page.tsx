import type { Metadata } from 'next'
import ShopDashboardClient from './shop-dashboard-client'

export const metadata: Metadata = {
  title: 'Ma boutique — Nexart',
  description: 'Gérez vos créations et produits sur Nexart.',
}

export default function ShopDashboardPage() {
  return <ShopDashboardClient />
}
