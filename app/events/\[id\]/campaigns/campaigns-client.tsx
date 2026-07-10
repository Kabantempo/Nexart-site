'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mail, BarChart3, Plus, Edit2 } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  subject: string
  recipientCount: number
  sentAt?: string
  openRate: number
  clickRate: number
  status: 'draft' | 'sent' | 'scheduled'
}

export default function EmailCampaignsClient({ eventId }: { eventId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
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
    if (!formData.title || !formData.subject) {
      alert('Remplir titre et sujet')
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
      setShowNewModal(false)
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
            <p style={{ fontSize: '18px', color: '#888888' }}>Communiquer avec vos créateurs</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
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

        {/* Campaign List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ display: 'grid', gap: '16px' }}
        >
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
              <Mail size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>Aucune campagne encore</p>
              <button
                onClick={() => setShowNewModal(true)}
                style={{
                  marginTop: '16px',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Créer une campagne
              </button>
            </div>
          ) : (
            campaigns.map((campaign, idx) => (
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
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                    {campaign.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#888888', marginBottom: '12px' }}>
                    {campaign.subject}
                  </p>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                    <span style={{ color: '#9CA3AF' }}>
                      <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {campaign.recipientCount} créateurs
                    </span>
                    {campaign.status === 'sent' && (
                      <>
                        <span style={{ color: '#6366F1' }}>
                          <BarChart3 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          {campaign.openRate}% ouvertes
                        </span>
                        <span style={{ color: '#10B981' }}>
                          {campaign.clickRate}% clics
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {campaign.status === 'draft' && (
                    <>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#E5E7EB',
                          color: '#1A1A1A',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        <Edit2 size={14} />
                        Modifier
                      </button>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
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
                    </>
                  )}
                  {campaign.status === 'sent' && (
                    <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '600' }}>
                      Envoyée le {new Date(campaign.sentAt!).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* New Campaign Modal */}
        {showNewModal && (
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
            onClick={() => setShowNewModal(false)}
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
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                Nouvelle Campagne
              </h2>

              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Titre (ex: Confirmation candidature)"
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
                  placeholder="Sujet email"
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
                  placeholder="Message (Markdown supporté)"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '150px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setShowNewModal(false)}
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
