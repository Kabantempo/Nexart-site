'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Copy, Mail, Megaphone, Calendar, Database, Euro, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const FR_MEDIA_DB: MediaContact[] = [
  { name: 'Ouest-France', email: 'redaction@ouest-france.fr', type: 'Presse régionale' },
  { name: 'Le Télégramme', email: 'redaction@letelegramme.fr', type: 'Presse régionale' },
  { name: 'La Voix du Nord', email: 'redaction@lavoixdunord.fr', type: 'Presse régionale' },
  { name: 'Le Progrès (Lyon)', email: 'redaction@leprogres.fr', type: 'Presse régionale' },
  { name: 'La Dépêche du Midi', email: 'redaction@ladepeche.fr', type: 'Presse régionale' },
  { name: 'Sud Ouest', email: 'redaction@sudouest.fr', type: 'Presse régionale' },
  { name: 'Le Dauphiné Libéré', email: 'redaction@ledauphine.com', type: 'Presse régionale' },
  { name: 'France Bleu (radio locale)', email: 'francebleu@radiofrance.com', type: 'Radio' },
  { name: 'RCF Radio', email: 'contact@rcf.fr', type: 'Radio' },
  { name: 'Sortir à Paris', email: 'presse@sortiraparis.com', type: 'Agenda en ligne' },
  { name: 'Sortir à Lyon', email: 'contact@sortiralyons.com', type: 'Agenda en ligne' },
  { name: 'L\'Officiel des loisirs', email: 'redaction@officieldesloisirs.com', type: 'Agenda en ligne' },
]

const AD_PRICING = [
  { canal: 'Affichage 4x3 (semaine)', prix: '300 – 800 €', conseil: 'Idéal J-21 à J-7' },
  { canal: 'Spot radio local (30s × 10 diffusions)', prix: '200 – 600 €', conseil: 'Idéal J-30 à J-14' },
  { canal: 'Publicité cinéma local (semaine)', prix: '150 – 400 €', conseil: 'Idéal J-21 à J-7' },
  { canal: 'Encart presse régionale (1/4 page)', prix: '300 – 700 €', conseil: 'Idéal J-30 à J-14' },
  { canal: 'Boost Facebook/Instagram (budget)', prix: '50 – 300 €', conseil: 'Continu de J-60 à J-1' },
  { canal: 'Distribution flyers (1000 ex.)', prix: '80 – 200 €', conseil: 'Idéal J-14 à J-7' },
  { canal: 'Envoi communiqué presse (agence)', prix: '200 – 500 €', conseil: 'Idéal J-45' },
]

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
  const [activeTab, setActiveTab] = useState<'press' | 'media' | 'timeline' | 'pricing'>('press')
  const [eventDate, setEventDate] = useState<string | null>(null)
  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    fetchMarketingPlan()
    fetchEventDate()
  }, [eventId])

  const fetchEventDate = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch(`/api/events/${eventId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      const data = await res.json()
      if (data.event?.start_date) setEventDate(data.event.start_date)
    } catch { /* ignore */ }
  }

  const handleLoadFRMedia = () => {
    const existing = new Set(mediaContacts.map(c => c.email))
    const toAdd = FR_MEDIA_DB.filter(c => !existing.has(c.email))
    setMediaContacts(prev => [...prev, ...toAdd])
  }

  const generateRetroPlanning = () => {
    if (!eventDate) return
    const d = new Date(eventDate)
    const items: TimelineItem[] = [
      { date: offsetDate(d, -60), task: 'Lancer les publications sur les réseaux sociaux', status: 'pending' },
      { date: offsetDate(d, -45), task: 'Envoyer le communiqué de presse aux médias locaux', status: 'pending' },
      { date: offsetDate(d, -30), task: 'Lancer la campagne d\'affichage (commande impression)', status: 'pending' },
      { date: offsetDate(d, -30), task: 'Réserver les spots radio / cinéma', status: 'pending' },
      { date: offsetDate(d, -21), task: 'Poser les affiches et flyers en ville', status: 'pending' },
      { date: offsetDate(d, -21), task: 'Lancer le boost Facebook/Instagram', status: 'pending' },
      { date: offsetDate(d, -14), task: 'Relance presse et partenaires', status: 'pending' },
      { date: offsetDate(d, -14), task: 'Distribuer les flyers (marchés, commerces)', status: 'pending' },
      { date: offsetDate(d, -7), task: 'Rappel réseaux sociaux + story Instagram', status: 'pending' },
      { date: offsetDate(d, -3), task: 'Derniers rappels — "J-3 avant l\'événement !"', status: 'pending' },
      { date: offsetDate(d, -1), task: 'Post J-1 sur tous les canaux', status: 'pending' },
    ]
    setTimeline(prev => {
      const existingTasks = new Set(prev.map(i => i.task))
      return [...prev, ...items.filter(i => !existingTasks.has(i.task))]
    })
  }

  const offsetDate = (base: Date, days: number): string => {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
const fetchMarketingPlan = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/marketing`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
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
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/marketing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Suite Marketing
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
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
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            {[
              { id: 'press', label: 'Communiqué de presse', icon: Megaphone },
              { id: 'media', label: 'Contacts média', icon: Mail },
              { id: 'timeline', label: 'Calendrier', icon: Calendar },
              { id: 'pricing', label: 'Tarifs indicatifs', icon: Euro }
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
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
                Communiqué de Presse
              </h2>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Contenu du communiqué
                </label>
                <textarea
                  value={pressRelease}
                  onChange={(e) => setPressRelease(e.target.value)}
                  placeholder="Écrivez votre communiqué de presse ici..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '300px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  💡 Conseil: Incluez les informations essentielles (quoi, quand, où, pourquoi)
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  🚀 Génération automatique via Claude API disponible en v1.0.1
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
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Contacts Médias ({mediaContacts.length})
                </h2>
                <button
                  onClick={handleLoadFRMedia}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                >
                  <Database size={15} />
                  Importer médias France ({FR_MEDIA_DB.length})
                </button>
              </div>

              {/* Add Contact Form */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Ajouter un contact
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
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
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
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
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
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
                        border: '1px solid var(--border-color)',
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
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <Mail size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>Aucun contact média pour le moment</p>
                  </div>
                ) : (
                  mediaContacts.map((contact, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                          {contact.name}
                        </p>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                          {contact.email}
                        </p>
                        {contact.type && (
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
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

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Tarifs indicatifs com
              </h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>Fourchettes de prix moyens en France pour les canaux de communication événementielle.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {AD_PRICING.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: '16px', alignItems: 'center', padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.canal}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366F1' }}>{item.prix}</span>
                    <span style={{ fontSize: '13px', color: '#888' }}>{item.conseil}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>* Estimations moyennes France 2026 — les prix varient selon la région et le prestataire.</p>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Calendrier Marketing ({timeline.length})
                </h2>
                <button
                  onClick={generateRetroPlanning}
                  disabled={!eventDate}
                  title={!eventDate ? 'Date d\'événement non disponible' : 'Générer le rétro-planning depuis la date de l\'événement'}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: eventDate ? '#6366F1' : '#ccc', color: '#fff', border: 'none', borderRadius: '8px', cursor: eventDate ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 500 }}
                >
                  <Zap size={15} />
                  Générer rétro-planning
                </button>
              </div>

              {/* Add Timeline Item Form */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Ajouter une étape
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={newTimelineItem.date}
                      onChange={(e) => setNewTimelineItem({ ...newTimelineItem, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
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
                        border: '1px solid var(--border-color)',
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
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
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
                          border: '1px solid var(--border-color)',
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
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
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
