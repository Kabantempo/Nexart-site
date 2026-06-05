'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Application, Event } from '@/lib/types'
import { Calendar, Users, CheckCircle, Clock, X, ArrowRight, LogOut, MessageSquare } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: '#FF9800', bg: '#FFF8E1', icon: <Clock size={14} /> },
  accepted: { label: 'Acceptée', color: '#4CAF50', bg: '#E8F5E9', icon: <CheckCircle size={14} /> },
  refused: { label: 'Refusée', color: '#E05A5A', bg: '#FEF2F2', icon: <X size={14} /> },
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { event?: Event })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login')
        return
      }

      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) {
          setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
        }
      }
    })
  }, [router, user, setUser])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)

      if (user.role === 'creator') {
        const { data: apps } = await supabase
          .from('applications')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })

        if (apps && apps.length > 0) {
          const eventIds = apps.map((a) => a.event_id)
          const { data: eventsData } = await supabase.from('events').select('*').in('id', eventIds)
          const enriched = apps.map((a) => ({
            ...a,
            event: eventsData?.find((e) => e.id === a.event_id),
          }))
          setApplications(enriched)
        }
      } else if (user.role === 'organizer') {
        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .eq('organizer_id', user.id)
          .order('created_at', { ascending: false })
        setEvents(eventsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 16px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>
                Bonjour, {user.full_name?.split(' ')[0]} 👋
              </h1>
              <p style={{ fontSize: '16px', color: '#888888' }}>
                {user.role === 'creator' ? 'Tableau de bord Créateur' : 'Tableau de bord Organisateur'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#888888', fontSize: '14px', cursor: 'pointer', transition: 'all 300ms ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E05A5A'; e.currentTarget.style.color = '#E05A5A' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#888888' }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>

          {/* Quick nav */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            <Link
              href="/events"
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={24} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>Événements</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>Voir les marchés</div>
              </div>
            </Link>
            <Link
              href="/creators"
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>Créateurs</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>Voir les artisans</div>
              </div>
            </Link>
            <Link
              href={`/creators/${user.id}`}
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: '700', color: '#6366F1' }}>
                  {user.full_name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>Mon profil</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>Voir ma fiche</div>
              </div>
            </Link>
            <Link
              href="/messages"
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={24} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>Messages</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>Vos conversations</div>
              </div>
            </Link>
            <Link
              href="/account"
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#F0F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', color: '#6366F1' }}>⚙️</span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A' }}>Mon compte</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>Éditer le profil</div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Content */}
        {loading ? (
          <p style={{ color: '#888888', textAlign: 'center', padding: '40px' }}>Chargement...</p>
        ) : user.role === 'creator' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>
              Mes candidatures ({applications.length})
            </h2>

            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9F9' }}>
                <Calendar size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '18px', color: '#888888', marginBottom: '12px' }}>Aucune candidature pour le moment</p>
                <Link
                  href="/events"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '15px', fontWeight: '600' }}
                >
                  Voir les événements <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app) => {
                  const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
                  return (
                    <div key={app.id} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                          {app.event?.title || 'Événement inconnu'}
                        </h3>
                        {app.event?.start_date && (
                          <p style={{ fontSize: '13px', color: '#888888' }}>
                            {new Date(app.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {app.event.city ? ` · ${app.event.city}` : ''}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', color: '#AAAAAA', marginTop: '4px' }}>
                          Candidature du {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: config.bg, color: config.color, fontSize: '13px', fontWeight: '600' }}>
                        {config.icon}
                        {config.label}
                      </div>
                      {app.event && (
                        <Link
                          href={`/events/${app.event_id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
                        >
                          Voir <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>
              Mes événements ({events.length})
            </h2>

            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9F9' }}>
                <Calendar size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '18px', color: '#888888', marginBottom: '4px' }}>Aucun événement créé</p>
                <p style={{ fontSize: '14px', color: '#AAAAAA' }}>Créez vos événements depuis l'application mobile</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', textDecoration: 'none', transition: 'all 300ms ease', flexWrap: 'wrap' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.08)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>{event.title}</h3>
                      {event.start_date && (
                        <p style={{ fontSize: '13px', color: '#888888' }}>
                          {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {event.city ? ` · ${event.city}` : ''}
                        </p>
                      )}
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: event.status === 'published' ? '#E8F5E9' : event.status === 'draft' ? '#FFF8E1' : '#F5F5F7',
                      color: event.status === 'published' ? '#4CAF50' : event.status === 'draft' ? '#FF9800' : '#888888',
                    }}>
                      {event.status === 'published' ? 'Publié' : event.status === 'draft' ? 'Brouillon' : 'Fermé'}
                    </span>
                    <ArrowRight size={16} color="#6366F1" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
