'use client'

import { useEffect, useState } from 'react'
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

export function DynamicCreatorsGrid() {
  const [creators, setCreators] = useState<GridItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, bio, avatar_url')
          .eq('role', 'creator')
          .limit(6)

        const formattedCreators = (profiles || []).map((p: any, idx: number) => ({
          id: p.id,
          name: p.full_name || 'Créateur',
          title: p.bio?.substring(0, 40) || 'Artisan',
          image: p.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&fit=crop',
          avatar: p.avatar_url || 'https://i.pravatar.cc/150?img=0',
          size: idx === 0 ? 'large' : idx === 1 ? 'medium' : idx === 4 ? 'medium' : 'small',
        }))

        setCreators(formattedCreators)
      } catch (err) {
        console.error('Error fetching creators:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
    const interval = setInterval(fetchCreators, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: '#888888' }}>Chargement des créateurs...</p>
      </div>
    )
  }

  if (creators.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: '#AAAAAA', fontSize: '16px' }}>
          Les créateurs apparaîtront ici bientôt. Soyez les premiers à rejoindre !
        </p>
      </div>
    )
  }

  return <ImageTestimonialGrid items={creators} columns={3} />
}

export function DynamicEventsGrid() {
  const [events, setEvents] = useState<GridItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: eventData } = await supabase
          .from('events')
          .select('id, title, description, cover_image')
          .eq('status', 'published')
          .limit(6)

        const formattedEvents = (eventData || []).map((e: any, idx: number) => ({
          id: e.id,
          name: e.title || 'Événement',
          title: e.description?.substring(0, 40) || 'Marché artisanal',
          image: e.cover_image || 'https://images.unsplash.com/photo-1469749292166-56156c16147f?w=500&fit=crop',
          avatar: 'https://i.pravatar.cc/150?img=' + (idx % 16),
          size: idx === 0 ? 'large' : idx === 1 ? 'medium' : idx === 4 ? 'medium' : 'small',
        }))

        setEvents(formattedEvents)
      } catch (err) {
        console.error('Error fetching events:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: '#888888' }}>Chargement des marchés...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <p style={{ color: '#AAAAAA', fontSize: '16px' }}>
          Les marchés et événements apparaîtront ici bientôt. Revenez nous voir !
        </p>
      </div>
    )
  }

  return <ImageTestimonialGrid items={events} columns={3} />
}
