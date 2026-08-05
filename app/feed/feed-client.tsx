'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart, MapPin, Rss, CalendarDays, Palette, UserPlus } from 'lucide-react'
import { ReportButton } from '@/components/ui/report-button'
import { GhostCard } from '@/components/ui/ghost-card'

// ── Types ────────────────────────────────────────────────────────────────────

type FeedPost = {
  kind: 'post'
  id: string
  creator_id: string
  content: string
  image_url: string | null
  created_at: string
  profiles?: { full_name: string | null; avatar_url: string | null }
  likes_count: number
  liked: boolean
}

type FeedCreator = {
  kind: 'creator'
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  creator_profiles?: { disciplines: string[] | null; city: string | null; portfolio_images: string[] | null } | null
}

type FeedEvent = {
  kind: 'event'
  id: string
  title: string
  city: string | null
  event_type: string | null
  start_date: string
  cover_image: string | null
  created_at: string
  theme: string[] | null
}

type FeedItem = FeedPost | FeedCreator | FeedEvent

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return d < 7 ? `Il y a ${d}j` : new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PostCard({ post, userId, onLike }: { post: FeedPost; userId: string | null; onLike: (id: string, liked: boolean) => void }) {
  return (
    <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <Link href={`/creators/${post.creator_id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', textDecoration: 'none' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', fontWeight: 700, fontSize: '14px', overflow: 'hidden', flexShrink: 0 }}>
          {post.profiles?.avatar_url
            ? <Image src={post.profiles.avatar_url} alt="" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            : (post.profiles?.full_name?.[0] || '?')}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{post.profiles?.full_name || 'Créateur'}</p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{relativeTime(post.created_at)}</p>
        </div>
      </Link>

      <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: post.image_url ? '14px' : '16px', whiteSpace: 'pre-line' }}>{post.content}</p>

      {post.image_url && (
        <div style={{ marginBottom: '14px', borderRadius: '12px', overflow: 'hidden' }}>
          <Image src={post.image_url} alt="" width={800} height={320} style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
        <button onClick={() => onLike(post.id, post.liked)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: post.liked ? '#E05A5A' : 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart size={15} fill={post.liked ? '#E05A5A' : 'none'} />
          {post.likes_count}
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <ReportButton targetId={post.id} targetType="post" reporterId={userId ?? undefined} />
        </div>
      </div>
    </div>
  )
}

function CreatorCard({ creator }: { creator: FeedCreator }) {
  const disciplines = creator.creator_profiles?.disciplines ?? []
  const city = creator.creator_profiles?.city
  const preview = creator.creator_profiles?.portfolio_images?.[0]

  return (
    <Link href={`/creators/${creator.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.10)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
        {preview && (
          <div style={{ height: '120px', overflow: 'hidden' }}>
            <Image src={preview} alt="" width={600} height={120} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', fontWeight: 700, fontSize: '16px', overflow: 'hidden', flexShrink: 0 }}>
            {creator.avatar_url
              ? <Image src={creator.avatar_url} alt="" width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              : (creator.full_name?.[0] || '?')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.full_name || 'Créateur'}</p>
            {city && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} />{city}</p>}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6366F1', backgroundColor: '#EEF2FF', padding: '6px 10px', borderRadius: '20px' }}>
            <UserPlus size={12} /> Voir
          </div>
        </div>
        {disciplines.length > 0 && (
          <div style={{ padding: '0 16px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {disciplines.slice(0, 3).map(d => (
              <span key={d} style={{ fontSize: '11px', color: '#6366F1', backgroundColor: '#EEF2FF', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Palette size={10} />{d}
              </span>
            ))}
          </div>
        )}
        <div style={{ padding: '8px 16px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Nouveau créateur sur Nexart</span>
        </div>
      </div>
    </Link>
  )
}

function EventCard({ event }: { event: FeedEvent }) {
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.10)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}>
        {event.cover_image ? (
          <div style={{ height: '140px', overflow: 'hidden' }}>
            <Image src={event.cover_image} alt="" width={600} height={140} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ height: '80px', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={32} color="rgba(255,255,255,0.7)" />
          </div>
        )}
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>
            {event.event_type || 'Événement'}
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px', lineHeight: '1.3' }}>{event.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {event.city && (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} />{event.city}
              </span>
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarDays size={11} />{formatEventDate(event.start_date)}
            </span>
          </div>
          {event.theme && event.theme.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {event.theme.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: '11px', color: '#6366F1', backgroundColor: '#EEF2FF', padding: '3px 8px', borderRadius: '20px' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [likeUpdating, setLikeUpdating] = useState<string | null>(null)

  const loadFeed = useCallback(async (uid: string) => {
    const { data: follows } = await supabase
      .from('creator_followers')
      .select('creator_id')
      .eq('follower_id', uid)

    const followedIds = (follows ?? []).map((f: { creator_id: string }) => f.creator_id)

    // Posts des créateurs suivis
    let posts: FeedPost[] = []
    if (followedIds.length > 0) {
      const { data: postsData } = await supabase
        .from('creator_posts')
        .select('id, creator_id, content, image_url, created_at, profiles(full_name, avatar_url)')
        .in('creator_id', followedIds)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsData?.length) {
        const postIds = postsData.map((p: { id: string }) => p.id)
        const [{ data: likes }, { data: myLikes }] = await Promise.all([
          supabase.from('post_likes').select('post_id').in('post_id', postIds),
          supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', uid),
        ])
        const likesMap: Record<string, number> = {}
        ;(likes ?? []).forEach((l: { post_id: string }) => { likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1 })
        const myLikeSet = new Set((myLikes ?? []).map((l: { post_id: string }) => l.post_id))
        posts = (postsData as unknown as FeedPost[]).map(p => ({
          ...p,
          kind: 'post' as const,
          likes_count: likesMap[p.id] ?? 0,
          liked: myLikeSet.has(p.id),
        }))
      }
    }

    // Créateurs récents (pas encore suivis)
    const { data: creatorsData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, creator_profiles(disciplines, city, portfolio_images)')
      .eq('role', 'creator')
      .not('id', 'in', followedIds.length > 0 ? `(${followedIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
      .neq('id', uid)
      .order('created_at', { ascending: false })
      .limit(6)

    const creators: FeedCreator[] = (creatorsData ?? []).map((c: Record<string, unknown>) => ({ ...(c as Omit<FeedCreator, 'kind'>), kind: 'creator' as const }))

    // Événements à venir publiés
    const today = new Date().toISOString().slice(0, 10)
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, city, event_type, start_date, cover_image, created_at, theme')
      .eq('status', 'published')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(6)

    const events: FeedEvent[] = (eventsData ?? []).map((e: Record<string, unknown>) => ({ ...(e as Omit<FeedEvent, 'kind'>), kind: 'event' as const }))

    // Mélange : intercaler créateurs et événements tous les 3 posts
    const merged: FeedItem[] = []
    const allPosts = [...posts]
    const allCreators = [...creators]
    const allEvents = [...events]
    let ci = 0
    let ei = 0

    for (let i = 0; i < allPosts.length; i++) {
      merged.push(allPosts[i])
      // Après chaque 3e post : insérer un créateur ou un événement alternativement
      if ((i + 1) % 3 === 0) {
        if (ei < allEvents.length) { merged.push(allEvents[ei++]) }
        else if (ci < allCreators.length) { merged.push(allCreators[ci++]) }
      }
    }

    // Ajouter les créateurs et événements restants à la fin (si peu de posts)
    while (ei < allEvents.length) merged.push(allEvents[ei++])
    while (ci < allCreators.length) merged.push(allCreators[ci++])

    // Si aucun post suivi, montrer quand même créateurs + events
    if (allPosts.length === 0) {
      for (let i = 0; i < Math.max(allCreators.length, allEvents.length); i++) {
        if (allEvents[i]) merged.push(allEvents[i])
        if (allCreators[i]) merged.push(allCreators[i])
      }
    }

    setItems(merged)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      loadFeed(session.user.id)
    })
  }, [router, loadFeed])

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!userId || likeUpdating) return
    setLikeUpdating(postId)
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    }
    setItems(prev => prev.map(item =>
      item.kind === 'post' && item.id === postId
        ? { ...item, liked: !liked, likes_count: item.likes_count + (liked ? -1 : 1) }
        : item
    ))
    setLikeUpdating(null)
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '64px 16px 40px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Rss size={18} color="#6366F1" />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Fil d'actualités</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>Posts, créateurs et événements</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: '140px', borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', animationDelay: `${i * 60}ms` }} className="animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <GhostCard
            icon={<Rss size={32} color="#6366F1" />}
            title="Aucun contenu pour le moment"
            description="Suivez des créateurs pour voir leurs actualités ici."
            cta="Découvrir des créateurs"
            href="/creators"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, i) => (
              <motion.div key={`${item.kind}-${item.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.035 }}>
                {item.kind === 'post' && (
                  <PostCard post={item} userId={userId} onLike={toggleLike} />
                )}
                {item.kind === 'creator' && (
                  <>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px' }}>Créateur à découvrir</p>
                    <CreatorCard creator={item} />
                  </>
                )}
                {item.kind === 'event' && (
                  <>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', paddingLeft: '4px' }}>Événement à venir</p>
                    <EventCard event={item} />
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
