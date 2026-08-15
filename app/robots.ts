import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/onboarding/',
          '/messages/',
          '/notifications/',
          '/favorites/',
          '/analytics/',
          '/settings/',
          '/profile/',
        ],
      },
    ],
    sitemap: 'https://nexart.fr/sitemap.xml',
  }
}
