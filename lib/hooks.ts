'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Event, CreatorProfile, OrganizerProfile, Application, Review } from './types'

export function useEvents() {
  const [events, setEvents] = useState<(Event & { remaining_spots?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Accès anticipé : Pro/Premium voient tout, Boost voit à -24h, Gratuit à -48h
        let earlyAccessCutoff: string | null = null
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: prof } = await supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).single()
          const tier = prof?.subscription_tier ?? 'free'
          if (tier === 'free') {
            earlyAccessCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
          } else if (tier === 'boost') {
            earlyAccessCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
          // pro/premium : pas de restriction
        } else {
          // non connecté = traité comme gratuit
          earlyAccessCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }

        let query = supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('start_date', { ascending: true })

        if (earlyAccessCutoff) {
          query = query.lte('created_at', earlyAccessCutoff)
        }

        const { data, error: err } = await query

        if (err) throw err

        if (data?.length) {
          const { data: apps } = await supabase
            .from('applications')
            .select('event_id')
            .in('event_id', data.map(e => e.id))
            .eq('status', 'accepted')

          const countMap: Record<string, number> = {}
          apps?.forEach(a => { countMap[a.event_id] = (countMap[a.event_id] || 0) + 1 })

          setEvents(data.map(e => ({
            ...e,
            remaining_spots: e.stand_count && e.stand_count > 0 ? Math.max(e.stand_count - (countMap[e.id] || 0), 0) : undefined,
          })) as unknown as (Event & { remaining_spots?: number })[])
        } else {
          setEvents((data || []) as unknown as (Event & { remaining_spots?: number })[])
        }
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

        const { data: creatorData, error: creatorErr } = await supabase
          .from('creator_profiles')
          .select('*')
          .in('user_id', creatorIds)

        if (creatorErr) throw creatorErr

        const enriched = (creatorData?.map((creator) => {
          const profile = profiles?.find((p) => p.id === creator.user_id)
          return {
            ...creator,
            id: profile?.id || creator.id,
            full_name: profile?.full_name || '',
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
            role: 'creator' as const,
            created_at: profile?.created_at || '',
            is_active: (creator as Record<string, unknown>).is_active_creator as boolean || false,
            disciplines: creator.disciplines ?? [],
            portfolio_images: creator.portfolio_images ?? [],
            profile_boosted_until: (profile as any)?.profile_boosted_until ?? null,
          }
        }) || []).sort((a, b) => {
          const now = Date.now()
          const aBoosted = a.profile_boosted_until && new Date(a.profile_boosted_until).getTime() > now ? 1 : 0
          const bBoosted = b.profile_boosted_until && new Date(b.profile_boosted_until).getTime() > now ? 1 : 0
          if (bBoosted !== aBoosted) return bBoosted - aBoosted
          // Vérifiés (SIRET + RC Pro) d'abord, puis actifs, puis le reste
          const scoreA = (a.siret_verified && a.insurance_verified ? 2 : 0) + (a.is_active ? 1 : 0)
          const scoreB = (b.siret_verified && b.insurance_verified ? 2 : 0) + (b.is_active ? 1 : 0)
          return scoreB - scoreA
        })

        setCreators(enriched as unknown as CreatorProfile[])
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
        setApplications((data || []) as unknown as Application[])
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
        setEvent(data as unknown as Event)
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
      .then(({ data }) => { if (data) setApplication(data as unknown as Application) })
  }, [eventId, userId])

  const apply = async (message: string, portfolioImages?: string[]) => {
    if (!userId) return
    setApplying(true)
    setError(null)
    try {
      // Vérifier la limite mensuelle de candidatures pour le tier free
      const { data: profile } = await supabase.from('profiles').select('subscription_tier, created_at').eq('id', userId).single()
      const tier = profile?.subscription_tier ?? 'free'

      if (tier === 'free') {
        const accountAge = profile?.created_at
          ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
          : 99
        // Premier mois: 2 candidatures, ensuite 1/mois
        const limit = accountAge < 1 ? 2 : 1
        const monthStart = new Date()
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
        const { count } = await supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', userId)
          .gte('created_at', monthStart.toISOString())
        if ((count ?? 0) >= limit) {
          setError(`Limite atteinte : le plan gratuit autorise ${limit} candidature${limit > 1 ? 's' : ''} par mois. Passez au plan Boost pour postuler davantage.`)
          setApplying(false)
          return
        }
      }

      const { error: err } = await supabase.from('applications').insert({
        event_id: eventId,
        creator_id: userId,
        message,
        status: 'pending',
        ...(portfolioImages?.length ? { portfolio_images: portfolioImages } : {}),
      })
      if (err) throw err

      // Auto-responder: match candidature contre FAQs (fire-and-forget)
      fetch(`/api/events/${eventId}/faqs/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exhibitor_id: userId, application_text: message }),
      }).catch(() => {})

      // Notif in-app pour l'organisateur
      const { data: ev } = await supabase.from('events').select('title, organizer_id').eq('id', eventId).single()
      const { data: creatorProf } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      if (ev?.organizer_id) {
        await supabase.from('notifications').insert({
          user_id: ev.organizer_id,
          type: 'application_received',
          title: 'Nouvelle candidature',
          body: `${creatorProf?.full_name || 'Un créateur'} a postulé pour "${ev.title}"`,
          link: `/dashboard`,
        })
        // Email à l'organisateur (fire-and-forget)
        fetch('/api/application-received', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizer_id: ev.organizer_id, creator_name: creatorProf?.full_name, event_title: ev.title, event_id: eventId }),
        }).catch(() => {})
      }

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
        setReviews((data || []) as unknown as Review[])
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
          availability: (creatorData?.availability as Record<string, unknown>) || {},
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
