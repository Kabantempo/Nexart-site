'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, Star, Download } from 'lucide-react'

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
      const response = await fetch('/api/creator/analytics')
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
            Mes Statistiques
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', lineHeight: '1.6' }}>
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
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Vues de profil</h3>
              <Eye size={20} color='#6366F1' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#6366F1', marginBottom: '8px' }}>
              {stats.profileViews}
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>Cette année</p>
          </div>

          {/* Applications Received */}
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
              <CheckCircle size={20} color='#10B981' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
              {stats.applicationsReceived}
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              {stats.acceptanceRate}% acceptées
            </p>
          </div>

          {/* Rating */}
          <div
            style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Note</h3>
              <Star size={20} color='#F59E0B' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#F59E0B', marginBottom: '8px' }}>
              {stats.averageRating.toFixed(1)}
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              {stats.reviewCount} avis
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
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>Acceptée</h3>
              <CheckCircle size={20} color='#10B981' />
            </div>
            <div style={{ fontSize: '42px', fontWeight: 700, color: '#10B981', marginBottom: '8px' }}>
              {stats.acceptedCount}
            </div>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
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
            Exporter CV
          </button>
        </motion.div>
      </div>
    </div>
  )
}
