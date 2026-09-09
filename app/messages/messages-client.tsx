'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import {
  MessageCircle, Trash2, Palette, Building2, Eye, Search, CheckCheck, X,
  Users, Plus, Send, Bell, ChevronRight, Rss,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { GhostCard } from '@/components/ui/ghost-card'
import { colors } from '@/lib/design-tokens'

type ConvRow = { id: string; creator_id: string; organizer_id: string; event_id: string | null; created_at: string }
type MsgRow = { conversation_id: string; content: string; created_at: string; sender_id: string; read_at: string | null }
type Profile = { id: string; full_name: string | null; avatar_url: string | null; role: string | null }
type ConvMeta = ConvRow & { other: Profile | null; lastMessage: MsgRow | null; unreadCount: number }
type FilterRole = 'all' | 'creator' | 'organizer' | 'visitor'
type MainTab = 'messages' | 'groupes' | 'actu'

type Group = {
  id: string
  name: string
  event_id: string | null
  created_at: string
  memberCount: number
  events?: { title: string; slug?: string | null } | null
}

type OrgEvent = { id: string; title: string; slug?: string | null }

type ActuItem = {
  id: string
  type: string
  title: string
  body: string
  created_at: string
  read_at: string | null
  link: string | null
}

const ROLE_LABELS: Record<FilterRole, string> = { all: 'Tous', creator: 'Créateurs', organizer: 'Organisateurs', visitor: 'Visiteurs' }
const ROLE_ICONS: Record<FilterRole, React.ReactNode> = {
  all: <MessageCircle size={13} />, creator: <Palette size={13} />, organizer: <Building2 size={13} />, visitor: <Eye size={13} />,
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

function Avatar({ profile, size = 48 }: { profile: Profile | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: colors.violet.primary, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt="" fill style={{ objectFit: 'cover' }} />
      ) : (
        <span style={{ color: colors.bg.primary, fontSize: size * 0.375, fontWeight: '700' }}>
          {(profile?.full_name ?? '?')[0].toUpperCase()}
        </span>
      )}
    </div>
  )
}

export default function MessagesClient() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<ConvMeta[]>([])
  const [hoveredConv, setHoveredConv] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterRole>('all')
  const [search, setSearch] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('messages')

  // Groups state
  const [groups, setGroups] = useState<Group[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEvent, setNewGroupEvent] = useState('')
  const [newGroupAutoImport, setNewGroupAutoImport] = useState(true)
  const [orgEvents, setOrgEvents] = useState<OrgEvent[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [broadcastGroup, setBroadcastGroup] = useState<Group | null>(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastDone, setBroadcastDone] = useState(false)

  // Fils d'actu state
  const [actu, setActu] = useState<ActuItem[]>([])
  const [actuLoading, setActuLoading] = useState(false)

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

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/messages/groups', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const { groups: g } = await res.json()
        setGroups(g ?? [])
      }
    } finally {
      setGroupsLoading(false)
    }
  }, [])

  const loadActu = useCallback(async (userId: string) => {
    setActuLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, created_at, read_at, link')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setActu((data ?? []) as ActuItem[])
    setActuLoading(false)
  }, [])

  const loadOrgEvents = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug')
      .eq('organizer_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    setOrgEvents((data ?? []) as OrgEvent[])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      loadConversations(session.user.id)
      loadOrgEvents(session.user.id)
      loadActu(session.user.id)
    })
  }, [router, loadConversations, loadOrgEvents, loadActu])

  useEffect(() => {
    if (mainTab === 'groupes' && groups.length === 0 && !groupsLoading) {
      loadGroups()
    }
  }, [mainTab, groups.length, groupsLoading, loadGroups])

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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    setCreatingGroup(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/messages/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: newGroupName.trim(), event_id: newGroupEvent || null, auto_import: newGroupAutoImport }),
      })
      if (res.ok) {
        setShowCreateGroup(false)
        setNewGroupName('')
        setNewGroupEvent('')
        setNewGroupAutoImport(true)
        loadGroups()
      }
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !broadcastGroup) return
    setBroadcasting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`/api/messages/groups/${broadcastGroup.id}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ message: broadcastMsg.trim() }),
      })
      if (res.ok) {
        setBroadcastDone(true)
        setBroadcastMsg('')
        setTimeout(() => { setBroadcastGroup(null); setBroadcastDone(false) }, 2000)
      }
    } finally {
      setBroadcasting(false)
    }
  }

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)

  const filtered = conversations
    .filter(c => filter === 'all' || roleOfProfile(c.other) === filter)
    .filter(c => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return c.other?.full_name?.toLowerCase().includes(q) || c.lastMessage?.content?.toLowerCase().includes(q)
    })

  const roleCounts: Record<FilterRole, number> = {
    all: conversations.length,
    creator: conversations.filter(c => roleOfProfile(c.other) === 'creator').length,
    organizer: conversations.filter(c => roleOfProfile(c.other) === 'organizer').length,
    visitor: conversations.filter(c => roleOfProfile(c.other) === 'visitor').length,
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const TAB_STYLE = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: active ? '600' : '500',
    backgroundColor: active ? colors.violet.primary : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 150ms ease',
  } as React.CSSProperties)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Messages</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Conversations, groupes et activité</p>
          </div>
          {mainTab === 'messages' && totalUnread > 0 && (
            <button onClick={markAllAsRead} disabled={markingAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'transparent', cursor: 'pointer', opacity: markingAll ? 0.5 : 1 }}>
              <CheckCheck size={14} />
              Tout lu
              <span style={{ padding: '1px 6px', borderRadius: '99px', backgroundColor: `${colors.violet.primary}22`, color: colors.violet.primary, fontSize: '11px', fontWeight: '700' }}>{totalUnread}</span>
            </button>
          )}
          {mainTab === 'groupes' && (
            <button onClick={() => setShowCreateGroup(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: 'pointer' }}>
              <Plus size={14} />
              Nouveau groupe
            </button>
          )}
        </div>

        {/* Main tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
          <button style={TAB_STYLE(mainTab === 'messages')} onClick={() => setMainTab('messages')}>
            <MessageCircle size={14} />
            Conversations
            {totalUnread > 0 && <span style={{ minWidth: '18px', height: '18px', borderRadius: '99px', backgroundColor: mainTab === 'messages' ? 'rgba(255,255,255,0.3)' : colors.violet.primary, color: mainTab === 'messages' ? '#fff' : '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{totalUnread}</span>}
          </button>
          <button style={TAB_STYLE(mainTab === 'groupes')} onClick={() => setMainTab('groupes')}>
            <Users size={14} />
            Groupes
          </button>
          <button style={TAB_STYLE(mainTab === 'actu')} onClick={() => setMainTab('actu')}>
            <Rss size={14} />
            Fils d&apos;actu
          </button>
        </div>

        {/* ─── TAB: Messages ─── */}
        {mainTab === 'messages' && (
          <>
            {conversations.length > 0 && (
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '38px', paddingRight: '36px', paddingTop: '10px', paddingBottom: '10px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {conversations.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {(Object.keys(ROLE_LABELS) as FilterRole[]).map(r => {
                  const count = roleCounts[r]
                  if (r !== 'all' && count === 0) return null
                  const active = filter === r
                  return (
                    <button key={r} onClick={() => setFilter(r)}
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '99px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: active ? colors.violet.primary : 'var(--bg-secondary)', color: active ? '#fff' : 'var(--text-secondary)', transition: 'all 150ms' }}>
                      {ROLE_ICONS[r]}
                      {ROLE_LABELS[r]}
                      <span style={{ minWidth: '17px', height: '17px', borderRadius: '99px', padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.border.default, color: active ? '#fff' : 'var(--text-secondary)' }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {filtered.length === 0 ? (
              conversations.length === 0 ? (
                <GhostCard
                  icon={<MessageCircle size={32} color={colors.violet.primary} />}
                  title="Aucun message pour l'instant"
                  description="Vos échanges avec les créateurs et organisateurs apparaîtront ici."
                  cta="Explorer les événements"
                  onAction={() => router.push('/events')}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '12px', border: `1px dashed ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Aucun résultat</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aucun message dans cette catégorie.</p>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filtered.map((conv, i) => (
                  <motion.div key={conv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredConv(conv.id)}
                    onMouseLeave={() => setHoveredConv(null)}
                  >
                    {hoveredConv === conv.id && (
                      <button onClick={e => { e.preventDefault(); deleteConversation(conv.id) }}
                        style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', zIndex: 10, width: '30px', height: '30px', borderRadius: '50%', border: 'none', backgroundColor: `${colors.feedback.danger.solid}18`, color: colors.feedback.danger.solid, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                    <Link href={`/messages/${conv.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', paddingRight: hoveredConv === conv.id ? '50px' : '14px', borderRadius: '10px', textDecoration: 'none', backgroundColor: conv.unreadCount > 0 ? `${colors.violet.primary}0d` : 'var(--card-bg)', border: `1px solid ${conv.unreadCount > 0 ? `${colors.violet.primary}33` : 'var(--border-color)'}`, transition: 'all 150ms ease' }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar profile={conv.other} size={44} />
                        {conv.other?.role && (
                          <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '15px', height: '15px', borderRadius: '50%', border: `2px solid var(--bg-primary)`, backgroundColor: conv.other.role === 'creator' || conv.other.role === 'artisan' ? colors.violet.primary : conv.other.role === 'organizer' ? colors.feedback.success.solid : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {conv.other.role === 'creator' || conv.other.role === 'artisan' ? <Palette size={7} color="#fff" /> : conv.other.role === 'organizer' ? <Building2 size={7} color="#fff" /> : <Eye size={7} color="#fff" />}
                          </span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: conv.unreadCount > 0 ? '700' : '600', color: 'var(--text-primary)' }}>{conv.other?.full_name ?? 'Utilisateur'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '8px' }}>{relativeTime(conv.lastMessage?.created_at ?? conv.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontSize: '13px', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: conv.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: conv.unreadCount > 0 ? '600' : '400' }}>
                            {conv.lastMessage ? (() => {
                              const prefix = conv.lastMessage.sender_id === user?.id ? 'Vous : ' : ''
                              if (conv.lastMessage.content.startsWith('[Demande de devis]')) return prefix + 'Demande de devis'
                              if (conv.lastMessage.content.startsWith('[Demande de collaboration]')) return prefix + 'Proposition de collab'
                              return prefix + conv.lastMessage.content
                            })() : 'Conversation démarrée'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span style={{ marginLeft: '8px', minWidth: '19px', height: '19px', borderRadius: '99px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: Groupes ─── */}
        {mainTab === 'groupes' && (
          <>
            {groupsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ width: '28px', height: '28px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : groups.length === 0 ? (
              <GhostCard
                icon={<Users size={32} color={colors.violet.primary} />}
                title="Aucun groupe créé"
                description="Créez un groupe pour envoyer un message à plusieurs personnes en une seule fois."
                cta="Nouveau groupe"
                onAction={() => setShowCreateGroup(true)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groups.map((g, i) => (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--card-bg)' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: `${colors.violet.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={20} color={colors.violet.primary} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{g.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {g.memberCount} membre{g.memberCount !== 1 ? 's' : ''}
                          {g.events?.title && <> · {g.events.title}</>}
                        </div>
                      </div>
                      <button onClick={() => { setBroadcastGroup(g); setBroadcastDone(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: 'pointer', flexShrink: 0 }}>
                        <Send size={12} />
                        Envoyer
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: Fils d'actu ─── */}
        {mainTab === 'actu' && (
          <>
            {actuLoading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ width: '28px', height: '28px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : actu.length === 0 ? (
              <GhostCard
                icon={<Bell size={32} color={colors.violet.primary} />}
                title="Aucune activité"
                description="Vos notifications et mises à jour apparaîtront ici au fil du temps."
                cta="Explorer les événements"
                onAction={() => router.push('/events')}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {actu.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    {item.link ? (
                      <Link href={item.link} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '10px', textDecoration: 'none', backgroundColor: !item.read_at ? `${colors.violet.primary}0d` : 'var(--card-bg)', border: `1px solid ${!item.read_at ? `${colors.violet.primary}33` : 'var(--border-color)'}`, transition: 'all 150ms' }}>
                        <ActuDot read={!!item.read_at} />
                        <ActuContent item={item} />
                        <ChevronRight size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '2px' }} />
                      </Link>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '10px', backgroundColor: !item.read_at ? `${colors.violet.primary}0d` : 'var(--card-bg)', border: `1px solid ${!item.read_at ? `${colors.violet.primary}33` : 'var(--border-color)'}` }}>
                        <ActuDot read={!!item.read_at} />
                        <ActuContent item={item} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ─── Modal: Créer un groupe ─── */}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowCreateGroup(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>Nouveau groupe</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nom du groupe</label>
              <input
                type="text"
                placeholder="Ex : Exposants du Marché de Noël"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {orgEvents.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Lier à un événement (optionnel)</label>
                <select
                  value={newGroupEvent}
                  onChange={e => setNewGroupEvent(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Aucun événement</option>
                  {orgEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
            )}

            {newGroupEvent && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="auto-import" checked={newGroupAutoImport} onChange={e => setNewGroupAutoImport(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: colors.violet.primary }} />
                <label htmlFor="auto-import" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Importer automatiquement les exposants acceptés
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateGroup(false)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creatingGroup}
                style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: !newGroupName.trim() || creatingGroup ? 'not-allowed' : 'pointer', opacity: !newGroupName.trim() || creatingGroup ? 0.6 : 1 }}>
                {creatingGroup ? 'Création...' : 'Créer le groupe'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Modal: Broadcast ─── */}
      {broadcastGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setBroadcastGroup(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${colors.violet.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color={colors.violet.primary} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{broadcastGroup.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{broadcastGroup.memberCount} membre{broadcastGroup.memberCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {broadcastDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: `${colors.feedback.success.solid}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCheck size={22} color={colors.feedback.success.solid} />
                </div>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>Message envoyé</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Le message a été envoyé à tous les membres du groupe.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Message</label>
                  <textarea
                    placeholder="Écrivez votre message pour tous les membres..."
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    rows={5}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setBroadcastGroup(null)}
                    style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button onClick={handleBroadcast} disabled={!broadcastMsg.trim() || broadcasting}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: !broadcastMsg.trim() || broadcasting ? 'not-allowed' : 'pointer', opacity: !broadcastMsg.trim() || broadcasting ? 0.6 : 1 }}>
                    <Send size={13} />
                    {broadcasting ? 'Envoi...' : 'Envoyer à tous'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

function ActuDot({ read }: { read: boolean }) {
  return (
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: read ? colors.border.default : colors.violet.primary, flexShrink: 0, marginTop: '5px' }} />
  )
}

function ActuContent({ item }: { item: ActuItem }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.title}</div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>{item.body}</p>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.7 }}>{relativeTime(item.created_at)}</div>
    </div>
  )
}
