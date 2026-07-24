'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Heart, MessageCircle, ArrowRight, Rss } from 'lucide-react'
import { ReportButton } from '@/components/ui/report-button'
import { GhostCard } from '@/components/ui/ghost-card'

type Post = {
  id: string
  creator_id: string
  content: string
  image_url: string | null
  created_at: string
  profiles?: { full_name: string | null; avatar_url: string | null }
  likes_count?: number
  liked?: boolean
}

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

export default function FeedPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [likeUpdating, setLikeUpdating] = useState<string | null>(null)

  const loadFeed = useCallback(async (uid: string) => {
    const { data: follows } = await supabase
      .from('creator_followers')
      .select('creator_id')
      .eq('follower_id', uid)

    const followedIds = (follows ?? []).map(f => f.creator_id)

    if (!followedIds.length) { setLoading(false); return }

    const { data: postsData } = await supabase
      .from('creator_posts')
      .select('id, creator_id, content, image_url, created_at, profiles(full_name, avatar_url)')
      .in('creator_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!postsData?.length) { setLoading(false); return }

    const postIds = postsData.map(p => p.id)

    const [{ data: likes }, { data: myLikes }] = await Promise.all([
      supabase.from('post_likes').select('post_id').in('post_id', postIds),
      supabase.from('post_likes').select('post_id').in('post_id', postIds).eq('user_id', uid),
    ])

    const likesMap: Record<string, number> = {}
    ;(likes ?? []).forEach(l => { likesMap[l.post_id] = (likesMap[l.post_id] ?? 0) + 1 })
    const myLikeSet = new Set((myLikes ?? []).map(l => l.post_id))

    setPosts((postsData as unknown as Post[]).map(p => ({
      ...p,
      likes_count: likesMap[p.id] ?? 0,
      liked: myLikeSet.has(p.id),
    })))
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
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, liked: !liked, likes_count: (p.likes_count ?? 0) + (liked ? -1 : 1) }
      : p
    ))
    setLikeUpdating(null)
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '64px 16px' }}>
      <style>{`@keyframes feed-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Rss size={18} color="#4F46E5" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Fil d&apos;actualités</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Les posts des créateurs que vous suivez</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '160px', borderRadius: '16px', backgroundColor: '#F3F4F6', animation: `feed-pulse 1.5s ease-in-out ${i * 60}ms infinite` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <GhostCard
            icon={<Rss size={32} color="#6366F1" />}
            title="Aucune publication pour le moment"
            description="Suivez des créateurs pour voir leurs actualités ici."
            cta="Découvrir des créateurs"
            href="/creators"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ padding: '20px', borderRadius: '16px', border: '1px solid #F3F4F6', backgroundColor: 'var(--bg-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {/* Author */}
                <Link href={`/creators/${post.creator_id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', textDecoration: 'none' }}
                  onMouseEnter={e => { const name = e.currentTarget.querySelector('.feed-creator-name') as HTMLElement; if (name) name.style.color = '#4338CA' }}
                  onMouseLeave={e => { const name = e.currentTarget.querySelector('.feed-creator-name') as HTMLElement; if (name) name.style.color = 'var(--text-primary)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338CA', fontWeight: 700, fontSize: '14px', flexShrink: 0, overflow: 'hidden' }}>
                    {post.profiles?.avatar_url
                      ? <Image src={post.profiles.avatar_url} alt={`Photo de profil de ${post.profiles?.full_name || 'créateur'}`} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      : (post.profiles?.full_name?.[0] || '?')}
                  </div>
                  <div>
                    <p className="feed-creator-name" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, transition: 'color 0.15s' }}>{post.profiles?.full_name || 'Créateur'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{relativeTime(post.created_at)}</p>
                  </div>
                </Link>

                {/* Content */}
                <p style={{ fontSize: '14px', color: 'var(--text-body, #374151)', lineHeight: 1.6, marginBottom: '16px', whiteSpace: 'pre-line' }}>{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <div style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' }}>
                    <Image src={post.image_url} alt={`Image du post de ${post.profiles?.full_name || 'créateur'}`} width={800} height={320} style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                  <button onClick={() => toggleLike(post.id, post.liked ?? false)} disabled={likeUpdating === post.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: post.liked ? '#E05A5A' : 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: likeUpdating === post.id ? 0.5 : 1, transition: 'color 0.15s' }}>
                    <Heart size={16} fill={post.liked ? '#E05A5A' : 'none'} />
                    {post.likes_count ?? 0}
                  </button>
                  <Link href={`/creators/${post.creator_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                    <MessageCircle size={14} /> Voir le profil
                  </Link>
                  <div style={{ marginLeft: 'auto' }}>
                    <ReportButton targetId={post.id} targetType="post" reporterId={userId ?? undefined} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
