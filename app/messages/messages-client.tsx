'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import {
  MessageCircle, Trash2, Palette, Building2, Eye, Search, CheckCheck, X,
  Users, Plus, Send, ChevronRight, Rss, UserPlus, UserMinus,
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
type MainTab = 'messages' | 'actu'

type Group = {
  id: string
  name: string
  event_id: string | null
  created_at: string
  memberCount: number
  events?: { title: string; slug?: string | null } | null
}

type GroupMember = {
  id: string
  user_id: string
  added_at: string
  profile: Profile | null
}

type FollowedUser = Profile & { followed_id: string }

type OrgEvent = { id: string; title: string; slug?: string | null }

type ActuEvent = { id: string; title: string; slug?: string | null; cover_image?: string | null }

type ActuPost = {
  id: string
  event_id: string
  author_id: string
  content: string
  created_at: string
  author: { id: string; full_name: string | null; avatar_url: string | null; role: string | null } | null
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
  const [groupsLoaded, setGroupsLoaded] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEvent, setNewGroupEvent] = useState('')
  const [orgEvents, setOrgEvents] = useState<OrgEvent[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [broadcastGroup, setBroadcastGroup] = useState<Group | null>(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastDone, setBroadcastDone] = useState(false)

  // Inline member search in create group modal
  const [groupMemberQuery, setGroupMemberQuery] = useState('')
  const [groupMemberResults, setGroupMemberResults] = useState<Profile[]>([])
  const [groupMemberSearching, setGroupMemberSearching] = useState(false)
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([])
  const groupMemberDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Members modal state
  const [membersGroup, setMembersGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [follows, setFollows] = useState<FollowedUser[]>([])
  const [addingUser, setAddingUser] = useState<string | null>(null)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  // Fils d'actu state
  const [actuEvents, setActuEvents] = useState<ActuEvent[]>([])
  const [actuEventsLoading, setActuEventsLoading] = useState(false)
  const [selectedActuEvent, setSelectedActuEvent] = useState<ActuEvent | null>(null)
  const [actuPosts, setActuPosts] = useState<ActuPost[]>([])
  const [actuPostsLoading, setActuPostsLoading] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [postSending, setPostSending] = useState(false)
  const actuScrollRef = useRef<HTMLDivElement>(null)

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
      setGroupsLoaded(true)
    }
  }, [])

  const loadActuEvents = useCallback(async (userId: string) => {
    setActuEventsLoading(true)
    // Events where user is organizer OR accepted applicant
    const [{ data: orgEvs }, { data: apps }] = await Promise.all([
      supabase.from('events').select('id, title, slug, cover_image').eq('organizer_id', userId).order('start_date', { ascending: false }),
      supabase.from('applications').select('event_id, events(id, title, slug, cover_image)')
        .eq('creator_id', userId).in('status', ['accepted', 'confirmed', 'awaiting_payment', 'paid']),
    ])
    const seen = new Set<string>()
    const all: ActuEvent[] = []
    for (const e of orgEvs ?? []) { if (!seen.has(e.id)) { seen.add(e.id); all.push(e) } }
    for (const a of apps ?? []) {
      const ev = (a as any).events
      if (ev && !seen.has(ev.id)) { seen.add(ev.id); all.push(ev) }
    }
    setActuEvents(all)
    setActuEventsLoading(false)
  }, [])

  const loadActuPosts = useCallback(async (eventId: string) => {
    setActuPostsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setActuPostsLoading(false); return }
    const res = await fetch(`/api/events/${eventId}/actu`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const { posts } = await res.json()
      setActuPosts(posts ?? [])
      setTimeout(() => { actuScrollRef.current?.scrollTo({ top: actuScrollRef.current.scrollHeight, behavior: 'instant' }) }, 50)
    }
    setActuPostsLoading(false)
  }, [])

  const sendPost = async () => {
    if (!newPost.trim() || !selectedActuEvent) return
    setPostSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setPostSending(false); return }
    const res = await fetch(`/api/events/${selectedActuEvent.id}/actu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ content: newPost.trim() }),
    })
    if (res.ok) {
      const { post } = await res.json()
      setActuPosts(prev => [...prev, post])
      setNewPost('')
      setTimeout(() => { actuScrollRef.current?.scrollTo({ top: actuScrollRef.current.scrollHeight, behavior: 'smooth' }) }, 50)
    }
    setPostSending(false)
  }

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
      loadActuEvents(session.user.id)
      loadGroups()
    })
  }, [router, loadConversations, loadOrgEvents, loadActuEvents, loadGroups])

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

  const searchGroupUsers = (q: string) => {
    setGroupMemberQuery(q)
    if (groupMemberDebounce.current) clearTimeout(groupMemberDebounce.current)
    const trimmed = q.startsWith('@') ? q.slice(1) : q
    if (trimmed.length < 2) { setGroupMemberResults([]); return }
    setGroupMemberSearching(true)
    groupMemberDebounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .ilike('full_name', `%${trimmed}%`)
        .limit(8)
      setGroupMemberResults((data ?? []) as Profile[])
      setGroupMemberSearching(false)
    }, 300)
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
        body: JSON.stringify({ name: newGroupName.trim(), event_id: newGroupEvent || null }),
      })
      if (res.ok) {
        const { group: created } = await res.json()
        if (created && pendingMembers.length > 0) {
          await Promise.all(pendingMembers.map(m =>
            fetch(`/api/messages/groups/${created.id}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ user_id: m.id }),
            })
          ))
        }
        setShowCreateGroup(false)
        setNewGroupName('')
        setNewGroupEvent('')
        setGroupMemberQuery('')
        setGroupMemberResults([])
        setPendingMembers([])
        setGroupsLoaded(false)
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

  const openMembersModal = async (g: Group) => {
    setMembersGroup(g)
    setMemberSearch('')
    setMembersLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setMembersLoading(false); return }
    const token = session.access_token

    const [membersRes, followsData] = await Promise.all([
      fetch(`/api/messages/groups/${g.id}/members`, { headers: { Authorization: `Bearer ${token}` } }),
      supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', session.user.id)
        .limit(100),
    ])

    if (membersRes.ok) {
      const { members: m } = await membersRes.json()
      setMembers(m ?? [])
    }

    const followedIds = (followsData.data ?? []).map((f: any) => f.followed_id)
    if (followedIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', followedIds)
      setFollows((profiles ?? []).map((p: any) => ({ ...p, followed_id: p.id })) as FollowedUser[])
    } else {
      setFollows([])
    }
    setMembersLoading(false)
  }

  const addMember = async (userId: string) => {
    if (!membersGroup) return
    setAddingUser(userId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setAddingUser(null); return }
    const res = await fetch(`/api/messages/groups/${membersGroup.id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      const { member } = await res.json()
      setMembers(prev => [...prev, member])
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? { ...g, memberCount: g.memberCount + 1 } : g))
    }
    setAddingUser(null)
  }

  const removeMember = async (userId: string) => {
    if (!membersGroup) return
    setRemovingUser(userId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setRemovingUser(null); return }
    await fetch(`/api/messages/groups/${membersGroup.id}/members?user_id=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setMembers(prev => prev.filter(m => m.user_id !== userId))
    setGroups(prev => prev.map(g => g.id === membersGroup.id ? { ...g, memberCount: Math.max(0, g.memberCount - 1) } : g))
    setRemovingUser(null)
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
          {mainTab === 'messages' && (orgEvents.length > 0 || groups.length > 0) && (
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
            {totalUnread > 0 && <span style={{ minWidth: '18px', height: '18px', borderRadius: '99px', backgroundColor: mainTab === 'messages' ? 'rgba(255,255,255,0.3)' : colors.violet.primary, color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{totalUnread}</span>}
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
            {/* Groups section inside messages tab */}
            {(groups.length > 0 || orgEvents.length > 0) && (
              <div style={{ marginTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: colors.border.default }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={11} />
                    Groupes
                  </span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: colors.border.default }} />
                </div>
                {groupsLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px' }}>
                    <div style={{ width: '24px', height: '24px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 24px', borderRadius: '12px', border: `1px dashed ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>Aucun groupe pour l&apos;instant.</p>
                    <button onClick={() => setShowCreateGroup(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: 'pointer' }}>
                      <Plus size={12} />
                      Créer un groupe
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {groups.map((g, i) => (
                      <motion.div key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--card-bg)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${colors.violet.primary}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={18} color={colors.violet.primary} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1px' }}>{g.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {g.memberCount} membre{g.memberCount !== 1 ? 's' : ''}
                              {g.events?.title && <> · {g.events.title}</>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            <button onClick={() => openMembersModal(g)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                              <UserPlus size={12} />
                              Membres
                            </button>
                            <button onClick={() => { setBroadcastGroup(g); setBroadcastDone(false) }}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: 'pointer' }}>
                              <Send size={12} />
                              Envoyer
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── TAB: Fils d'actu ─── */}
        {mainTab === 'actu' && (
          <>
            {/* Event thread view */}
            {selectedActuEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <button onClick={() => { setSelectedActuEvent(null); setActuPosts([]) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', padding: '4px 0' }}>
                    <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                    Retour
                  </button>
                  <span style={{ color: 'var(--border-color)' }}>·</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedActuEvent.title}</span>
                </div>

                {/* Posts feed */}
                <div ref={actuScrollRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '55vh', paddingBottom: '4px', scrollbarWidth: 'thin' }}>
                  {actuPostsLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                      <div style={{ width: '24px', height: '24px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    </div>
                  ) : actuPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '12px', border: `1px dashed ${colors.border.default}` }}>
                      <Rss size={28} color={colors.violet.primary} style={{ margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px' }}>Aucun message pour l&apos;instant</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Soyez le premier à poster une mise à jour.</p>
                    </div>
                  ) : (
                    actuPosts.map((post, i) => {
                      const isMe = post.author_id === user?.id
                      return (
                        <motion.div key={post.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                          <Avatar profile={post.author} size={34} />
                          <div style={{ maxWidth: '72%' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                              {post.author?.full_name ?? 'Utilisateur'} · {relativeTime(post.created_at)}
                            </div>
                            <div style={{ padding: '10px 14px', borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px', backgroundColor: isMe ? colors.violet.primary : 'var(--bg-secondary)', color: isMe ? '#fff' : 'var(--text-primary)', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                              {post.content}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Compose */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', paddingTop: '12px', marginTop: '8px', borderTop: `1px solid ${colors.border.default}` }}>
                  <textarea
                    placeholder="Écrire un message..."
                    value={newPost}
                    onChange={e => setNewPost(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPost() } }}
                    rows={2}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                  <button onClick={sendPost} disabled={!newPost.trim() || postSending}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', backgroundColor: !newPost.trim() || postSending ? colors.border.default : colors.violet.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !newPost.trim() || postSending ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'background 150ms' }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Events list */
              actuEventsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ width: '28px', height: '28px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                </div>
              ) : actuEvents.length === 0 ? (
                <GhostCard
                  icon={<Rss size={32} color={colors.violet.primary} />}
                  title="Aucun événement actif"
                  description="Les fils d'actu apparaissent pour les événements dont vous êtes organisateur ou exposant accepté."
                  cta="Explorer les événements"
                  onAction={() => router.push('/events')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {actuEvents.map((ev, i) => (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <button onClick={() => { setSelectedActuEvent(ev); loadActuPosts(ev.id) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--card-bg)', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${colors.violet.primary}18`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {ev.cover_image ? (
                            <Image src={ev.cover_image} alt="" width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          ) : (
                            <Rss size={20} color={colors.violet.primary} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fil d&apos;actualité de l&apos;événement</div>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </motion.div>

      {/* ─── Modal: Créer un groupe ─── */}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => { setShowCreateGroup(false); setGroupMemberQuery(''); setGroupMemberResults([]); setPendingMembers([]) }}>
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

            {/* Member search */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ajouter des membres</label>
              {pendingMembers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {pendingMembers.map(m => (
                    <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px 4px 6px', borderRadius: '99px', backgroundColor: `${colors.violet.primary}18`, fontSize: '12px', fontWeight: '600', color: colors.violet.primary }}>
                      <Avatar profile={m} size={18} />
                      {m.full_name ?? 'Utilisateur'}
                      <button onClick={() => setPendingMembers(prev => prev.filter(p => p.id !== m.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.violet.primary, display: 'flex', alignItems: 'center', padding: 0, marginLeft: '2px' }}>
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="@nom de la personne..."
                  value={groupMemberQuery}
                  onChange={e => searchGroupUsers(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }}
                />
                {(groupMemberResults.length > 0 || groupMemberSearching) && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden' }}>
                    {groupMemberSearching ? (
                      <div style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ width: '18px', height: '18px', border: `2px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                      </div>
                    ) : (
                      groupMemberResults
                        .filter(r => !pendingMembers.some(p => p.id === r.id))
                        .map(r => (
                          <button key={r.id} onClick={() => { setPendingMembers(prev => [...prev, r]); setGroupMemberQuery(''); setGroupMemberResults([]) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <Avatar profile={r} size={30} />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.full_name ?? 'Utilisateur'}</span>
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
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

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCreateGroup(false); setGroupMemberQuery(''); setGroupMemberResults([]); setPendingMembers([]) }}
                style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creatingGroup}
                style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: !newGroupName.trim() || creatingGroup ? 'not-allowed' : 'pointer', opacity: !newGroupName.trim() || creatingGroup ? 0.6 : 1 }}>
                {creatingGroup ? 'Création...' : pendingMembers.length > 0 ? `Créer avec ${pendingMembers.length} membre${pendingMembers.length > 1 ? 's' : ''}` : 'Créer le groupe'}
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

      {/* ─── Modal: Membres d'un groupe ─── */}
      {membersGroup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setMembersGroup(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{membersGroup.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{members.length} membre{members.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setMembersGroup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            {membersLoading ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ width: '24px', height: '24px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {members.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Membres actuels</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {members.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                          <Avatar profile={m.profile} size={32} />
                          <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{m.profile?.full_name ?? 'Utilisateur'}</span>
                          <button onClick={() => removeMember(m.user_id)} disabled={removingUser === m.user_id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.feedback.danger.solid, opacity: removingUser === m.user_id ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                            <UserMinus size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {follows.length > 0 && (() => {
                  const memberIds = new Set(members.map(m => m.user_id))
                  const filtered = follows.filter(f => {
                    if (memberIds.has(f.id)) return false
                    if (!memberSearch.trim()) return true
                    return f.full_name?.toLowerCase().includes(memberSearch.toLowerCase())
                  })
                  return (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Ajouter depuis mes abonnements</div>
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                        <input type="text" placeholder="Rechercher..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                          style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      {filtered.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px 0' }}>Aucun résultat</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {filtered.map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                              <Avatar profile={f} size={32} />
                              <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{f.full_name ?? 'Utilisateur'}</span>
                              <button onClick={() => addMember(f.id)} disabled={addingUser === f.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', color: '#fff', backgroundColor: colors.violet.primary, cursor: addingUser === f.id ? 'not-allowed' : 'pointer', opacity: addingUser === f.id ? 0.5 : 1 }}>
                                <UserPlus size={12} />
                                {addingUser === f.id ? '...' : 'Ajouter'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {follows.length === 0 && members.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '24px 0' }}>
                    Suivez des personnes pour pouvoir les ajouter à un groupe.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

