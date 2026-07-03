'use client'

import { useEvent, useApplication, useFavorites } from '@/lib/hooks'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Euro, Tag, Clock, ChevronRight, Heart, AlertTriangle } from 'lucide-react'
import { trackApplicationSubmit } from '@/lib/analytics'
import { useToast } from '@/components/ui/toast-provider'
import { ShareButtons } from '@/components/ui/share-buttons'

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
  const { application, applying, error: applyError, success, apply, acceptedCount } = useApplication(id, user?.id)
  const { favEventIds, toggleEventFav } = useFavorites(user?.id)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [profileChecked, setProfileChecked] = useState(false)

  const REQUIRED_FIELDS_TOTAL = 6

  useEffect(() => {
    if (success) toastSuccess('Candidature envoyée ! L\'organisateur vous répondra bientôt.')
  }, [success]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (applyError) toastError(applyError)
  }, [applyError]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || user.role !== 'creator') {
      setProfileChecked(true)
      return
    }
    const checkProfile = async () => {
      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('full_name, bio, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('creator_profiles').select('disciplines, city, travel_radius').eq('user_id', user.id).maybeSingle(),
      ])
      const missing: string[] = []
      if (!p?.full_name) missing.push('Nom complet')
      if (!p?.bio) missing.push('Bio')
      if (!p?.avatar_url) missing.push('Photo de profil')
      if (!cp?.disciplines?.length) missing.push('Disciplines')
      if (!cp?.city) missing.push('Ville')
      if (!cp?.travel_radius) missing.push('Rayon de déplacement')
      setMissingFields(missing)
      setProfileChecked(true)
    }
    checkProfile()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

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
      <style>{`
        @media (max-width: 768px) {
          .event-grid { grid-template-columns: 1fr !important; }
          .event-cover { height: 240px !important; }
          .event-title { font-size: 24px !important; }
          .event-sidebar { order: -1; }
        }
      `}</style>
      {/* Cover Image */}
      <div className="event-cover" style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: '#F5F5F7' }}>
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
          <h1 className="event-title" style={{ fontSize: '36px', fontWeight: '700', color: '#FFFFFF', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {event.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px 32px' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6366F1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
            Accueil
          </Link>
          <ChevronRight size={13} color="#D1D5DB" />
          <Link href="/events" style={{ color: '#9CA3AF', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6366F1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9CA3AF' }}>
            Événements
          </Link>
          <ChevronRight size={13} color="#D1D5DB" />
          <span style={{ color: '#1A1A1A', fontWeight: '600', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </span>
        </nav>

        <Link
          href="/events"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
        >
          <ArrowLeft size={16} />
          Retour aux événements
        </Link>

        <div className="event-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
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

              {/* Share + Favori */}
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#9CA3AF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Partager</p>
                  <ShareButtons url={`/events/${id}`} title={event.title} description={event.description?.substring(0, 120)} />
                </div>
                {user && (
                  <button
                    onClick={() => toggleEventFav(id)}
                    title={favEventIds.has(id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: favEventIds.has(id) ? '#FFF1F2' : '#F8FAFC',
                      color: favEventIds.has(id) ? '#BE123C' : '#64748B',
                      fontSize: '14px', fontWeight: '600', transition: 'all 200ms ease',
                      border: `1.5px solid ${favEventIds.has(id) ? '#FECDD3' : '#E2E8F0'}`,
                      marginTop: '28px',
                    }}
                  >
                    <Heart size={16} fill={favEventIds.has(id) ? '#E05A5A' : 'none'} color={favEventIds.has(id) ? '#E05A5A' : '#94A3B8'} />
                    {favEventIds.has(id) ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
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
          <div className="event-sidebar" style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '12px', borderRadius: '8px', backgroundColor: '#F9F9FF' }}>
                  <Euro size={20} color="#6366F1" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>Prix du stand</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#6366F1' }}>{event.stand_price}€</div>
                  </div>
                </div>
              )}

              {/* Stands occupancy */}
              {event.stand_count > 0 && acceptedCount !== null && (() => {
                const remaining = event.stand_count - acceptedCount
                const pct = Math.min(100, Math.round((acceptedCount / event.stand_count) * 100))
                const full = remaining <= 0
                return (
                  <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: full ? '#FEF2F2' : '#F9FAFB', border: `1px solid ${full ? '#FCA5A5' : '#E5E7EB'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                        {full ? 'Complet' : `${remaining} stand${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {acceptedCount}/{event.stand_count}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${pct}%`,
                        backgroundColor: pct >= 90 ? '#E05A5A' : pct >= 60 ? '#F59E0B' : '#10B981',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })()}

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
              ) : (user.role === 'creator' || user.role === 'artisan') && profileChecked && missingFields.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A' }}>Profil complété</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366F1' }}>
                        {REQUIRED_FIELDS_TOTAL - missingFields.length}/{REQUIRED_FIELDS_TOTAL}
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '99px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '99px',
                        width: `${((REQUIRED_FIELDS_TOTAL - missingFields.length) / REQUIRED_FIELDS_TOTAL) * 100}%`,
                        background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400E', margin: 0 }}>
                        Complétez votre profil avant de postuler
                      </p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {missingFields.map(f => (
                        <li key={f} style={{ fontSize: '12px', color: '#92400E', marginBottom: '2px' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/profile"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Compléter mon profil →
                  </Link>
                </div>
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
