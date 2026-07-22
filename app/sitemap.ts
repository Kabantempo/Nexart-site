import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { REGIONS } from '@/lib/regions'

const BASE_URL = 'https://nexart.fr'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const regionRoutes: MetadataRoute.Sitemap = Object.keys(REGIONS).map((slug) => ({
    url: `${BASE_URL}/events/region/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/events`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/creators`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/carte`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/calendrier`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/tendances`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/about`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/offres`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${BASE_URL}/conditions`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/confidentialite`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/patch-notes`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.4 },
    { url: `${BASE_URL}/legal/privacy`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/legal/terms`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  let eventRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: events } = await supabase
      .from('events')
      .select('id, created_at')
      .eq('status', 'published')
    eventRoutes = ((events || []) as any[]).map((e: { id: string; created_at: string }) => ({
      url: `${BASE_URL}/events/${e.id}`,
      lastModified: new Date(e.created_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch { /* ignore */ }

  let creatorRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: creators } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'creator')
    creatorRoutes = ((creators || []) as any[]).map((c: { id: string; created_at: string }) => ({
      url: `${BASE_URL}/creators/${c.id}`,
      lastModified: new Date(c.created_at || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch { /* ignore */ }

  return [...staticRoutes, ...regionRoutes, ...eventRoutes, ...creatorRoutes]
}
