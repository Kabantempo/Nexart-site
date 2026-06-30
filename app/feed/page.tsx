'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Plus, X, Sparkles, Users, Zap, Lightbulb, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

interface Post {
  id: string
  author_id: string
  content: string
  images: string[]
  post_type: string
  hashtags: string[]
  likes_count: number
  created_at: string
  author?: { full_name: string; avatar_url?: string; role?: string }
  liked?: boolean
}

const POST_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  general: { label: 'Général', color: '#6366F1', bg: '#EEF2FF', icon: <Sparkles size={12} /> },
  guest_appearance: { label: 'Participation', color: '#8B5CF6', bg: '#F5F3FF', icon: <Star size={12} /> },
  call_for_collab: { label: 'Collaboration', color: '#EC4899', bg: '#FDF2F8', icon: <Users size={12} /> },
  tip: { label: 'Conseil', color: '#F59E0B', bg: '#FFFBEB', icon: <Lightbulb size={12} /> },
  experience: { label: 'Expérience', color: '#10B981', bg: '#ECFDF5', icon: <Zap size={12} /> },
}

export default function FeedPage() {
  const user = useAuthStore((s) => s.user)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState('general')
  const [posting, setPosting] = useState(false)
  const [liking, setLiking] = useState<Set<string>>(new Set())

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:author_id(full_name, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      let likedIds = new Set<string>()
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
        likedIds = new Set((likes || []).map((l: { post_id: string }) => l.post_id))
      }

      setPosts(data.map((p) => ({
        ...p,
        author: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
        liked: likedIds.has(p.id),
      })))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handlePost = async () => {
    if (!user || !newContent.trim() || newContent.length > 280) return
    setPosting(true)
    const hashtags = newContent.match(/#\w+/g) || []
    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      content: newContent.trim(),
      post_type: newType,
      hashtags,
    })
    if (!error) {
      setNewContent('')
      setNewType('general')
      setShowCreate(false)
      await fetchPosts()
    }
    setPosting(false)
  }

  const handleLike = async (post: Post) => {
    if (!user || liking.has(post.id)) return
    setLiking((prev) => new Set([...prev, post.id]))

    if (post.liked) {
      await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id)
      await supabase.rpc('decrement_post_likes', { post_id: post.id })
    } else {
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id })
      await supabase.rpc('increment_post_likes', { post_id: post.id })
    }

    setPosts((prev) => prev.map((p) => p.id === post.id
      ? { ...p, liked: !p.liked, likes_count: p.likes_count + (p.liked ? -1 : 1) }
      : p
    ))
    setLiking((prev) => { const n = new Set(prev); n.delete(post.id); return n })
  }

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}j`
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.5px' }}>
              Feed
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B' }}>Actualités de la communauté Nexart</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#FFFFFF', fontSize: '14px', fontWeight: '700',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Plus size={16} /> Publier
            </button>
          )}
        </div>

        {/* Create post modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>Nouvelle publication</h2>
                  <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <X size={20} color="#94A3B8" />
                  </button>
                </div>

                {/* Type selector */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {Object.entries(POST_TYPE_CONFIG).map(([type, cfg]) => (
                    <button
                      key={type}
                      onClick={() => setNewType(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                        backgroundColor: newType === type ? cfg.color : '#F1F5F9',
                        color: newType === type ? '#FFFFFF' : '#64748B',
                        transition: 'all 150ms ease',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Quoi de neuf ? Partagez une expérience, un conseil, une collab... #nexart"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  maxLength={280}
                  rows={4}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', color: '#0F172A',
                    border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC',
                    outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.6',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '13px', color: newContent.length > 260 ? '#EF4444' : '#94A3B8' }}>
                    {newContent.length}/280
                  </span>
                  <button
                    onClick={handlePost}
                    disabled={posting || !newContent.trim() || newContent.length > 280}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      background: posting || !newContent.trim() ? '#CBD5E1' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                      color: '#FFFFFF', fontSize: '14px', fontWeight: '700',
                    }}
                  >
                    <Send size={15} /> {posting ? 'Publication…' : 'Publier'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px', height: '140px' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '16px', border: '1px dashed #CBD5E1', backgroundColor: '#FFFFFF' }}>
            <Sparkles size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Le feed est vide pour l'instant</h3>
            <p style={{ fontSize: '14px', color: '#64748B' }}>
              {user ? 'Soyez le premier à publier !' : (<><Link href="/login" style={{ color: '#6366F1', fontWeight: '600' }}>Connectez-vous</Link> pour voir et créer des posts.</>)}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post, i) => {
              const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.general
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: '16px',
                    border: '1px solid #E2E8F0', padding: '20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <Link href={`/creators/${post.author_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      {post.author?.avatar_url ? (
                        <img src={post.author.avatar_url} alt={post.author.full_name} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EEF2FF' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '700', color: '#6366F1' }}>
                          {post.author?.full_name?.[0] || '?'}
                        </div>
                      )}
                    </Link>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link href={`/creators/${post.author_id}`} style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', textDecoration: 'none' }}>
                          {post.author?.full_name || 'Anonyme'}
                        </Link>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '600',
                          backgroundColor: typeConfig.bg, color: typeConfig.color,
                        }}>
                          {typeConfig.icon} {typeConfig.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{formatTime(post.created_at)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: '15px', color: '#1E293B', lineHeight: '1.65', marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                    {post.content.split(/(\s#\w+)/g).map((part, j) =>
                      part.trim().startsWith('#')
                        ? <span key={j} style={{ color: '#6366F1', fontWeight: '600' }}>{part}</span>
                        : part
                    )}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => handleLike(post)}
                      disabled={!user || liking.has(post.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: user ? 'pointer' : 'default',
                        fontSize: '13px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px',
                        color: post.liked ? '#E05A5A' : '#94A3B8',
                        backgroundColor: post.liked ? '#FFF1F2' : 'transparent',
                        transition: 'all 200ms ease',
                      }}
                    >
                      <Heart size={16} fill={post.liked ? '#E05A5A' : 'none'} color={post.liked ? '#E05A5A' : '#94A3B8'} />
                      {post.likes_count > 0 && post.likes_count}
                    </button>
                    <button
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'default',
                        fontSize: '13px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px',
                        color: '#94A3B8',
                      }}
                    >
                      <MessageCircle size={16} color="#94A3B8" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!user && (
          <div style={{ marginTop: '32px', padding: '20px', borderRadius: '14px', backgroundColor: '#EEF2FF', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#4F46E5', fontWeight: '600', marginBottom: '12px' }}>
              Connectez-vous pour participer à la communauté
            </p>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
