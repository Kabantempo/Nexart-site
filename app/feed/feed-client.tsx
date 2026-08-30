'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart, MapPin, CalendarDays, Palette, UserPlus, Sparkles } from 'lucide-react'
import { ReportButton } from '@/components/ui/report-button'
import { GhostCard } from '@/components/ui/ghost-card'
import { colors } from '@/lib/design-tokens'

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
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

// ── Cards ─────────────────────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  breakInside: 'avoid',
  marginBottom: '16px',
  transition: 'box-shadow 0.2s, transform 0.2s',
}

function PostCard({ post, userId, onLike }: { post: FeedPost; userId: string | null; onLike: (id: string, liked: boolean) => void }) {
  return (
    <div style={cardBase}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
      <div style={{ padding: '18px 18px 0' }}>
        <Link href={`/creators/${post.creator_id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.violet.primary, fontWeight: 700, fontSize: '13px', overflow: 'hidden', flexShrink: 0 }}>
            {post.profiles?.avatar_url
              ? <Image src={post.profiles.avatar_url} alt="" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              : (post.profiles?.full_name?.[0] || '?')}
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{post.profiles?.full_name || 'Créateur'}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>{relativeTime(post.created_at)}</p>
          </div>
        </Link>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.65', marginBottom: post.image_url ? '14px' : '0', whiteSpace: 'pre-line' }}>{post.content}</p>
      </div>

      {post.image_url && (
        <div style={{ marginTop: post.image_url ? '0' : undefined }}>
          <Image src={post.image_url} alt="" width={600} height={320} style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 18px', borderTop: '1px solid var(--border-color)', marginTop: post.image_url ? '0' : undefined }}>
        <button onClick={() => onLike(post.id, post.liked)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: post.liked ? colors.feedback.danger.solid : 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Heart size={14} fill={post.liked ? colors.feedback.danger.solid : 'none'} />
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
    <Link href={`/creators/${creator.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={cardBase}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>

        {/* Label */}
        <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={11} color={colors.violet.primary} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: colors.violet.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Créateur à découvrir</span>
        </div>

        {preview && (
          <div style={{ height: '110px', overflow: 'hidden', margin: '10px 14px 0', borderRadius: '10px' }}>
            <Image src={preview} alt="" width={500} height={110} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.violet.primary, fontWeight: 700, fontSize: '14px', overflow: 'hidden', flexShrink: 0, border: `2px solid ${colors.violet.bg}` }}>
            {creator.avatar_url
              ? <Image src={creator.avatar_url} alt="" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              : (creator.full_name?.[0] || '?')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{creator.full_name || 'Créateur'}</p>
            {city && <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} />{city}</p>}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: colors.violet.primary, backgroundColor: colors.violet.bg, padding: '5px 10px', borderRadius: '20px' }}>
            <UserPlus size={11} /> Voir
          </div>
        </div>

        {disciplines.length > 0 && (
          <div style={{ padding: '0 14px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {disciplines.slice(0, 3).map(d => (
              <span key={d} style={{ fontSize: '10px', color: colors.violet.primary, backgroundColor: colors.violet.bg, padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Palette size={9} />{d}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

function EventCard({ event }: { event: FeedEvent }) {
  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={cardBase}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>

        {event.cover_image ? (
          <div style={{ height: '150px', overflow: 'hidden' }}>
            <Image src={event.cover_image} alt="" width={600} height={150} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ height: '80px', background: `linear-gradient(135deg, ${colors.violet.primary} 0%, ${colors.violet.hover} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={28} color="rgba(255,255,255,0.8)" />
          </div>
        )}

        <div style={{ padding: '14px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: colors.violet.primary, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' }}>
            {event.event_type || 'Événement'}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', lineHeight: '1.35' }}>{event.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {event.city && (
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={10} />{event.city}
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CalendarDays size={10} />{formatEventDate(event.start_date)}
            </span>
          </div>
          {event.theme && event.theme.length > 0 && (
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
              {event.theme.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: '10px', color: colors.violet.primary, backgroundColor: colors.violet.bg, padding: '3px 8px', borderRadius: '20px' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard({ height }: { height: number }) {
  return (
    <div style={{ height, borderRadius: '16px', backgroundColor: 'var(--bg-secondary)', breakInside: 'avoid', marginBottom: '16px' }} className="animate-pulse" />
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [creators, setCreators] = useState<FeedCreator[]>([])
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [likeUpdating, setLikeUpdating] = useState<string | null>(null)

  const loadFeed = useCallback(async (uid: string) => {
    const { data: follows } = await supabase
      .from('creator_followers')
      .select('creator_id')
      .eq('follower_id', uid)

    const followedIds = (follows ?? []).map((f: { creator_id: string }) => f.creator_id)

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
        setPosts((postsData as unknown as FeedPost[]).map(p => ({
          ...p,
          kind: 'post' as const,
          likes_count: likesMap[p.id] ?? 0,
          liked: myLikeSet.has(p.id),
        })))
      }
    }

    const creatorsQuery = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, creator_profiles(disciplines, city, portfolio_images)')
      .eq('role', 'creator')
      .neq('id', uid)
      .order('created_at', { ascending: false })
      .limit(8)

    const { data: creatorsData } = followedIds.length > 0
      ? await creatorsQuery.not('id', 'in', `(${followedIds.join(',')})`)
      : await creatorsQuery

    setCreators((creatorsData ?? []).map((c: Record<string, unknown>) => ({ ...(c as Omit<FeedCreator, 'kind'>), kind: 'creator' as const })))

    const today = new Date().toISOString().slice(0, 10)
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, city, event_type, start_date, cover_image, created_at, theme')
      .eq('status', 'published')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(8)

    setEvents((eventsData ?? []).map((e: Record<string, unknown>) => ({ ...(e as Omit<FeedEvent, 'kind'>), kind: 'event' as const })))

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
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !liked, likes_count: p.likes_count + (liked ? -1 : 1) } : p
    ))
    setLikeUpdating(null)
  }

  // Intercalage : 1 creator ou event tous les 4 posts
  const buildMasonryItems = (): FeedItem[] => {
    const result: FeedItem[] = []
    let ci = 0, ei = 0
    for (let i = 0; i < posts.length; i++) {
      result.push(posts[i])
      if ((i + 1) % 4 === 0) {
        if (ci < creators.length) result.push(creators[ci++])
        if (ei < events.length) result.push(events[ei++])
      }
    }
    // Reste des créateurs et events non intercalés
    while (ci < creators.length) result.push(creators[ci++])
    while (ei < events.length) result.push(events[ei++])
    return result
  }

  const items = buildMasonryItems()
  const hasContent = posts.length > 0 || creators.length > 0 || events.length > 0

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 20px 48px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Fil d'actualités</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: 0 }}>Posts, créateurs à découvrir et événements à venir</p>
        </div>

        {loading ? (
          <div style={{ columns: 'auto 300px', columnGap: '16px' }}>
            {[200, 140, 180, 260, 150, 200].map((h, i) => <SkeletonCard key={i} height={h} />)}
          </div>
        ) : !hasContent ? (
          <GhostCard
            icon={<CalendarDays size={32} color={colors.violet.primary} />}
            title="Aucun contenu pour le moment"
            description="Suivez des créateurs pour voir leurs actualités ici."
            cta="Découvrir des créateurs"
            href="/creators"
          />
        ) : (
          <div style={{ columns: 'auto 300px', columnGap: '16px' }}>
            {items.map((item, i) => (
              <motion.div key={`${item.kind}-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }} style={{ breakInside: 'avoid' }}>
                {item.kind === 'post' && <PostCard post={item} userId={userId} onLike={toggleLike} />}
                {item.kind === 'creator' && <CreatorCard creator={item} />}
                {item.kind === 'event' && <EventCard event={item} />}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
