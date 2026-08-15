'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Plus, Send, Eye, Link as LinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  const [sending, setSending] = useState<string | null>(null)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [formData, setFormData] = useState({ title: '', subject: '', message: '' })

  useEffect(() => {
    fetchCampaigns()
  }, [eventId])

  
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`/api/events/${eventId}/campaigns`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
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
      const token = await getToken()
      const response = await fetch(`/api/events/${eventId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}
        >
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Campagnes Email
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
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
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {campaign.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Eye size={14} color='#6366F1' />
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Taux ouverture</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#6366F1' }}>
                      {campaign.openRate || 0}%
                    </p>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <LinkIcon size={14} color='#6366F1' />
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Taux clics</p>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#6366F1' }}>
                      {campaign.clickRate || 0}%
                    </p>
                  </div>
                </div>
              )}

              {campaign.status === 'draft' && (
                <button
                  onClick={async () => {
                    if (!confirm('Envoyer cette campagne à tous les exposants approuvés ?')) return
                    setSending(campaign.id)
                    try {
                      const token = await getToken()
                      const res = await fetch(`/api/events/${eventId}/campaigns`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ campaign_id: campaign.id }),
                      })
                      const data = await res.json()
                      if (res.ok) alert(`✅ ${data.sent} email${data.sent !== 1 ? 's' : ''} envoyé${data.sent !== 1 ? 's' : ''}`)
                      else alert(`❌ ${data.error}`)
                      await fetchCampaigns()
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setSending(null)
                    }
                  }}
                  disabled={sending === campaign.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: sending === campaign.id ? 'var(--text-tertiary)' : '#6366F1',
                    color: '#FFFFFF', border: 'none', borderRadius: '6px',
                    padding: '8px 12px', cursor: sending === campaign.id ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: '600',
                  }}
                >
                  <Send size={14} />
                  {sending === campaign.id ? 'Envoi...' : 'Envoyer'}
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
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Mail size={48} color='var(--text-tertiary)' style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
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
                backgroundColor: 'var(--bg-primary)',
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
                    border: '1px solid var(--border-color)',
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
                    border: '1px solid var(--border-color)',
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
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '12px' }}>
                <button
                  onClick={() => setShowNewCampaign(false)}
                  style={{
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
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
