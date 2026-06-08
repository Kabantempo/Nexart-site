'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ImageTestimonialGrid } from './image-testimonial-grid'

interface GridItem {
  name: string
  title: string
  image: string
  avatar: string
  size?: 'small' | 'medium' | 'large'
  id: string
}

const sizes: Array<'large' | 'medium' | 'small'> = ['large', 'medium', 'small', 'small', 'medium', 'large']

export function DynamicCreatorsSection() {
  const [creators, setCreators] = useState<GridItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data } = await supabase
          .from('creator_profiles')
          .select('user_id, profiles(id, full_name, bio, avatar_url)')
          .eq('siret_verified', true)
          .limit(6)

        const items: GridItem[] = (data || []).map((row: any, idx: number) => {
          const p = row.profiles
          return {
            id: p?.id ?? row.user_id,
            name: p?.full_name || 'Créateur',
            title: p?.bio?.substring(0, 40) || 'Artisan vérifié',
            image: p?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&fit=crop',
            avatar: p?.avatar_url || `https://i.pravatar.cc/150?img=${idx}`,
            size: sizes[idx] ?? 'small',
          }
        })

        setCreators(items)
      } catch (err) {
        console.error('Error fetching creators:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
    const interval = setInterval(fetchCreators, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || creators.length === 0) return null

  return (
    <section style={{ padding: '80px 16px', backgroundColor: '#F9F9FB', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>
            Découvrez nos meilleurs créateurs
          </h2>
          <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', margin: '0 auto' }}>
            Les talents les plus en vue de la plateforme Nexart
          </p>
        </motion.div>

        <ImageTestimonialGrid items={creators} columns={3} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginTop: '64px' }}
        >
          <Link
            href="/creators"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '16px 32px', borderRadius: '8px', border: '2px solid #6366F1',
              backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none',
              fontSize: '16px', fontWeight: '600', transition: 'all 300ms ease', cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366F1'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#6366F1'
            }}
          >
            Découvrir tous les créateurs
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export function DynamicEventsSection() {
  const [events, setEvents] = useState<GridItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await supabase
          .from('events')
          .select('id, title, description, cover_image')
          .eq('status', 'published')
          .limit(6)

        const items: GridItem[] = (data || []).map((e: any, idx: number) => ({
          id: e.id,
          name: e.title || 'Événement',
          title: e.description?.substring(0, 40) || 'Marché artisanal',
          image: e.cover_image || 'https://images.unsplash.com/photo-1469749292166-56156c16147f?w=500&fit=crop',
          avatar: `https://i.pravatar.cc/150?img=${10 + idx}`,
          size: sizes[idx] ?? 'small',
        }))

        setEvents(items)
      } catch (err) {
        console.error('Error fetching events:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading || events.length === 0) return null

  return (
    <section style={{ padding: '80px 16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>
            Marchés & Événements à ne pas rater
          </h2>
          <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', margin: '0 auto' }}>
            Les meilleurs rendez-vous artisanaux en France
          </p>
        </motion.div>

        <ImageTestimonialGrid items={events} columns={3} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginTop: '64px' }}
        >
          <Link
            href="/events"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '16px 32px', borderRadius: '8px', border: '2px solid #6366F1',
              backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none',
              fontSize: '16px', fontWeight: '600', transition: 'all 300ms ease', cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366F1'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#6366F1'
            }}
          >
            Découvrir tous les événements
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
