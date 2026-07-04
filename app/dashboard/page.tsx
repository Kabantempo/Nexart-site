'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Application, Event } from '@/lib/types'
import {
  Calendar, Users, CheckCircle, Clock, X, ArrowRight,
  LogOut, MessageSquare, User, Heart, List, CalendarDays, AlertCircle,
  MapPin, ShoppingBag, BarChart2, TrendingUp, Zap, Rss, Star,
} from 'lucide-react'
import { CreditsWidget } from '@/components/credits-widget'
import { BoostButton } from '@/components/boost-button'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'En attente', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   dot: 'bg-amber-400' },
  accepted: { label: 'Acceptée',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400' },
  refused:  { label: 'Refusée',    color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       dot: 'bg-red-400' },
}

const NAV_CARDS = (userId: string, isCreator: boolean, isOrganizer: boolean, isVisitor: boolean) => [
  { href: '/events',           icon: <Calendar size={22} className="text-indigo-600" />,    label: 'Événements',          sub: 'Voir les marchés' },
  { href: '/creators',         icon: <Users size={22} className="text-indigo-600" />,        label: 'Créateurs',           sub: 'Voir les artisans' },
  { href: '/carte',            icon: <MapPin size={22} className="text-indigo-600" />,       label: 'Carte',               sub: 'Événements proches' },
  { href: '/profile',          icon: <User size={22} className="text-indigo-600" />,         label: 'Mon profil',          sub: 'Éditer mon profil' },
  { href: '/favorites',        icon: <Heart size={22} className="text-indigo-600" />,        label: 'Favoris',             sub: 'Vos coups de coeur' },
  ...(!isVisitor ? [
    { href: '/messages', icon: <MessageSquare size={22} className="text-indigo-600" />, label: 'Messages', sub: 'Vos conversations' },
  ] : []),
  ...(isOrganizer ? [
    { href: '/events/create',      icon: <CalendarDays size={22} className="text-indigo-600" />, label: 'Créer un événement', sub: 'Nouveau marché' },
    { href: '/analytics',          icon: <BarChart2 size={22} className="text-indigo-600" />,    label: 'Analytiques',        sub: 'Stats événements' },
    { href: '/calendrier',         icon: <CalendarDays size={22} className="text-indigo-600" />, label: 'Calendrier',         sub: 'Vue multi-événements' },
  ] : []),
  ...(isCreator ? [
    { href: `/boutique/${userId}`, icon: <ShoppingBag size={22} className="text-indigo-600" />, label: 'Ma boutique',     sub: 'Mes créations' },
    { href: '/carnet-de-route',    icon: <MapPin size={22} className="text-indigo-600" />,      label: 'Carnet de route', sub: 'Mes déplacements' },
    { href: '/feed',               icon: <Rss size={22} className="text-indigo-600" />,         label: 'Fil d\'actu',      sub: 'Créateurs suivis' },
    ...(!isOrganizer ? [{ href: '/analytics', icon: <BarChart2 size={22} className="text-indigo-600" />, label: 'Analytiques', sub: 'Mes statistiques' }] : []),
  ] : []),
]

function DashSkeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="h-48 bg-[#06060f] animate-pulse" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />)}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 70}ms` }} />)}
        </div>
      </div>
    </div>
  )
}

const PROFILE_STEPS_TOTAL = 6

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const [applications, setApplications] = useState<(Application & { event?: Event })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [pendingApps, setPendingApps] = useState<{ id: string; creator_id: string; event_id: string; message: string | null; created_at: string; profiles: { full_name: string | null; avatar_url: string | null } | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [creatorView, setCreatorView] = useState<'list' | 'calendar'>('list')
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) {
          if (profile.is_banned) { await supabase.auth.signOut(); router.push('/banned'); return }
          setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url, is_creator: profile.is_creator, is_organizer: profile.is_organizer })
          if (!profile.onboarding_done) { router.push('/onboarding'); return }
        }
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
      const hasCreator = user.is_creator || user.role === 'creator'
      const hasOrganizer = user.is_organizer || user.role === 'organizer'
      await Promise.all([
        hasCreator ? (async () => {
          const { data: apps } = await supabase.from('applications').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })
          if (apps?.length) {
            const { data: eventsData } = await supabase.from('events').select('*').in('id', apps.map(a => a.event_id))
            setApplications(apps.map(a => ({ ...a, event: eventsData?.find(e => e.id === a.event_id) })))
          }
        })() : Promise.resolve(),
        hasOrganizer ? (async () => {
          const { data: eventsData } = await supabase.from('events').select('*').eq('organizer_id', user.id).order('created_at', { ascending: false })
          setEvents(eventsData || [])
          if (eventsData?.length) {
            const { data: pending } = await supabase
              .from('applications')
              .select('id, creator_id, event_id, message, created_at, profiles(full_name, avatar_url)')
              .in('event_id', eventsData.map(e => e.id))
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
            setPendingApps((pending as unknown as typeof pendingApps) || [])
          }
        })() : Promise.resolve(),
      ])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  if (!user) return <DashSkeleton />

  const hasCreator = user.is_creator || user.role === 'creator'
  const hasOrganizer = user.is_organizer || user.role === 'organizer'
  const isVisitor = !hasCreator && !hasOrganizer

  const firstName = user.full_name?.split(' ')[0]
  const acceptedApps = applications.filter(a => a.status === 'accepted')
  const acceptanceRate = applications.length > 0 ? Math.round((acceptedApps.length / applications.length) * 100) : 0
  const publishedEvents = events.filter(e => e.status === 'published')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const roleLabel = hasCreator && hasOrganizer ? 'Créateur · Organisateur' : hasCreator ? 'Créateur' : hasOrganizer ? 'Organisateur' : 'Visiteur'
  const roleSubtitle = hasCreator && hasOrganizer ? 'Votre espace Nexart — double rôle' : hasCreator ? 'Votre espace créateur Nexart' : hasOrganizer ? 'Votre espace organisateur Nexart' : 'Bienvenue sur Nexart'

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/20 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-16 left-0 w-72 h-72 rounded-full bg-violet-600/15 blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-14 relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#A5B4FC' }}>
                    {roleLabel}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {greeting}, {firstName}
                </h1>
                <p className="text-white/40 text-sm mt-2">
                  {roleSubtitle}
                </p>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:border-red-500/40 hover:text-red-400 transition-all duration-200">
                <LogOut size={15} /> Déconnexion
              </button>
            </div>

            {/* Stats rapides */}
            {!loading && (hasCreator || hasOrganizer) && (
              <div className="flex flex-wrap gap-3 mt-8">
                {hasCreator && applications.length > 0 && [
                  { label: 'candidatures', value: applications.length, icon: <Calendar size={13} /> },
                  { label: 'acceptées', value: acceptedApps.length, icon: <CheckCircle size={13} /> },
                  { label: "taux d'acceptation", value: `${acceptanceRate}%`, icon: <TrendingUp size={13} /> },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-indigo-400">{s.icon}</span>
                    <span className="text-white font-bold text-sm">{s.value}</span>
                    <span className="text-white/40 text-xs">{s.label}</span>
                  </div>
                ))}
                {hasOrganizer && [
                  { label: 'événements', value: events.length },
                  { label: 'publiés', value: publishedEvents.length },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                    <span className="text-white font-bold text-sm">{s.value}</span>
                    <span className="text-white/40 text-xs">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* Profile completion */}
        {missingProfileFields.length > 0 && (
          <Link href="/profile" className="block mb-8 group">
            <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-indigo-600" />
                  <span className="text-sm font-bold text-gray-900">Profil incomplet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-indigo-600">{PROFILE_STEPS_TOTAL - missingProfileFields.length}/{PROFILE_STEPS_TOTAL}</span>
                  <span className="text-xs text-gray-400">étapes</span>
                  <span className="ml-2 text-xs font-semibold text-indigo-600">Compléter →</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden mb-3">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${((PROFILE_STEPS_TOTAL - missingProfileFields.length) / PROFILE_STEPS_TOTAL) * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {missingProfileFields.map(f => (
                  <span key={f} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">{f}</span>
                ))}
              </div>
            </div>
          </Link>
        )}

        {/* Nav cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
          {NAV_CARDS(user.id, hasCreator, hasOrganizer, isVisitor).map((c, i) => (
            <motion.div key={c.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4 }}>
              <Link href={c.href}
                className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{c.label}</div>
                  <div className="text-xs text-gray-400 truncate">{c.sub}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : isVisitor ? (
          <VisitorContent />
        ) : (
          <div className="flex flex-col gap-12">
            {hasCreator && <CreatorContent applications={applications} creatorView={creatorView} setCreatorView={setCreatorView} userId={user.id} />}
            {hasOrganizer && <OrganizerContent events={events} pendingApps={pendingApps} setPendingApps={setPendingApps} userId={user.id} />}
          </div>
        )}
      </div>
    </div>
  )
}

function VisitorContent() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Explorer Nexart</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: '/carte',         icon: <MapPin size={18} className="text-indigo-600" />,        title: 'Carte des événements',   desc: 'Trouvez les marchés près de chez vous' },
          { href: '/events',        icon: <Calendar size={18} className="text-indigo-600" />,      title: 'Tous les événements',     desc: 'Parcourir le calendrier complet' },
          { href: '/creators',      icon: <Users size={18} className="text-indigo-600" />,         title: 'Découvrir les créateurs', desc: 'Artisans et makers près de vous' },
          { href: '/favorites',     icon: <Heart size={18} className="text-indigo-600" />,         title: 'Mes favoris',             desc: 'Evenements et créateurs sauvegardés' },
          { href: '/notifications', icon: <MessageSquare size={18} className="text-indigo-600" />, title: 'Notifications',           desc: 'Actualités des créateurs suivis' },
          { href: '/profile',       icon: <User size={18} className="text-indigo-600" />,          title: 'Mon profil',              desc: 'Gérer mes préférences' },
        ].map(card => (
          <Link key={card.href} href={card.href}
            className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">{card.icon}</div>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{card.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 p-5 rounded-2xl bg-gray-50 border border-gray-100">
        <p className="text-xs font-bold text-gray-900 mb-1.5">Conseil</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Suivez vos créateurs préférés pour être notifié de leurs prochains événements et de leurs nouvelles créations.
        </p>
      </div>
    </div>
  )
}

function CreatorContent({
  applications,
  creatorView,
  setCreatorView,
  userId,
}: {
  applications: (Application & { event?: Event })[]
  creatorView: 'list' | 'calendar'
  setCreatorView: (v: 'list' | 'calendar') => void
  userId: string
}) {
  const [recommended, setRecommended] = useState<Event[]>([])
  const appliedEventIds = new Set(applications.map(a => a.event_id))

  useEffect(() => {
    const load = async () => {
      const { data: cp } = await supabase.from('creator_profiles').select('disciplines, city').eq('user_id', userId).maybeSingle()
      if (!cp?.disciplines?.length) return
      const { data: evs } = await supabase.from('events')
        .select('*')
        .eq('status', 'published')
        .overlaps('discipline_tags', cp.disciplines)
        .order('start_date', { ascending: true })
        .limit(5)
      if (evs) setRecommended(evs.filter(e => !appliedEventIds.has(e.id)))
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <div>
      <CreditsWidget />
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Mes candidatures ({applications.length})</h2>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['list', 'calendar'] as const).map(v => (
            <button key={v} onClick={() => setCreatorView(v)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                creatorView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {v === 'list' ? <List size={13} /> : <CalendarDays size={13} />}
              {v === 'list' ? 'Liste' : 'Calendrier'}
            </button>
          ))}
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
          <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-base font-semibold text-gray-500 mb-1">Aucune candidature pour le moment</p>
          <p className="text-sm text-gray-400 mb-6">Explorez les événements disponibles et postulez</p>
          <Link href="/events"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
            Voir les événements <ArrowRight size={15} />
          </Link>
        </div>
      ) : creatorView === 'list' ? (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
            return (
              <div key={app.id}
                className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate mb-1">
                    {app.event?.title || 'Événement inconnu'}
                  </h3>
                  {app.event?.start_date && (
                    <p className="text-xs text-gray-400">
                      {new Date(app.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {app.event.city ? ` · ${app.event.city}` : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">
                    Candidature du {new Date(app.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${sc.bg} ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
                {app.status === 'accepted' && (
                  <BoostButton
                    type="boost_application"
                    refId={app.id}
                    boostedUntil={app.boosted_at ? new Date(new Date(app.boosted_at).getTime() + 48 * 60 * 60 * 1000).toISOString() : null}
                  />
                )}
                {app.event && (
                  <Link href={`/events/${app.event_id}`}
                    className="flex items-center gap-1 text-indigo-600 text-xs font-bold hover:gap-2 transition-all">
                    Voir <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <CalendarView applications={applications} />
      )}

      {/* Recommandations */}
      {recommended.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Événements pour vous</h2>
            <Link href="/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Voir tout →</Link>
          </div>
          <div className="flex flex-col gap-3">
            {recommended.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/events/${ev.id}`}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-150 group">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-indigo-700 transition-colors">{ev.title}</h3>
                    <p className="text-xs text-gray-400">
                      {ev.start_date ? new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''}
                      {ev.city ? ` · ${ev.city}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Recommandé</span>
                  <ArrowRight size={15} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarView({ applications }: { applications: (Application & { event?: Event })[] }) {
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
    <div className="flex flex-col gap-6">
      {Object.entries(grouped).map(([month, apps]) => (
        <div key={month}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-bold text-gray-400 capitalize px-3 py-1 rounded-full bg-gray-50">{month}</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex flex-col gap-2 pl-3 border-l-2 border-gray-100">
            {apps.map(app => {
              const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
              const d = new Date(app.event!.start_date)
              return (
                <Link key={app.id} href={`/events/${app.event_id}`}
                  className="flex gap-3 items-center p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-150">
                  <div className="w-11 shrink-0 text-center bg-indigo-50 rounded-xl py-1.5">
                    <div className="text-lg font-black text-indigo-600 leading-none">{d.getDate()}</div>
                    <div className="text-[10px] text-gray-400 font-semibold capitalize">
                      {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{app.event?.title}</p>
                    {app.event?.city && <p className="text-xs text-gray-400">{app.event.city}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold shrink-0 ${sc.bg} ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

type PendingApp = { id: string; creator_id: string; event_id: string; message: string | null; created_at: string; profiles: { full_name: string | null; avatar_url: string | null } | null }

function OrganizerContent({ events, pendingApps, setPendingApps, userId }: {
  events: Event[]
  pendingApps: PendingApp[]
  setPendingApps: React.Dispatch<React.SetStateAction<PendingApp[]>>
  userId: string
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [recommendedCreators, setRecommendedCreators] = useState<{ id: string; full_name: string | null; avatar_url: string | null; disciplines: string[] }[]>([])
  const [pendingReviews, setPendingReviews] = useState<{ eventId: string; eventTitle: string; creatorId: string; creatorName: string; creatorAvatar: string | null }[]>([])
  const [reviewModal, setReviewModal] = useState<{ eventId: string; eventTitle: string; creatorId: string; creatorName: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const allTags = events.flatMap(e => (e as unknown as { discipline_tags?: string[] }).discipline_tags ?? [])
      const uniqueTags = [...new Set(allTags)]
      if (!uniqueTags.length) return
      const { data } = await supabase.from('creator_profiles')
        .select('user_id, disciplines, profiles(full_name, avatar_url)')
        .overlaps('disciplines', uniqueTags)
        .limit(6)
      if (!data) return
      setRecommendedCreators(
        (data as unknown as { user_id: string; disciplines: string[]; profiles: { full_name: string | null; avatar_url: string | null } | null }[])
          .map(cp => ({ id: cp.user_id, full_name: cp.profiles?.full_name ?? null, avatar_url: cp.profiles?.avatar_url ?? null, disciplines: cp.disciplines }))
      )
    }
    if (events.length) load()
  }, [events])

  // Charger les avis à laisser (événements passés avec créateurs acceptés non encore notés)
  useEffect(() => {
    const loadPendingReviews = async () => {
      const pastEvents = events.filter(e => e.end_date && new Date(e.end_date) < new Date())
      if (!pastEvents.length) return

      const { data: apps } = await supabase
        .from('applications')
        .select('id, creator_id, event_id, profiles(full_name, avatar_url)')
        .in('event_id', pastEvents.map(e => e.id))
        .eq('status', 'accepted')

      if (!apps?.length) return

      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('reviewed_id, event_id')
        .eq('reviewer_id', userId)

      const reviewed = new Set((existingReviews ?? []).map(r => `${r.event_id}:${r.reviewed_id}`))

      const pending = (apps as unknown as { id: string; creator_id: string; event_id: string; profiles: { full_name: string | null; avatar_url: string | null } | null }[])
        .filter(a => !reviewed.has(`${a.event_id}:${a.creator_id}`))
        .map(a => ({
          eventId: a.event_id,
          eventTitle: pastEvents.find(e => e.id === a.event_id)?.title ?? 'Événement',
          creatorId: a.creator_id,
          creatorName: a.profiles?.full_name ?? 'Créateur',
          creatorAvatar: a.profiles?.avatar_url ?? null,
        }))

      setPendingReviews(pending)
    }
    if (events.length) loadPendingReviews()
  }, [events, userId])

  const submitReview = async () => {
    if (!reviewModal || reviewRating === 0) return
    setReviewSubmitting(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: reviewModal.eventId,
        reviewer_id: userId,
        reviewed_id: reviewModal.creatorId,
        reviewer_role: 'organizer',
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      }),
    })
    setPendingReviews(prev => prev.filter(r => !(r.eventId === reviewModal.eventId && r.creatorId === reviewModal.creatorId)))
    setReviewModal(null)
    setReviewRating(0)
    setReviewComment('')
    setReviewSubmitting(false)
  }

  const handleStatus = async (appId: string, status: 'accepted' | 'refused', eventTitle?: string, creatorId?: string) => {
    setUpdatingId(appId)
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
    if (creatorId && eventTitle) {
      await supabase.from('notifications').insert({
        user_id: creatorId,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        title: status === 'accepted' ? 'Candidature acceptée' : 'Candidature non retenue',
        body: status === 'accepted' ? `Votre candidature pour "${eventTitle}" a été acceptée !` : `Votre candidature pour "${eventTitle}" n'a pas été retenue.`,
        link: `/events/${pendingApps.find(a => a.id === appId)?.event_id}`,
      })
    }
    setPendingApps(prev => prev.filter(a => a.id !== appId))
    setUpdatingId(null)
  }

  const handleBulkStatus = async (status: 'accepted' | 'refused') => {
    if (!selected.size) return
    setBulkUpdating(true)
    const ids = [...selected]
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).in('id', ids)
    const toNotify = pendingApps.filter(a => ids.includes(a.id))
    await Promise.all(toNotify.map(app => {
      const ev = events.find(e => e.id === app.event_id)
      return supabase.from('notifications').insert({
        user_id: app.creator_id,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        title: status === 'accepted' ? 'Candidature acceptée' : 'Candidature non retenue',
        body: status === 'accepted' ? `Votre candidature pour "${ev?.title || 'l\'événement'}" a été acceptée !` : `Votre candidature pour "${ev?.title || 'l\'événement'}" n'a pas été retenue.`,
        link: `/events/${app.event_id}`,
      })
    }))
    setPendingApps(prev => prev.filter(a => !ids.includes(a.id)))
    setSelected(new Set())
    setBulkUpdating(false)
  }

  const toggleSelect = (id: string) => setSelected(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const toggleAll = () => setSelected(prev => prev.size === pendingApps.length ? new Set() : new Set(pendingApps.map(a => a.id)))

  return (
    <div className="flex flex-col gap-8">
      {/* Pending candidatures */}
      {pendingApps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Candidatures en attente</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">{pendingApps.length}</span>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
                <button onClick={() => handleBulkStatus('accepted')} disabled={bulkUpdating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50">
                  <CheckCircle size={13} /> Accepter tout
                </button>
                <button onClick={() => handleBulkStatus('refused')} disabled={bulkUpdating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50">
                  <X size={13} /> Refuser tout
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {/* Select all row */}
            <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={selected.size === pendingApps.length && pendingApps.length > 0} onChange={toggleAll}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-xs font-semibold text-gray-400">Tout sélectionner</span>
            </label>
            {pendingApps.map((app, i) => {
              const ev = events.find(e => e.id === app.event_id)
              const isSelected = selected.has(app.id)
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 ${isSelected ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-100 bg-white'}`}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(app.id)}
                    className="w-4 h-4 rounded accent-indigo-600 shrink-0" />
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0 overflow-hidden">
                    {app.profiles?.avatar_url
                      ? <img src={app.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      : (app.profiles?.full_name?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/creators/${app.creator_id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-700 transition-colors">
                        {app.profiles?.full_name || 'Créateur'}
                      </Link>
                      {ev && (
                        <span className="text-xs text-gray-400">· <Link href={`/events/${ev.id}`} className="hover:text-indigo-600 transition-colors">{ev.title}</Link></span>
                      )}
                    </div>
                    {app.message && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">"{app.message}"</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">{new Date(app.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleStatus(app.id, 'accepted', ev?.title, app.creator_id)} disabled={updatingId === app.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50">
                      Accepter
                    </button>
                    <button onClick={() => handleStatus(app.id, 'refused', ev?.title, app.creator_id)} disabled={updatingId === app.id}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50">
                      Refuser
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommandations créateurs */}
      {recommendedCreators.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Créateurs compatibles</h2>
            <Link href="/creators" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">Voir tout →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedCreators.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/creators/${c.id}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-150 group">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 overflow-hidden">
                    {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.full_name?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{c.full_name || 'Créateur'}</p>
                    <p className="text-xs text-gray-400 truncate">{c.disciplines.slice(0, 2).join(', ')}</p>
                  </div>
                  <ArrowRight size={14} className="text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Avis à laisser */}
      {pendingReviews.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Avis à laisser ({pendingReviews.length})</h2>
          <div className="flex flex-col gap-3">
            {pendingReviews.map(r => (
              <div key={`${r.eventId}:${r.creatorId}`} className="flex items-center gap-4 p-4 rounded-2xl border border-amber-100 bg-amber-50">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 text-sm shrink-0 overflow-hidden">
                  {r.creatorAvatar ? <img src={r.creatorAvatar} alt="" className="w-full h-full object-cover" /> : r.creatorName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{r.creatorName}</p>
                  <p className="text-xs text-gray-500 truncate">{r.eventTitle}</p>
                </div>
                <button onClick={() => { setReviewModal(r); setReviewRating(0); setReviewComment('') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors shrink-0">
                  <Star size={13} /> Noter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal avis */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Laisser un avis</h3>
            <p className="text-sm text-gray-500 mb-5">Pour <span className="font-semibold text-gray-700">{reviewModal.creatorName}</span> — {reviewModal.eventTitle}</p>
            <div className="flex items-center gap-2 mb-5">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)}
                  className="transition-transform hover:scale-110">
                  <Star size={28} fill={n <= reviewRating ? '#F59E0B' : 'none'} color={n <= reviewRating ? '#F59E0B' : '#D1D5DB'} />
                </button>
              ))}
              {reviewRating > 0 && <span className="text-sm text-gray-500 ml-2">{['','Insuffisant','Passable','Bien','Très bien','Excellent'][reviewRating]}</span>}
            </div>
            <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
              placeholder="Commentaire optionnel — ponctualité, qualité des produits, stand bien tenu…"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none outline-none focus:border-indigo-400 text-gray-900 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={submitReview} disabled={reviewRating === 0 || reviewSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-indigo-500 transition-colors">
                {reviewSubmitting ? 'Envoi…' : 'Publier l\'avis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-900">Mes événements ({events.length})</h2>
          <Link href="/events/create"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
            <Zap size={15} /> Créer un événement
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
            <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
            <p className="text-base font-semibold text-gray-500 mb-1">Aucun événement créé</p>
            <p className="text-sm text-gray-400 mb-6">Créez votre premier marché et trouvez des artisans</p>
            <Link href="/events/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
              Créer un événement <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event, i) => {
              const statusBadge = {
                published: { label: 'Publié',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
                draft:     { label: 'Brouillon', classes: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
                closed:    { label: 'Fermé',     classes: 'bg-gray-50 text-gray-500 border-gray-200',          dot: 'bg-gray-300' },
              }[event.status] ?? { label: event.status, classes: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-300' }
              const eventPending = pendingApps.filter(a => a.event_id === event.id).length

              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/events/${event.id}`}
                    className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm hover:-translate-y-px transition-all duration-150 flex-wrap group">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-indigo-700 transition-colors">{event.title}</h3>
                      {event.start_date && (
                        <p className="text-xs text-gray-400">
                          {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {event.city ? ` · ${event.city}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {eventPending > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                          {eventPending} en attente
                        </span>
                      )}
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusBadge.classes}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </div>
                    <ArrowRight size={15} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
