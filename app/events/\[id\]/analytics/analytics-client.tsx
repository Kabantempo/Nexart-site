'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react'

interface EventStats {
  standCount: number
  applicationsCount: number
  acceptedCount: number
  pendingCount: number
  refusedCount: number
  fillRate: number
  creatorDiversity: number
}

export default function EventAnalyticsClient({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEventStats()
  }, [eventId])

  const fetchEventStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/analytics`)
      if (!response.ok) throw new Error('Erreur chargement stats')
      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳ Chargement...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#DC2626' }}>
          ❌ {error}
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '60px' }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
            Analytiques Événement
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.6' }}>
            Vue d'ensemble des candidatures et statistiques
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
          {/* Fill Rate */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Taux de remplissage</h3>
              <TrendingUp size={20} color='#6366F1' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#6366F1', marginBottom: '8px' }}>
              {stats.fillRate}%
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              {stats.applicationsCount} / {stats.standCount} stands
            </p>
          </div>

          {/* Total Applications */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Total candidatures</h3>
              <Users size={20} color='#10B981' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
              {stats.applicationsCount}
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Créateurs différents: {stats.creatorDiversity}
            </p>
          </div>

          {/* Accepted */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Acceptées</h3>
              <CheckCircle size={20} color='#10B981' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
              {stats.acceptedCount}
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              {stats.applicationsCount > 0 ? Math.round((stats.acceptedCount / stats.applicationsCount) * 100) : 0}%
            </p>
          </div>

          {/* Pending */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>En attente</h3>
              <Clock size={20} color='#F59E0B' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#F59E0B', marginBottom: '8px' }}>
              {stats.pendingCount}
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>À traiter</p>
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
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4F46E5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1'
            }}
          >
            <Download size={16} />
            Exporter CSV
          </button>
        </motion.div>
      </div>
    </div>
  )
}
