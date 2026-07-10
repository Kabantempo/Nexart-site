'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Copy, Mail, Share2, Megaphone, Calendar } from 'lucide-react'

interface MediaContact {
  name: string
  email: string
  type: string
}

interface TimelineItem {
  date: string
  task: string
  status: 'pending' | 'completed'
}

interface MarketingPlan {
  id: string
  press_release: string
  media_contacts: MediaContact[]
  deadlines_calendar: TimelineItem[]
  created_at: string
  updated_at: string
}

export default function MarketingClient({ eventId }: { eventId: string }) {
  const [plan, setPlan] = useState<MarketingPlan | null>(null)
  const [pressRelease, setPressRelease] = useState('')
  const [mediaContacts, setMediaContacts] = useState<MediaContact[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [newContact, setNewContact] = useState({ name: '', email: '', type: '' })
  const [newTimelineItem, setNewTimelineItem] = useState({ date: '', task: '' })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'press' | 'media' | 'timeline'>('press')

  useEffect(() => {
    fetchMarketingPlan()
  }, [eventId])

  const fetchMarketingPlan = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/marketing`)
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
        setPressRelease(data.plan.press_release || '')
        setMediaContacts(data.plan.media_contacts || [])
        setTimeline(data.plan.deadlines_calendar || [])
      }
    } catch (error) {
      console.error('Error fetching marketing plan:', error)
    }
  }

  const handleSavePressRelease = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          press_release: pressRelease,
          media_contacts: mediaContacts,
          deadlines_calendar: timeline
        })
      })

      if (res.ok) {
        fetchMarketingPlan()
      }
    } catch (error) {
      console.error('Error saving marketing plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.email.trim()) {
      alert('Veuillez remplir le nom et l\'email')
      return
    }

    const updated = [...mediaContacts, newContact]
    setMediaContacts(updated)
    setNewContact({ name: '', email: '', type: '' })
  }

  const handleDeleteContact = (index: number) => {
    const updated = mediaContacts.filter((_, i) => i !== index)
    setMediaContacts(updated)
  }

  const handleAddTimelineItem = () => {
    if (!newTimelineItem.date.trim() || !newTimelineItem.task.trim()) {
      alert('Veuillez remplir la date et la tâche')
      return
    }

    const updated = [...timeline, { ...newTimelineItem, status: 'pending' as const }]
    setTimeline(updated)
    setNewTimelineItem({ date: '', task: '' })
  }

  const handleToggleTimelineItem = (index: number) => {
    const updated = [...timeline]
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'pending' ? 'completed' : 'pending'
    }
    setTimeline(updated)
  }

  const handleDeleteTimelineItem = (index: number) => {
    const updated = timeline.filter((_, i) => i !== index)
    setTimeline(updated)
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Suite Marketing
          </h1>
          <p style={{ fontSize: '18px', color: '#888888' }}>
            Planifiez votre stratégie marketing et communiqué de presse
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px' }}>
            {[
              { id: 'press', label: 'Communiqué de presse', icon: Megaphone },
              { id: 'media', label: 'Contacts média', icon: Mail },
              { id: 'timeline', label: 'Calendrier', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #6366F1' : 'none',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#6366F1' : '#888888',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Press Release Tab */}
          {activeTab === 'press' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
                Communiqué de Presse
              </h2>

              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#1A1A1A' }}>
                  Contenu du communiqué
                </label>
                <textarea
                  value={pressRelease}
                  onChange={(e) => setPressRelease(e.target.value)}
                  placeholder="Écrivez votre communiqué de presse ici..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '300px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                  Conseil: Incluez les informations essentielles (quoi, quand, où, pourquoi)
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSavePressRelease}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontWeight: 500
                  }}
                >
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pressRelease)
                    alert('Copié!')
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#F9FAFB',
                    color: '#1A1A1A',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <Copy size={16} />
                  Copier
                </button>
              </div>
            </div>
          )}

          {/* Media Contacts Tab */}
          {activeTab === 'media' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
                Contacts Médias ({mediaContacts.length})
              </h2>

              {/* Add Contact Form */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', marginBottom: '32px', backgroundColor: '#F9FAFB' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                  Ajouter un contact
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#1A1A1A' }}>
                      Nom
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Nom du contact"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#1A1A1A' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@exemple.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#1A1A1A' }}>
                      Type
                    </label>
                    <input
                      type="text"
                      value={newContact.type}
                      onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                      placeholder="Ex: Journalist, Influencer"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddContact}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>

              {/* Contacts List */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {mediaContacts.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <Mail size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>Aucun contact média pour le moment</p>
                  </div>
                ) : (
                  mediaContacts.map((contact, idx) => (
                    <div key={idx} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px 0' }}>
                          {contact.name}
                        </p>
                        <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 4px 0' }}>
                          {contact.email}
                        </p>
                        {contact.type && (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {contact.type}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteContact(idx)}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: '#FF6B6B',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
                Calendrier Marketing ({timeline.length})
              </h2>

              {/* Add Timeline Item Form */}
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', marginBottom: '32px', backgroundColor: '#F9FAFB' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                  Ajouter une étape
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#1A1A1A' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTimelineItem.date}
                      onChange={(e) => setNewTimelineItem({ ...newTimelineItem, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: '#1A1A1A' }}>
                      Tâche
                    </label>
                    <input
                      type="text"
                      value={newTimelineItem.task}
                      onChange={(e) => setNewTimelineItem({ ...newTimelineItem, task: e.target.value })}
                      placeholder="Ex: Envoyer communiqué de presse"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddTimelineItem}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>

              {/* Timeline List */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {timeline.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                    <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>Aucune étape prévue</p>
                  </div>
                ) : (
                  [...timeline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((item, idx) => {
                    const actualIdx = timeline.indexOf(item)
                    return (
                      <div
                        key={actualIdx}
                        style={{
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '16px',
                          backgroundColor: item.status === 'completed' ? '#F0FDF4' : '#FFFFFF',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          onChange={() => handleToggleTimelineItem(actualIdx)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />

                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: item.status === 'completed' ? '#9CA3AF' : '#1A1A1A',
                            margin: '0 0 4px 0',
                            textDecoration: item.status === 'completed' ? 'line-through' : 'none'
                          }}>
                            {item.task}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteTimelineItem(actualIdx)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#FF6B6B',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
