'use client'

import { useEvent, useApplication } from '@/lib/hooks'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Euro, Tag, Clock } from 'lucide-react'
import { trackApplicationSubmit } from '@/lib/analytics'

interface Props {
  id: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  seasonal: 'Saisonnier',
  popup: 'Pop-up',
  salon: 'Salon',
  fair: 'Foire',
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#FF9800', bg: '#FFF8E1' },
  accepted: { label: 'Acceptée ✓', color: '#4CAF50', bg: '#E8F5E9' },
  refused: { label: 'Refusée', color: '#E05A5A', bg: '#FEF2F2' },
}

export function EventDetailClient({ id }: Props) {
  const { event, loading, error } = useEvent(id)
  const user = useAuthStore((s) => s.user)
  const { application, applying, error: applyError, success, apply } = useApplication(id, user?.id)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  if (loading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888', fontSize: '16px' }}>Chargement...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Événement introuvable</p>
        <Link href="/events" style={{ color: '#6366F1', textDecoration: 'none', marginTop: '16px', display: 'block' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  const handleApply = async () => {
    await apply(message)
    trackApplicationSubmit(id, user?.id)
    setShowForm(false)
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Cover Image */}
      <div style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: '#F5F5F7' }}>
        {event.cover_image ? (
          <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={80} color="rgba(255,255,255,0.5)" />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          {event.event_type && (
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
          )}
          <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#FFFFFF', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {event.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '32px 16px' }}>
        <Link
          href="/events"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
        >
          <ArrowLeft size={16} />
          Retour aux événements
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          {/* Main Content */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Info bars */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9FF' }}>
                {event.start_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>Date</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>
                        {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {event.end_date && event.end_date !== event.start_date && (
                          <> → {new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {(event.start_time || event.end_time) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>Horaires</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>
                        {event.start_time}{event.end_time ? ` — ${event.end_time}` : ''}
                      </div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>Lieu</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>
                        {event.location}
                      </div>
                    </div>
                  </div>
                )}
                {event.stand_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: '#888888' }}>Stands</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>
                        {event.stand_count} stands
                        {event.stand_dimensions ? ` · ${event.stand_dimensions}` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>Description</h2>
                  <p style={{ fontSize: '16px', color: '#555555', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {event.description}
                  </p>
                </div>
              )}

              {/* Disciplines */}
              {event.discipline_tags?.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
                    <Tag size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Disciplines recherchées
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {event.discipline_tags.map((tag: string) => (
                      <span key={tag} style={{ padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#F0F0FF', color: '#6366F1', fontSize: '14px', fontWeight: '500' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {event.rules && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>Règlement</h2>
                  <p style={{ fontSize: '15px', color: '#555555', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {event.rules}
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>
                Postuler à cet événement
              </h3>

              {/* Stand price */}
              {event.stand_price > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '12px', borderRadius: '8px', backgroundColor: '#F9F9FF' }}>
                  <Euro size={20} color="#6366F1" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>Prix du stand</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#6366F1' }}>{event.stand_price}€</div>
                  </div>
                </div>
              )}

              {/* Already applied */}
              {application ? (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: STATUS_STYLES[application.status]?.bg || '#F5F5F7',
                  border: `1px solid ${STATUS_STYLES[application.status]?.color || '#E5E7EB'}`,
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: STATUS_STYLES[application.status]?.color || '#888888', margin: 0 }}>
                    {STATUS_STYLES[application.status]?.label || application.status}
                  </p>
                  <p style={{ fontSize: '13px', color: '#888888', marginTop: '4px' }}>
                    Candidature envoyée le {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ) : success ? (
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#E8F5E9', border: '1px solid #4CAF50', textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#4CAF50', margin: 0 }}>
                    Candidature envoyée ✓
                  </p>
                  <p style={{ fontSize: '13px', color: '#888888', marginTop: '4px' }}>
                    L'organisateur vous répondra bientôt
                  </p>
                </div>
              ) : !user ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#888888', marginBottom: '16px', lineHeight: '1.6' }}>
                    Connectez-vous pour postuler à cet événement
                  </p>
                  <Link
                    href="/login"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '16px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #6366F1', color: '#6366F1', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box', marginTop: '12px' }}
                  >
                    Créer un compte
                  </Link>
                </div>
              ) : user.role === 'organizer' ? (
                <p style={{ fontSize: '14px', color: '#888888', textAlign: 'center' }}>
                  Seuls les créateurs peuvent postuler aux événements
                </p>
              ) : showForm ? (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>
                    Message à l'organisateur (optionnel)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Présentez-vous et votre activité..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                  />
                  {applyError && (
                    <p style={{ color: '#E05A5A', fontSize: '13px', marginBottom: '12px' }}>{applyError}</p>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: applying ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: applying ? 'not-allowed' : 'pointer', marginBottom: '8px' }}
                  >
                    {applying ? 'Envoi...' : 'Envoyer ma candidature'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid #E5E7EB', color: '#888888', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 300ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5B5BD6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  Je m'inscris
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
