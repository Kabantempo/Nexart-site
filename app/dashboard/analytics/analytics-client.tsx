'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, Star, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'

interface CreatorStats {
  profileViews: number
  applicationsReceived: number
  acceptedCount: number
  rejectedCount: number
  averageRating: number
  reviewCount: number
  acceptanceRate: number
}

export default function CreatorAnalyticsClient() {
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCreatorStats()
  }, [])

  const fetchCreatorStats = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Vous devez être connecté pour voir vos statistiques.')
        return
      }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      let response: Response
      try {
        response = await fetch('/api/creator/analytics', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || `Erreur ${response.status}`)
      }
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Le chargement a pris trop de temps. Réessayez.')
      } else {
        setError(err.message || 'Erreur inconnue')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>⏳ Chargement...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: colors.feedback.danger.solid }}>
          ❌ {error}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: colors.text.secondary }}>
          Aucune donnée disponible pour le moment.
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '60px' }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Mes Statistiques
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Suivi de votre visibilité et vos candidatures
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '60px',
          }}
        >
          {/* Profile Views */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Vues de profil</h3>
              <Eye size={20} color={colors.violet.primary} />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: colors.violet.primary, marginBottom: '8px' }}>
              {stats.profileViews}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Cette année</p>
          </div>

          {/* Applications Received */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Candidatures</h3>
              <CheckCircle size={20} color={colors.green.primary} />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: colors.green.primary, marginBottom: '8px' }}>
              {stats.applicationsReceived}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {stats.acceptanceRate}% acceptées
            </p>
          </div>

          {/* Rating */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Note</h3>
              <Star size={20} color={colors.status.pending.dot} />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: colors.status.pending.dot, marginBottom: '8px' }}>
              {(stats.averageRating ?? 0).toFixed(1)}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {stats.reviewCount} avis
            </p>
          </div>

          {/* Accepted */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Acceptée</h3>
              <CheckCircle size={20} color={colors.green.primary} />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: colors.green.primary, marginBottom: '8px' }}>
              {stats.acceptedCount}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Marchés confirmés
            </p>
          </div>
        </motion.div>

        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: colors.violet.primary,
              color: colors.bg.primary,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.purple.indigo
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.violet.primary
            }}
          >
            <Download size={16} />
            Exporter CV
          </button>
        </motion.div>
      </div>
    </div>
  )
}
