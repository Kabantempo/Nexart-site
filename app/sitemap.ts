import { MetadataRoute } from 'next'
import { ARTICLES } from '@/lib/blog-data'
import { supabase } from '@/lib/supabase'

const BASE_URL = 'https://nexart.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes statiques
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/download`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Articles blog (statiques)
  const blogRoutes: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'never' as const,
    priority: 0.7,
  }))

  // Événements (dynamiques)
  let eventRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, updated_at')
      .eq('status', 'published')

    eventRoutes = (events || []).map((event: any) => ({
      url: `${BASE_URL}/events/${event.id}`,
      lastModified: new Date(event.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error fetching events for sitemap:', error)
  }

  // Créateurs (dynamiques)
  let creatorRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'creator')

    creatorRoutes = (creators || []).map((creator: any) => ({
      url: `${BASE_URL}/creators/${creator.id}`,
      lastModified: new Date(creator.updated_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching creators for sitemap:', error)
  }

  return [...staticRoutes, ...blogRoutes, ...eventRoutes, ...creatorRoutes]
}
