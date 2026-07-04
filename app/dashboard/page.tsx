'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Application, Event } from '@/lib/types'
import {
  Calendar, Users, CheckCircle, Clock, X, ArrowRight,
  LogOut, MessageSquare, User, Heart, List, CalendarDays, AlertCircle,
  MapPin, ShoppingBag, BarChart2, TrendingUp, Zap,
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
  const [loading, setLoading] = useState(true)
  const [creatorView, setCreatorView] = useState<'list' | 'calendar'>('list')
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url, is_creator: profile.is_creator, is_organizer: profile.is_organizer })
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
            {hasCreator && <CreatorContent applications={applications} creatorView={creatorView} setCreatorView={setCreatorView} />}
            {hasOrganizer && <OrganizerContent events={events} />}
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
}: {
  applications: (Application & { event?: Event })[]
  creatorView: 'list' | 'calendar'
  setCreatorView: (v: 'list' | 'calendar') => void
}) {
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

function OrganizerContent({ events }: { events: Event[] }) {
  return (
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
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusBadge.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                    {statusBadge.label}
                  </span>
                  <ArrowRight size={15} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
