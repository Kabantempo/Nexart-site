'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Crown, Search, X, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import Image from 'next/image'

interface TeamMember {
  id: string
  user_id: string
  role: 'organizer' | 'co_organizer' | 'volunteer'
  joinedAt: string
  profile: {
    username: string | null
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ProfileResult {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
  organizer:    'Organisateur',
  co_organizer: 'Co-organisateur',
  volunteer:    'Bénévole',
}

export default function TeamCollaborationClient({ eventId }: { eventId: string }) {
  const [members, setMembers]     = useState<TeamMember[]>([])
  const [loading, setLoading]     = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<ProfileResult[]>([])
  const [selected, setSelected]   = useState<ProfileResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting]   = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { fetchTeam() }, [eventId])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchProfiles(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const searchProfiles = async (q: string) => {
    setSearching(true)
    const clean = q.replace(/^@/, '')
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `${clean}%`)
      .limit(6) as { data: ProfileResult[] | null }
    setResults(data ?? [])
    setSearching(false)
  }

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/team`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error()
      const raw = await res.json()
      const mapped: TeamMember[] = (raw ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        role: r.role,
        joinedAt: r.joined_at,
        profile: r.profiles ?? null,
      }))
      setMembers(mapped)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  const handleInvite = async () => {
    if (!selected) return
    setInviting(true)
    setInviteError(null)
    try {
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ username: selected.username, role: 'co_organizer' }),
      })
      const json = await res.json()
      if (!res.ok) { setInviteError(json.error ?? 'Erreur invitation'); return }
      setShowInvite(false)
      setQuery('')
      setSelected(null)
      setResults([])
      await fetchTeam()
    } catch { setInviteError('Erreur réseau') }
    finally { setInviting(false) }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Retirer ce membre de l\'équipe ?')) return
    try {
      const token = await getToken()
      await fetch(`/api/events/${eventId}/team/${memberId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      await fetchTeam()
    } catch (err) { console.error(err) }
  }

  const Avatar = ({ profile, size = 36 }: { profile: TeamMember['profile']; size?: number }) => {
    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
    if (profile?.avatar_url) {
      return <Image src={profile.avatar_url} alt="" width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover', width: size, height: size, flexShrink: 0 }} />
    }
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: size * 0.33, fontWeight: 700, color: '#fff' }}>
        {initials}
      </div>
    )
  }

  if (loading) return (
    <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chargement...</span>
    </div>
  )

  return (
    <div style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Équipe
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            {members.length} membre{members.length !== 1 ? 's' : ''} — accès au dashboard de cet événement
          </p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteError(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: colors.violet.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Inviter
        </button>
      </div>

      {/* Invite panel */}
      {showInvite && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
          style={{ marginBottom: 16, padding: '16px', borderRadius: 12, border: `1px solid ${colors.violet.primary}`, backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Inviter par @username Nexart</span>
            <button onClick={() => { setShowInvite(false); setQuery(''); setSelected(null); setResults([]) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <span style={{ color: colors.violet.primary, fontWeight: 700, fontSize: 14 }}>@</span>
              <input
                autoFocus
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                placeholder="nom d'utilisateur"
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
              />
              {searching && <Search size={13} color='var(--text-secondary)' />}
            </div>

            {/* Dropdown results */}
            {results.length > 0 && !selected && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {results.map(p => (
                  <button key={p.id} onClick={() => { setSelected(p); setQuery(p.username ?? ''); setResults([]) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-secondary)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                    {p.avatar_url
                      ? <Image src={p.avatar_url} alt="" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover', width: 28, height: 28, flexShrink: 0 }} />
                      : <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#fff' }}>{p.full_name?.[0] ?? '?'}</div>
                    }
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.full_name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>@{p.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected profile preview */}
          {selected && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              {selected.avatar_url
                ? <Image src={selected.avatar_url} alt="" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover', width: 32, height: 32, flexShrink: 0 }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>{selected.full_name?.[0] ?? '?'}</div>
              }
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.full_name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)' }}>@{selected.username}</p>
              </div>
              <UserCheck size={16} color={colors.feedback.success.text} />
            </div>
          )}

          {inviteError && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: colors.feedback.danger.solid }}>{inviteError}</p>
          )}

          <button
            onClick={handleInvite}
            disabled={!selected || inviting}
            style={{ marginTop: 12, width: '100%', padding: '9px', borderRadius: 8, border: selected ? 'none' : '1px solid var(--border-color)', backgroundColor: selected ? colors.violet.primary : 'var(--bg-primary)', color: selected ? '#fff' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed' }}>
            {inviting ? 'Invitation...' : 'Ajouter à l\'équipe'}
          </button>
        </motion.div>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
          <Users size={24} color='var(--text-secondary)' style={{ marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Aucun membre dans l'équipe</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', opacity: 0.7 }}>Invitez des collaborateurs par @username Nexart</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m, i) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <Avatar profile={m.profile} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.profile?.full_name ?? 'Utilisateur'}
                  </span>
                  {m.role === 'organizer' && <Crown size={12} color={colors.status?.pending?.dot ?? '#F59E0B'} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {m.profile?.username && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>@{m.profile.username}</span>
                  )}
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </div>
              </div>
              {m.role !== 'organizer' && (
                <button onClick={() => handleRemove(m.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', color: colors.feedback.danger.solid, flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
