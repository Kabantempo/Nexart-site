'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Check, X, ArrowUp, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WaitlistEntry {
  id: string
  position: number
  creator_id: string
  status: 'waiting' | 'promoted' | 'cancelled'
  created_at: string
  profiles?: { full_name: string; email: string; avatar_url?: string }
}

export default function WaitlistClient({ eventId }: { eventId: string }) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchWaitlist()
  }, [eventId])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchWaitlist = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setEntries(data.waitlist || [])
    } catch (err) {
      console.error('Error fetching waitlist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (entryId: string) => {
    try {
      setActionLoading(entryId)
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ waitlist_id: entryId, action: 'promote' })
      })
      if (res.ok) fetchWaitlist()
    } catch (err) {
      console.error('Error promoting:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (entryId: string) => {
    if (!confirm('Retirer cette personne de la liste d\'attente ?')) return
    try {
      setActionLoading(entryId)
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/waitlist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ waitlist_id: entryId })
      })
      if (res.ok) fetchWaitlist()
    } catch (err) {
      console.error('Error cancelling:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const waiting = entries.filter(e => e.status === 'waiting')
  const promoted = entries.filter(e => e.status === 'promoted')

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Liste d&apos;attente
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            Gérez les candidats en attente d&apos;une place libérée
          </p>
        </motion.div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 80px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'En attente', value: waiting.length, icon: <Clock size={20} color="#FF6B6B" />, color: '#FF6B6B' },
            { label: 'Promus', value: promoted.length, icon: <Check size={20} color="#10B981" />, color: '#10B981' },
            { label: 'Total', value: entries.length, icon: <Users size={20} color="#6366F1" />, color: '#6366F1' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <div style={{ padding: '10px', backgroundColor: stat.color + '15', borderRadius: '8px' }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Chargement...</div>
        ) : waiting.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 16px', border: '1px solid var(--border-color)', borderRadius: '12px' }}
          >
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Aucun candidat en liste d&apos;attente</p>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Les candidats apparaîtront ici quand l&apos;événement sera complet
            </p>
          </motion.div>
        ) : (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Candidats en attente ({waiting.length})
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                Ordre FIFO — les plus anciens en premier
              </p>
            </div>

            {waiting.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: idx < waiting.length - 1 ? '1px solid var(--border-color)' : 'none',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                {/* Position badge */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: entry.position === 1 ? '#6366F1' : 'var(--bg-secondary)',
                  color: entry.position === 1 ? '#FFFFFF' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {entry.position}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                  backgroundImage: entry.profiles?.avatar_url ? `url(${entry.profiles.avatar_url})` : 'none',
                  backgroundSize: 'cover',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#6366F1'
                }}>
                  {!entry.profiles?.avatar_url && (entry.profiles?.full_name?.[0] || '?')}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '15px' }}>
                    {entry.profiles?.full_name || 'Utilisateur inconnu'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {entry.profiles?.email || '—'} · En attente depuis {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handlePromote(entry.id)}
                    disabled={actionLoading === entry.id}
                    title="Promouvoir — accepter ce candidat"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: actionLoading === entry.id ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === entry.id ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    <ArrowUp size={14} />
                    Promouvoir
                  </button>
                  <button
                    onClick={() => handleCancel(entry.id)}
                    disabled={actionLoading === entry.id}
                    title="Retirer de la liste"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#FF6B6B',
                      border: '1px solid #FECACA',
                      borderRadius: '6px',
                      cursor: actionLoading === entry.id ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === entry.id ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Promoted section */}
        {promoted.length > 0 && (
          <div style={{ marginTop: '40px', border: '1px solid #D1FAE5', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#ECFDF5', padding: '16px 20px', borderBottom: '1px solid #D1FAE5' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#065F46', margin: 0 }}>
                Promus récemment ({promoted.length})
              </h2>
            </div>
            {promoted.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '14px 20px',
                  borderBottom: idx < promoted.length - 1 ? '1px solid #D1FAE5' : 'none',
                  backgroundColor: '#F0FDF4'
                }}
              >
                <Check size={16} color="#10B981" />
                <p style={{ fontWeight: 500, color: '#065F46', margin: 0, flex: 1 }}>
                  {entry.profiles?.full_name || 'Utilisateur inconnu'}
                </p>
                <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                  Promu le {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
