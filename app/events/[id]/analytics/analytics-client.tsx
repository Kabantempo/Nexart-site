'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, CheckCircle, Clock, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'

interface EventStats {
  totalApplications: number
  acceptedCount: number
  pendingCount: number
  refusedCount: number
  fillRate: number
  totalStands: number
  acceptanceRate: number
}

export default function AnalyticsClient({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchEventStats() }, [eventId])

  const fetchEventStats = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch(`/api/events/${eventId}/analytics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Erreur chargement stats')
      setStats(await response.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chargement...</span>
    </div>
  )

  if (error) return (
    <div style={{ padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <span style={{ fontSize: 13, color: colors.feedback.danger.solid }}>{error}</span>
    </div>
  )

  if (!stats) return null

  const fillColor = stats.fillRate >= 80
    ? colors.feedback.success.text
    : stats.fillRate >= 50
    ? '#F59E0B'
    : colors.violet.primary

  const pct = (n: number) =>
    stats.totalApplications > 0 ? Math.round((n / stats.totalApplications) * 100) : 0

  return (
    <div style={{ padding: '24px' }}>

      {/* Bento grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'auto auto', gap: 10, marginBottom: 20 }}
      >
        {/* Big: taux de remplissage */}
        <div style={{ gridColumn: '1 / 4', gridRow: '1 / 3', padding: 28, borderRadius: 16, backgroundColor: colors.violet.primary, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px 1px, transparent 1px 10px)', pointerEvents: 'none' }} />
          <div>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Remplissage</span>
            <p style={{ fontSize: 64, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>{stats.fillRate}%</p>
          </div>
          <div>
            <div style={{ width: '100%', height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${stats.fillRate}%`, borderRadius: 99, backgroundColor: '#fff', transition: 'width 0.6s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{stats.acceptedCount} / {stats.totalStands} stands occupés</p>
          </div>
        </div>

        {/* Total candidatures */}
        <div style={{ gridColumn: '4 / 7', gridRow: '1 / 2', padding: '20px 24px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Candidatures</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{stats.totalApplications}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.violet.primary }}>{stats.acceptanceRate}%</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>taux d'acceptation</span>
          </div>
        </div>

        {/* Confirmées */}
        <div style={{ gridColumn: '4 / 5', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: colors.feedback.success.text, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Confirmées</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.acceptedCount}</p>
        </div>

        {/* En attente */}
        <div style={{ gridColumn: '5 / 6', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>En attente</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.pendingCount}</p>
        </div>

        {/* Refusées */}
        <div style={{ gridColumn: '6 / 7', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: colors.feedback.danger.solid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Refusées</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats.refusedCount}</p>
        </div>
      </motion.div>

      {/* Répartition */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ padding: '20px 24px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', margin: '0 0 16px' }}>Répartition des candidatures</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Confirmées', count: stats.acceptedCount, color: colors.feedback.success.border ?? '#22C55E' },
            { label: 'En attente', count: stats.pendingCount, color: '#F59E0B' },
            { label: 'Refusées',   count: stats.refusedCount, color: colors.feedback.danger.solid },
          ].map(row => (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.count} <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>({pct(row.count)}%)</span></span>
              </div>
              <div style={{ height: 6, borderRadius: 99, backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct(row.count)}%`, borderRadius: 99, backgroundColor: row.color, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
