'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Application, Event } from '@/lib/types'
import {
  Calendar, Users, CheckCircle, Clock, X, ArrowRight,
  LogOut, MessageSquare, User, Heart, List, CalendarDays, AlertCircle,
  MapPin, ShoppingBag,
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:  { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB', icon: <Clock size={14} /> },
  accepted: { label: 'Acceptée',   color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={14} /> },
  refused:  { label: 'Refusée',    color: '#E05A5A', bg: '#FEF2F2', icon: <X size={14} /> },
}

const NAV_CARDS = (userId: string, role: string) => [
  { href: '/events',           icon: <Calendar size={24} color="#6366F1" />, label: 'Événements',  sub: 'Voir les marchés' },
  { href: '/creators',         icon: <Users size={24} color="#6366F1" />,    label: 'Créateurs',   sub: 'Voir les artisans' },
  { href: '/carte',            icon: <MapPin size={24} color="#6366F1" />,   label: 'Carte',       sub: 'Événements proches' },
  { href: '/profile',          icon: <User size={24} color="#6366F1" />,     label: 'Mon profil',  sub: 'Éditer mon profil' },
  { href: '/favorites',        icon: <Heart size={24} color="#6366F1" />,    label: 'Favoris',     sub: 'Vos coups de cœur' },
  ...(role !== 'visitor' ? [
    { href: '/messages', icon: <MessageSquare size={24} color="#6366F1" />, label: 'Messages', sub: 'Vos conversations' },
  ] : []),
  ...(role === 'organizer' ? [
    { href: '/events/create',  icon: <CalendarDays size={24} color="#6366F1" />, label: 'Créer un événement', sub: 'Nouveau marché' },
    { href: `/creators/${userId}`, icon: <User size={24} color="#6366F1" />, label: 'Ma fiche', sub: 'Vue publique' },
  ] : []),
  ...(role === 'creator' ? [
    { href: `/boutique/${userId}`, icon: <ShoppingBag size={24} color="#6366F1" />, label: 'Ma boutique', sub: 'Mes créations' },
    { href: '/carnet-de-route', icon: <MapPin size={24} color="#6366F1" />, label: 'Carnet de route', sub: 'Mes déplacements' },
  ] : []),
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { event?: Event })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [creatorView, setCreatorView] = useState<'list' | 'calendar'>('list')
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([])

  const PROFILE_STEPS_TOTAL = 6

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
      }
    })
  }, [router, user, setUser])

  useEffect(() => {
    if (!user) return
    const checkProfile = async () => {
      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('full_name, bio, avatar_url, role').eq('id', user.id).maybeSingle(),
        supabase.from('creator_profiles').select('disciplines, city, travel_radius').eq('user_id', user.id).maybeSingle(),
      ])
      // Show banner for creators/artisans AND for old accounts that have a creator_profiles row (role may be null)
      const isCreator = p?.role === 'creator' || p?.role === 'artisan' || cp !== null
      if (!isCreator) return
      const missing: string[] = []
      if (!p?.full_name) missing.push('Nom complet')
      if (!p?.bio) missing.push('Bio')
      if (!p?.avatar_url) missing.push('Photo de profil')
      if (!cp?.disciplines?.length) missing.push('Disciplines')
      if (!cp?.city) missing.push('Ville')
      if (!cp?.travel_radius) missing.push('Rayon de déplacement')
      setMissingProfileFields(missing)
    }
    checkProfile()
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      if (user.role === 'creator') {
        const { data: apps } = await supabase.from('applications').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
        if (apps?.length) {
          const { data: eventsData } = await supabase.from('events').select('*').in('id', apps.map(a => a.event_id))
          setApplications(apps.map(a => ({ ...a, event: eventsData?.find(e => e.id === a.event_id) })))
        }
      } else if (user.role === 'organizer') {
        const { data: eventsData } = await supabase.from('events').select('*').eq('organizer_id', user.id).order('created_at', { ascending: false })
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

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const firstName = user.full_name?.split(' ')[0]

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 80px)' }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.dash-card:hover{border-color:#6366F1!important;box-shadow:0 4px 12px rgba(99,102,241,0.1)!important}.dash-logout:hover{border-color:#E05A5A!important;color:#E05A5A!important}`}</style>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 16px 80px', animation: 'fadeInUp 0.4s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '34px', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', margin: 0 }}>
              Bonjour, {firstName} 👋
            </h1>
            <p style={{ fontSize: '15px', color: '#888888', margin: '6px 0 0' }}>
              {user.role === 'creator' ? 'Tableau de bord Créateur' : user.role === 'visitor' ? 'Tableau de bord Visiteur' : 'Tableau de bord Organisateur'}
            </p>
          </div>
          <button onClick={handleLogout} className="dash-logout"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#888888', fontSize: '14px', cursor: 'pointer', transition: 'all 200ms ease' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>

        {/* Profile completion banner */}
        {missingProfileFields.length > 0 && (
          <Link href="/profile" style={{ textDecoration: 'none', display: 'block', marginBottom: '28px' }}>
            <div style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid #E0E0FA', backgroundColor: '#F8F7FF', cursor: 'pointer', transition: 'border-color 200ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366F1' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E0E0FA' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="#6366F1" />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A' }}>Profil incomplet</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#6366F1' }}>
                    {PROFILE_STEPS_TOTAL - missingProfileFields.length}/{PROFILE_STEPS_TOTAL}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>étapes</span>
                  <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: '600', color: '#6366F1', textDecoration: 'underline' }}>Compléter →</span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: '6px', borderRadius: '99px', backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, #6366F1, #818CF8)', width: `${((PROFILE_STEPS_TOTAL - missingProfileFields.length) / PROFILE_STEPS_TOTAL) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
              {/* Missing chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {missingProfileFields.map(f => (
                  <span key={f} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '9999px', backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        )}

        {/* Nav cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '48px' }}>
          {NAV_CARDS(user.id, user.role ?? '').map(c => (
            <Link key={c.href} href={c.href} className="dash-card"
              style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', transition: 'all 200ms ease', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {c.icon}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>{c.label}</div>
                <div style={{ fontSize: '13px', color: '#888888' }}>{c.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : user.role === 'visitor' ? (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>Explorer Nexart</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {[
                { href: '/carte', emoji: '🗺️', title: 'Carte des événements', desc: 'Trouvez les marchés près de chez vous' },
                { href: '/events', emoji: '📅', title: 'Tous les événements', desc: 'Parcourir le calendrier complet' },
                { href: '/creators', emoji: '🎨', title: 'Découvrir les créateurs', desc: 'Artisans et makers près de vous' },
                { href: '/favorites', emoji: '❤️', title: 'Mes favoris', desc: 'Événements et créateurs sauvegardés' },
                { href: '/notifications', emoji: '🔔', title: 'Notifications', desc: 'Actualités des créateurs suivis' },
                { href: '/profile', emoji: '👤', title: 'Mon profil', desc: 'Gérer mes préférences' },
              ].map(card => (
                <Link key={card.href} href={card.href}
                  style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '14px', transition: 'border-color 200ms' }}
                  className="dash-card">
                  <span style={{ fontSize: '28px', flexShrink: 0 }}>{card.emoji}</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 3px' }}>{card.title}</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: '32px', padding: '20px 24px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>💡 Conseil</p>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
                Suivez vos créateurs préférés pour être notifié de leurs prochains événements et de leurs nouvelles créations en boutique.
              </p>
            </div>
          </div>
        ) : user.role === 'creator' ? (
          <div>
            {/* Header + toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A' }}>
                Mes candidatures ({applications.length})
              </h2>
              <div style={{ display: 'flex', backgroundColor: '#F5F5F7', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                <button onClick={() => setCreatorView('list')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: creatorView === 'list' ? '#FFFFFF' : 'transparent', color: creatorView === 'list' ? '#6366F1' : '#888888', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: creatorView === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  <List size={14} /> Liste
                </button>
                <button onClick={() => setCreatorView('calendar')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: creatorView === 'calendar' ? '#FFFFFF' : 'transparent', color: creatorView === 'calendar' ? '#6366F1' : '#888888', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: creatorView === 'calendar' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                  <CalendarDays size={14} /> Calendrier
                </button>
              </div>
            </div>

            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9FB' }}>
                <Calendar size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', color: '#888888', marginBottom: '20px' }}>Aucune candidature pour le moment</p>
                <Link href="/events"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                  Voir les événements <ArrowRight size={16} />
                </Link>
              </div>
            ) : creatorView === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {applications.map((app) => {
                  const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
                  return (
                    <div key={app.id} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>
                          {app.event?.title || 'Événement inconnu'}
                        </h3>
                        {app.event?.start_date && (
                          <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
                            {new Date(app.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {app.event.city ? ` · ${app.event.city}` : ''}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0' }}>
                          Candidature du {new Date(app.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, fontSize: '13px', fontWeight: '700' }}>
                        {sc.icon} {sc.label}
                      </div>
                      {app.event && (
                        <Link href={`/events/${app.event_id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
                          Voir <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Calendar view — timeline grouped by month */
              (() => {
                // Build sorted upcoming events + past grouped by month
                const sorted = [...applications]
                  .filter(a => a.event?.start_date)
                  .sort((a, b) => new Date(a.event!.start_date).getTime() - new Date(b.event!.start_date).getTime())

                const grouped: Record<string, typeof sorted> = {}
                sorted.forEach(a => {
                  const key = new Date(a.event!.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  if (!grouped[key]) grouped[key] = []
                  grouped[key].push(a)
                })

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {Object.entries(grouped).map(([month, apps]) => (
                      <div key={month}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ height: '1px', flex: 1, backgroundColor: '#E5E7EB' }} />
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'capitalize', whiteSpace: 'nowrap', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#F5F5F7' }}>
                            {month}
                          </span>
                          <div style={{ height: '1px', flex: 1, backgroundColor: '#E5E7EB' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px', borderLeft: '2px solid #E5E7EB' }}>
                          {apps.map(app => {
                            const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
                            const d = new Date(app.event!.start_date)
                            return (
                              <Link key={app.id} href={`/events/${app.event_id}`} style={{ textDecoration: 'none', display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', transition: 'all 150ms' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.backgroundColor = '#FAFBFF' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
                                {/* Day block */}
                                <div style={{ width: '44px', flexShrink: 0, textAlign: 'center', backgroundColor: '#EEF2FF', borderRadius: '8px', padding: '6px 0' }}>
                                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#6366F1', lineHeight: 1 }}>{d.getDate()}</div>
                                  <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', textTransform: 'capitalize' }}>
                                    {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                  </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {app.event?.title}
                                  </p>
                                  {app.event?.city && (
                                    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{app.event.city}</p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                                  {sc.icon} {sc.label}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>
              Mes événements ({events.length})
            </h2>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9FB' }}>
                <Calendar size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', color: '#888888', marginBottom: '4px' }}>Aucun événement créé</p>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '20px' }}>Créez votre premier marché et trouvez des artisans</p>
                <Link href="/events/create"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                  Créer un événement <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {events.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="dash-card"
                    style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', textDecoration: 'none', transition: 'all 200ms ease', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>{event.title}</h3>
                      {event.start_date && (
                        <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>
                          {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {event.city ? ` · ${event.city}` : ''}
                        </p>
                      )}
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                      backgroundColor: event.status === 'published' ? '#ECFDF5' : event.status === 'draft' ? '#FFFBEB' : '#F3F4F6',
                      color: event.status === 'published' ? '#10B981' : event.status === 'draft' ? '#F59E0B' : '#9CA3AF',
                    }}>
                      {event.status === 'published' ? 'Publié' : event.status === 'draft' ? 'Brouillon' : 'Fermé'}
                    </span>
                    <ArrowRight size={16} color="#6366F1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
