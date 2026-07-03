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
        const [{ data: creatorProfiles }, { data: artisanProfiles }] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'creator'),
          supabase.from('profiles').select('*').eq('role', 'artisan'),
        ])
        const profiles = [...(creatorProfiles ?? []), ...(artisanProfiles ?? [])]
        const err = null

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

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchEvent = async () => {
      try {
        const { data, error: err } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single()
        if (err) throw err
        setEvent(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  return { event, loading, error }
}

export function useApplication(eventId: string, userId?: string) {
  const [application, setApplication] = useState<Application | null>(null)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [acceptedCount, setAcceptedCount] = useState<number | null>(null)

  useEffect(() => {
    if (!eventId) return
    // Count accepted applications for occupancy display
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'accepted')
      .then(({ count }) => { if (count !== null) setAcceptedCount(count) })
  }, [eventId])

  useEffect(() => {
    if (!userId || !eventId) return
    supabase
      .from('applications')
      .select('*')
      .eq('event_id', eventId)
      .eq('creator_id', userId)
      .maybeSingle()
      .then(({ data }) => { if (data) setApplication(data) })
  }, [eventId, userId])

  const apply = async (message: string) => {
    if (!userId) return
    setApplying(true)
    setError(null)
    try {
      const { error: err } = await supabase.from('applications').insert({
        event_id: eventId,
        creator_id: userId,
        message,
        status: 'pending',
      })
      if (err) throw err
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la candidature')
    } finally {
      setApplying(false)
    }
  }

  return { application, applying, error, success, apply, acceptedCount }
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

export function useFavorites(userId?: string) {
  const [favEventIds, setFavEventIds] = useState<Set<string>>(new Set())
  const [favCreatorIds, setFavCreatorIds] = useState<Set<string>>(new Set())
  const [favEvents, setFavEvents] = useState<Event[]>([])
  const [favCreators, setFavCreators] = useState<CreatorProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const fetchFavorites = async () => {
      const [{ data: evFavs }, { data: crFavs }] = await Promise.all([
        supabase.from('favorite_events').select('event_id, events(*)').eq('user_id', userId),
        supabase.from('favorite_creators').select('creator_id, profiles(*)').eq('user_id', userId),
      ])

      const eventIds = new Set<string>((evFavs || []).map((r: { event_id: string }) => r.event_id))
      const creatorIds = new Set<string>((crFavs || []).map((r: { creator_id: string }) => r.creator_id))
      setFavEventIds(eventIds)
      setFavCreatorIds(creatorIds)

      const events = (evFavs || [])
        .map((r: { events: unknown }) => r.events)
        .filter(Boolean) as Event[]
      setFavEvents(events)

      const creators = (crFavs || [])
        .map((r: { creator_id: string; profiles: unknown }) => {
          const p = r.profiles as { id: string; full_name: string; avatar_url?: string; bio?: string; created_at: string } | null
          if (!p) return null
          return { ...p, id: r.creator_id, role: 'creator' as const, disciplines: [], city: '', region: '', department: '', travel_radius: '25' as const, portfolio_images: [], siret_verified: false, insurance_verified: false, availability: {} }
        })
        .filter(Boolean) as CreatorProfile[]
      setFavCreators(creators)

      setLoading(false)
    }

    fetchFavorites()
  }, [userId])

  const toggleEventFav = async (eventId: string) => {
    if (!userId) return
    if (favEventIds.has(eventId)) {
      await supabase.from('favorite_events').delete().eq('user_id', userId).eq('event_id', eventId)
      setFavEventIds((prev) => { const n = new Set(prev); n.delete(eventId); return n })
      setFavEvents((prev) => prev.filter((e) => e.id !== eventId))
    } else {
      await supabase.from('favorite_events').insert({ user_id: userId, event_id: eventId })
      setFavEventIds((prev) => new Set([...prev, eventId]))
    }
  }

  const toggleCreatorFav = async (creatorId: string) => {
    if (!userId) return
    if (favCreatorIds.has(creatorId)) {
      await supabase.from('favorite_creators').delete().eq('user_id', userId).eq('creator_id', creatorId)
      setFavCreatorIds((prev) => { const n = new Set(prev); n.delete(creatorId); return n })
      setFavCreators((prev) => prev.filter((c) => c.id !== creatorId))
    } else {
      await supabase.from('favorite_creators').insert({ user_id: userId, creator_id: creatorId })
      setFavCreatorIds((prev) => new Set([...prev, creatorId]))
    }
  }

  return { favEventIds, favCreatorIds, favEvents, favCreators, loading, toggleEventFav, toggleCreatorFav }
}

export function useCreator(id: string) {
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchCreator = async () => {
      try {
        const { data: profile, error: err1 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()
        if (err1) throw err1

        const { data: creatorData } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle()

        setCreator({
          id: profile.id,
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          role: 'creator' as const,
          created_at: profile.created_at,
          disciplines: creatorData?.disciplines || [],
          city: creatorData?.city || '',
          region: creatorData?.region || '',
          department: creatorData?.department || '',
          travel_radius: creatorData?.travel_radius || '5',
          portfolio_images: creatorData?.portfolio_images || [],
          website: creatorData?.website,
          instagram: creatorData?.instagram,
          etsy: creatorData?.etsy,
          siret_verified: creatorData?.siret_verified || false,
          insurance_verified: creatorData?.insurance_verified || false,
          availability: creatorData?.availability || {},
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    fetchCreator()
  }, [id])

  return { creator, loading, error }
}
