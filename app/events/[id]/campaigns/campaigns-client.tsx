'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Plus, Send, Eye, Link as LinkIcon } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  subject: string
  message: string
  status: 'draft' | 'sent'
  openRate?: number
  clickRate?: number
  sentAt?: string
}

export default function CampaignsClient({ eventId }: { eventId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [formData, setFormData] = useState({ title: '', subject: '', message: '' })

  useEffect(() => {
    fetchCampaigns()
  }, [eventId])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/campaigns`)
      if (!response.ok) throw new Error('Erreur chargement')
      const data = await response.json()
      setCampaigns(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!formData.title || !formData.subject || !formData.message) {
      alert('Tous les champs requis')
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, eventId }),
      })
      if (!response.ok) throw new Error('Erreur création')

      setFormData({ title: '', subject: '', message: '' })
      setShowNewCampaign(false)
      await fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}
        >
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px' }}>
              Campagnes Email
            </h1>
            <p style={{ fontSize: '18px', color: '#888888' }}>
              {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
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
              fontWeight: '600',
            }}
          >
            <Plus size={16} />
            Nouvelle Campagne
          </button>
        </motion.div>

        {/* Campaigns List */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {campaigns.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                    {campaign.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#888888' }}>
                    Sujet: {campaign.subject}
                  </p>
                </div>
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: campaign.status === 'sent' ? '#ECFDF5' : '#FEF3C7',
                    color: campaign.status === 'sent' ? '#166534' : '#92400E',
                  }}
                >
                  {campaign.status === 'sent' ? '✉️ Envoyée' : '📝 Brouillon'}
                </span>
              </div>

              {campaign.status === 'sent' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Eye size={14} color='#6366F1' />
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Taux ouverture</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#6366F1' }}>
                      {campaign.openRate || 0}%
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#FFFFFF', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <LinkIcon size={14} color='#6366F1' />
                      <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Taux clics</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#6366F1' }}>
                      {campaign.clickRate || 0}%
                    </p>
                  </div>
                </div>
              )}

              {campaign.status === 'draft' && (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                  }}
                >
                  <Send size={14} />
                  Envoyer
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {campaigns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              textAlign: 'center',
              padding: '60px 16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Mail size={48} color='#9CA3AF' style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', color: '#888888' }}>
              Aucune campagne. Créez-en une pour communiquer avec vos créateurs!
            </p>
          </motion.div>
        )}

        {/* New Campaign Modal */}
        {showNewCampaign && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowNewCampaign(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                Nouvelle Campagne Email
              </h2>

              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Titre de la campagne"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Sujet de l'email"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <textarea
                  placeholder="Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setShowNewCampaign(false)}
                  style={{
                    backgroundColor: '#E5E7EB',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateCampaign}
                  style={{
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Créer Brouillon
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
