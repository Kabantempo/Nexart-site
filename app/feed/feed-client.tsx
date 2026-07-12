'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Heart, MessageCircle, ArrowRight, Rss } from 'lucide-react'
import { ReportButton } from '@/components/ui/report-button'

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
    <div className="max-w-2xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Rss size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fil d'actualités</h1>
            <p className="text-sm text-gray-400">Les posts des créateurs que vous suivez</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
            <Rss size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-500 mb-1">Aucune publication pour le moment</p>
            <p className="text-sm text-gray-400 mb-6">Suivez des créateurs pour voir leurs actualités ici</p>
            <Link href="/creators"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
              Découvrir des créateurs <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* Author */}
                <Link href={`/creators/${post.creator_id}`} className="flex items-center gap-3 mb-4 group">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 overflow-hidden">
                    {post.profiles?.avatar_url
                      ? <img src={post.profiles.avatar_url} alt={`Photo de profil de ${post.profiles?.full_name || 'créateur'}`} className="w-full h-full object-cover" />
                      : (post.profiles?.full_name?.[0] || '?')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{post.profiles?.full_name || 'Créateur'}</p>
                    <p className="text-xs text-gray-400">{relativeTime(post.created_at)}</p>
                  </div>
                </Link>

                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url} alt={`Image du post de ${post.profiles?.full_name || 'créateur'}`} className="w-full max-h-80 object-cover" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button onClick={() => toggleLike(post.id, post.liked ?? false)} disabled={likeUpdating === post.id}
                    className="flex items-center gap-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ color: post.liked ? '#E05A5A' : '#9CA3AF' }}>
                    <Heart size={16} fill={post.liked ? '#E05A5A' : 'none'} />
                    {post.likes_count ?? 0}
                  </button>
                  <Link href={`/creators/${post.creator_id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors">
                    <MessageCircle size={14} /> Voir le profil
                  </Link>
                  <div className="ml-auto">
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
