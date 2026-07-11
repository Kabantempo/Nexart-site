'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MessageCircle, Trash2, Palette, Building2, Eye, Search, CheckCheck, X } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

type ConvRow = {
  id: string
  creator_id: string
  organizer_id: string
  event_id: string | null
  created_at: string
}

type MsgRow = {
  conversation_id: string
  content: string
  created_at: string
  sender_id: string
  read_at: string | null
}

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

type ConvMeta = ConvRow & {
  other: Profile | null
  lastMessage: MsgRow | null
  unreadCount: number
}

type FilterRole = 'all' | 'creator' | 'organizer' | 'visitor'

const ROLE_LABELS: Record<FilterRole, string> = {
  all: 'Tous',
  creator: 'Créateurs',
  organizer: 'Organisateurs',
  visitor: 'Visiteurs',
}

const ROLE_ICONS: Record<FilterRole, React.ReactNode> = {
  all: <MessageCircle size={13} />,
  creator: <Palette size={13} />,
  organizer: <Building2 size={13} />,
  visitor: <Eye size={13} />,
}

function roleOfProfile(profile: Profile | null): FilterRole {
  const r = profile?.role
  if (r === 'creator' || r === 'artisan') return 'creator'
  if (r === 'organizer') return 'organizer'
  return 'visitor'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function MessagesPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConvMeta[]>([])
  const [hoveredConv, setHoveredConv] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterRole>('all')
  const [search, setSearch] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const loadConversations = useCallback(async (userId: string) => {
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('id, creator_id, organizer_id, event_id, created_at')
      .or(`creator_id.eq.${userId},organizer_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error || !convs?.length) { setLoading(false); return }

    const otherIds = [...new Set((convs as ConvRow[]).map(c =>
      c.creator_id === userId ? c.organizer_id : c.creator_id
    ))]

    const [{ data: profiles }, { data: allMessages }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', otherIds),
      supabase.from('messages')
        .select('conversation_id, content, created_at, sender_id, read_at')
        .in('conversation_id', convs.map(c => c.id))
        .order('created_at', { ascending: false }),
    ])

    const profileMap: Record<string, Profile> = Object.fromEntries(
      (profiles ?? []).map(p => [p.id, p])
    )

    const msgByConv: Record<string, MsgRow[]> = {}
    for (const m of (allMessages ?? []) as MsgRow[]) {
      if (!msgByConv[m.conversation_id]) msgByConv[m.conversation_id] = []
      msgByConv[m.conversation_id].push(m)
    }

    const enriched: ConvMeta[] = (convs as ConvRow[]).map(c => {
      const otherId = c.creator_id === userId ? c.organizer_id : c.creator_id
      const msgs = msgByConv[c.id] ?? []
      return {
        ...c,
        other: profileMap[otherId] ?? null,
        lastMessage: msgs[0] ?? null,
        unreadCount: msgs.filter(m => !m.read_at && m.sender_id !== userId).length,
      }
    })

    // Sort: unread first, then by last message date
    enriched.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1
      const ta = a.lastMessage?.created_at ?? a.created_at
      const tb = b.lastMessage?.created_at ?? b.created_at
      return new Date(tb).getTime() - new Date(ta).getTime()
    })

    setConversations(enriched)
    setLoading(false)
  }, [])

  const deleteConversation = async (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId))
    await supabase.from('messages').delete().eq('conversation_id', convId)
    await supabase.from('conversations').delete().eq('id', convId)
  }

  const markAllAsRead = async () => {
    if (!user) return
    setMarkingAll(true)
    const convIds = conversations.filter(c => c.unreadCount > 0).map(c => c.id)
    if (convIds.length) {
      await supabase.from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .is('read_at', null)
      setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })))
    }
    setMarkingAll(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      loadConversations(session.user.id)
    })
  }, [router, loadConversations])

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  const filtered = conversations
    .filter(c => filter === 'all' || roleOfProfile(c.other) === filter)
    .filter(c => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        c.other?.full_name?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      )
    })

  const roleCounts: Record<FilterRole, number> = {
    all: conversations.length,
    creator: conversations.filter(c => roleOfProfile(c.other) === 'creator').length,
    organizer: conversations.filter(c => roleOfProfile(c.other) === 'organizer').length,
    visitor: conversations.filter(c => roleOfProfile(c.other) === 'visitor').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-400 text-sm mt-1">Vos conversations avec les créateurs et organisateurs</p>
          </div>
          {totalUnread > 0 && (
            <button onClick={markAllAsRead} disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-all disabled:opacity-50">
              <CheckCheck size={15} />
              Tout marquer comme lu
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">{totalUnread}</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        {conversations.length > 0 && (
          <div className="relative mb-5 mt-5">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Filter tabs */}
        {conversations.length > 0 && (
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {(Object.keys(ROLE_LABELS) as FilterRole[]).map(r => {
              const count = roleCounts[r]
              if (r !== 'all' && count === 0) return null
              const active = filter === r
              return (
                <button key={r} onClick={() => setFilter(r)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {ROLE_ICONS[r]}
                  {ROLE_LABELS[r]}
                  <span className={`min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center text-[11px] font-bold ${
                    active ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {filtered.length === 0 ? (
          conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '16px', border: '1px dashed #E5E7EB', backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <MessageCircle size={32} color="#6366F1" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Aucun message pour l'instant</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto 24px' }}>
                Vos échanges avec les créateurs et organisateurs apparaîtront ici.
              </p>
              <button
                onClick={() => router.push('/events')}
                style={{ padding: '12px 28px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Explorer les événements
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '16px', border: '1px dashed #E5E7EB', backgroundColor: 'var(--bg-secondary)' }}>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Aucun message dans cette catégorie.</p>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filtered.map((conv, i) => (
              <motion.div key={conv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredConv(conv.id)}
                onMouseLeave={() => setHoveredConv(null)}
              >
                {/* Delete button */}
                {hoveredConv === conv.id && (
                  <button
                    onClick={e => { e.preventDefault(); deleteConversation(conv.id) }}
                    title="Supprimer la conversation"
                    style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', zIndex: 10, width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <Link
                  href={`/messages/${conv.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                    paddingRight: hoveredConv === conv.id ? '52px' : '16px',
                    borderRadius: '12px', textDecoration: 'none',
                    backgroundColor: conv.unreadCount > 0 ? '#F8F7FF' : '#FFFFFF',
                    border: `1px solid ${conv.unreadCount > 0 ? '#E0E0FA' : '#F3F4F6'}`,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F5F5FF'; e.currentTarget.style.borderColor = '#C7C7F0' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = conv.unreadCount > 0 ? '#F8F7FF' : '#FFFFFF'; e.currentTarget.style.borderColor = conv.unreadCount > 0 ? '#E0E0FA' : '#F3F4F6' }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#6366F1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {conv.other?.avatar_url ? (
                        <Image src={conv.other.avatar_url} alt="" fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#FFF', fontSize: '18px', fontWeight: '700' }}>
                          {(conv.other?.full_name ?? '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Role badge */}
                    {conv.other?.role && (
                      <span style={{
                        position: 'absolute', bottom: '-2px', right: '-2px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        border: '2px solid #FFFFFF',
                        backgroundColor: conv.other.role === 'creator' || conv.other.role === 'artisan' ? '#6366F1'
                          : conv.other.role === 'organizer' ? '#059669' : '#9CA3AF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {conv.other.role === 'creator' || conv.other.role === 'artisan'
                          ? <Palette size={8} color="#FFF" />
                          : conv.other.role === 'organizer'
                          ? <Building2 size={8} color="#FFF" />
                          : <Eye size={8} color="#FFF" />
                        }
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '15px', fontWeight: conv.unreadCount > 0 ? '700' : '600', color: 'var(--text-primary)' }}>
                        {conv.other?.full_name ?? 'Utilisateur'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>
                        {relativeTime(conv.lastMessage?.created_at ?? conv.created_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{
                        fontSize: '13px', margin: 0, flex: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: conv.unreadCount > 0 ? '#374151' : '#9CA3AF',
                        fontWeight: conv.unreadCount > 0 ? '600' : '400',
                      }}>
                        {conv.lastMessage
                          ? (() => {
                              const prefix = conv.lastMessage.sender_id === user?.id ? 'Vous : ' : ''
                              if (conv.lastMessage.content.startsWith('[Demande de devis]')) return prefix + '📋 Demande de devis'
                              if (conv.lastMessage.content.startsWith('[Demande de collaboration]')) return prefix + '🤝 Proposition de collab'
                              return prefix + conv.lastMessage.content
                            })()
                          : 'Conversation démarrée'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span style={{ marginLeft: '8px', minWidth: '20px', height: '20px', borderRadius: '9999px', backgroundColor: '#6366F1', color: '#FFF', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', flexShrink: 0 }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
