import type { Metadata } from 'next'
import BlogClient from './blog-client'

export const metadata: Metadata = {
  title: 'Blog — Nexart',
  description: 'Conseils, guides et actualités pour créateurs artisanaux et organisateurs de marchés en France.',
  alternates: { canonical: 'https://nexart.fr/blog' },
  openGraph: {
    title: 'Blog Nexart',
    description: 'Conseils et guides pour créateurs et organisateurs de marchés artisanaux.',
    url: 'https://nexart.fr/blog',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630 }],
  },
}

export default function BlogPage() {
  return <BlogClient />
}
