'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Event, CreatorProfile, OrganizerProfile, Application, Review } from './types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('start_date', { ascending: true })

        if (err) throw err
        setEvents(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return { events, loading, error }
}

export function useCreators() {
  const [creators, setCreators] = useState<CreatorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data: profiles, error: err } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'creator')

        if (err) throw err

        const creatorIds = profiles?.map((p) => p.id) || []

        if (creatorIds.length === 0) {
          setCreators([])
          return
        }

        const { data: creators, error: creatorErr } = await supabase
          .from('creator_profiles')
          .select('*')
          .in('user_id', creatorIds)

        if (creatorErr) throw creatorErr

        const enriched = creators?.map((creator) => {
          const profile = profiles?.find((p) => p.id === creator.user_id)
          return {
            ...creator,
            id: profile?.id || creator.id,
            full_name: profile?.full_name || '',
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
            role: 'creator' as const,
            created_at: profile?.created_at || '',
          }
        }) || []

        setCreators(enriched)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchCreators()
  }, [])

  return { creators, loading, error }
}

export function useApplications(userId?: string) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchApplications = async () => {
      try {
        const { data, error: err } = await supabase
          .from('applications')
          .select('*')
          .eq('creator_id', userId)

        if (err) throw err
        setApplications(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [userId])

  return { applications, loading, error }
}

export function useReviews(userId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error: err } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewed_id', userId)

        if (err) throw err
        setReviews(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [userId])

  return { reviews, loading, error }
}
