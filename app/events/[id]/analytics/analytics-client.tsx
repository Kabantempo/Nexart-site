'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-react'

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
          <div style={{ fontSize: '24px' }}>⏳ Chargement...</div>
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
            Analytique Événement
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.6' }}>
            Suivi des candidatures et du remplissage de votre événement
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
              {stats.acceptedCount}/{stats.totalStands} places
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
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Candidatures</h3>
              <Users size={20} color='#10B981' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
              {stats.totalApplications}
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              {stats.acceptanceRate}% acceptées
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
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Confirmées</h3>
              <CheckCircle size={20} color='#059669' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#059669', marginBottom: '8px' }}>
              {stats.acceptedCount}
            </div>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Participants confirmés
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
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              Réponses attendues
            </p>
          </div>
        </motion.div>

        {/* Application Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            backgroundColor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '32px',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '24px' }}>
            Répartition des candidatures
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {/* Accepted Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Acceptées</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>
                  {stats.acceptedCount}
                </span>
              </div>
              <div style={{
                backgroundColor: '#E5E7EB',
                borderRadius: '8px',
                height: '8px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    backgroundColor: '#059669',
                    height: '100%',
                    width: `${stats.totalApplications > 0 ? (stats.acceptedCount / stats.totalApplications) * 100 : 0}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Pending Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>En attente</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#F59E0B' }}>
                  {stats.pendingCount}
                </span>
              </div>
              <div style={{
                backgroundColor: '#E5E7EB',
                borderRadius: '8px',
                height: '8px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    backgroundColor: '#F59E0B',
                    height: '100%',
                    width: `${stats.totalApplications > 0 ? (stats.pendingCount / stats.totalApplications) * 100 : 0}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Refused Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Refusées</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>
                  {stats.refusedCount}
                </span>
              </div>
              <div style={{
                backgroundColor: '#E5E7EB',
                borderRadius: '8px',
                height: '8px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    backgroundColor: '#DC2626',
                    height: '100%',
                    width: `${stats.totalApplications > 0 ? (stats.refusedCount / stats.totalApplications) * 100 : 0}%`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
