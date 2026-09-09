'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Users, Clock, CheckCircle, XCircle, BarChart2,
  Mail, UserCheck, ClipboardList, CalendarDays, Settings,
  FileText, ListChecks, MapPin, Edit, ChevronRight, ChevronLeft,
  TrendingUp, AlertCircle, ArrowLeft, LogOut, LayoutDashboard,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import ExhibitorsClient from '../exhibitors/exhibitors-client'
import AnalyticsClient from '../analytics/analytics-client'
import WaitlistClient from '../waitlist/waitlist-client'
import TeamCollaborationClient from '../team/team-client'
import VolunteersClient from '../volunteers/volunteers-client'
import CollaborationClient from '../collaboration/collaboration-client'
import MarketingClient from '../settings/marketing/marketing-client'
import StandsClient from '../settings/stands/stands-client'
import FAQsClient from '../settings/faqs/faqs-client'

type Section = 'overview' | 'candidatures' | 'exhibitors' | 'analytics' | 'waitlist' | 'team' | 'volunteers' | 'collaboration' | 'marketing' | 'stands' | 'faqs'

interface Stats {
  total: number
  pending: number
  accepted: number
  refused: number
  remaining: number
  standCount: number
}

interface RecentApp {
  id: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface EventInfo {
  title: string
  city: string
  start_date: string
  end_date: string
  status: string
  stand_count: number
}

const NAV_ITEMS: { label: string; section: Section; icon: React.ReactNode }[] = [
  { label: 'Vue d\'ensemble',  section: 'overview',       icon: <LayoutDashboard size={15} /> },
  { label: 'Candidatures',     section: 'candidatures',   icon: <FileText size={15} /> },
  { label: 'Formulaire',       section: 'exhibitors',     icon: <Users size={15} /> },
  { label: 'Analytics',        section: 'analytics',      icon: <BarChart2 size={15} /> },
  { label: "Liste d'attente",  section: 'waitlist',       icon: <ClipboardList size={15} /> },
  { label: 'Équipe',           section: 'team',           icon: <UserCheck size={15} /> },
  { label: 'Bénévoles',        section: 'volunteers',     icon: <CalendarDays size={15} /> },
  { label: 'Collaboration',    section: 'collaboration',  icon: <ListChecks size={15} /> },
  { label: 'Marketing',        section: 'marketing',      icon: <Mail size={15} /> },
  { label: 'Plan stands',      section: 'stands',         icon: <MapPin size={15} /> },
  { label: 'Paramètres FAQ',   section: 'faqs',           icon: <Settings size={15} /> },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'En attente', color: colors.feedback.warning.text,  bg: colors.feedback.warning.bg,  dot: '#F59E0B' },
  accepted: { label: 'Accepté',    color: colors.feedback.success.text,  bg: colors.feedback.success.bg,  dot: '#22C55E' },
  refused:  { label: 'Refusé',     color: colors.feedback.danger.text,   bg: colors.feedback.danger.bg,   dot: colors.feedback.danger.solid },
}

const EVENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Brouillon', color: colors.text.secondary,        bg: 'var(--bg-secondary)' },
  published: { label: 'Publié',    color: colors.feedback.success.text, bg: colors.feedback.success.bg },
  closed:    { label: 'Clôturé',   color: colors.feedback.danger.text,  bg: colors.feedback.danger.bg },
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  event: EventInfo | null
  activeSection: Section
  onSection: (s: Section) => void
  currentUser: { full_name?: string | null; avatar_url?: string | null }
  onLogout: () => void
}

function EventSidebar({ collapsed, onToggle, event, activeSection, onSection, currentUser, onLogout }: SidebarProps) {
  const [logoutHover, setLogoutHover] = useState(false)

  const initials = (currentUser.full_name ?? '')
    .split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'

  const w = collapsed ? '58px' : '220px'

  return (
    <aside style={{ width: w, minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'width 200ms ease', overflow: 'hidden', flexShrink: 0 }}>

      {/* User info + toggle */}
      <div style={{ padding: collapsed ? '10px 0' : '10px 10px 10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {collapsed ? (
          <button onClick={onToggle} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ChevronRight size={15} />
          </button>
        ) : (
          <>
            {currentUser.avatar_url ? (
              <Image src={currentUser.avatar_url} alt="" width={28} height={28} style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover', width: '28px', height: '28px' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 700, color: '#fff' }}>{initials}</div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.full_name}</p>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)' }}>Organisateur</p>
            </div>
            <button onClick={onToggle} style={{ width: '24px', height: '24px', borderRadius: '5px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0, opacity: 0.5 }}>
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* Event name */}
      {!collapsed && event && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Événement</p>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '8px 0' : '8px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {NAV_ITEMS.map(item => {
          const active = activeSection === item.section
          return (
            <button key={item.section} onClick={() => onSection(item.section)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '9px 0' : '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 500, transition: 'all 150ms ease', justifyContent: collapsed ? 'center' : 'flex-start', backgroundColor: active ? 'var(--bg-primary)' : 'transparent', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', width: '100%', textAlign: 'left' }}>
              <span style={{ color: active ? colors.violet.primary : colors.violet.primary, flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <span style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', backgroundColor: colors.violet.primary, flexShrink: 0 }} />}
            </button>
          )
        })}
      </nav>

      {/* Back to dashboard + logout */}
      <div style={{ padding: collapsed ? '10px 0' : '10px 6px', borderTop: '1px solid var(--border-color)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '7px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <ArrowLeft size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Mon dashboard</span>}
        </Link>
        <button onClick={onLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '8px 0' : '8px 10px', borderRadius: '7px', border: 'none', backgroundColor: logoutHover ? 'var(--bg-primary)' : 'transparent', cursor: 'pointer', color: logoutHover ? colors.feedback.danger.solid : 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, transition: 'all 150ms ease', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%' }}>
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DashboardClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [event, setEvent]     = useState<EventInfo | null>(null)
  const [stats, setStats]     = useState<Stats | null>(null)
  const [recent, setRecent]   = useState<RecentApp[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId]   = useState<string | null>(null)
  const [resolvedId, setResolvedId] = useState<string>(eventId)
  const [currentUser, setCurrentUser] = useState<{ full_name?: string | null; avatar_url?: string | null }>({})
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('overview')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { router.push('/login'); return }
      setUserId(session.user.id)
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    load(userId)
  }, [userId, eventId])

  async function load(uid: string) {
    setLoading(true)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)
    const evQuery = supabase.from('events').select('id, title, city, start_date, end_date, status, stand_count, organizer_id')
    const { data: ev } = await (isUuid ? evQuery.eq('id', eventId) : evQuery.eq('slug', eventId)).single()

    if (!ev) { router.push('/dashboard'); return }
    if (ev.organizer_id !== uid) {
      const { data: teamEntry } = await supabase
        .from('event_team')
        .select('id')
        .eq('event_id', ev.id)
        .eq('user_id', uid)
        .maybeSingle()
      if (!teamEntry) { router.push('/dashboard'); return }
    }

    const rid = ev.id
    setResolvedId(rid)

    const [{ data: apps }, { data: profile }] = await Promise.all([
      supabase.from('applications').select('id, status, created_at, profiles(full_name, avatar_url)').eq('event_id', rid).order('created_at', { ascending: false }),
      supabase.from('profiles').select('full_name, avatar_url').eq('id', uid).single(),
    ])

    setCurrentUser({ full_name: profile?.full_name, avatar_url: profile?.avatar_url })
    setEvent({ title: ev.title, city: ev.city ?? '', start_date: ev.start_date, end_date: ev.end_date, status: ev.status, stand_count: ev.stand_count ?? 0 })

    const list = apps ?? []
    const accepted = list.filter(a => a.status === 'accepted').length
    setStats({
      total:     list.length,
      pending:   list.filter(a => a.status === 'pending').length,
      accepted,
      refused:   list.filter(a => a.status === 'refused').length,
      standCount: ev.stand_count ?? 0,
      remaining:  Math.max(0, (ev.stand_count ?? 0) - accepted),
    })
    setRecent(list.slice(0, 6) as RecentApp[])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function daysUntil(d: string) {
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  }

  const fillPct = stats && stats.standCount > 0 ? Math.round((stats.accepted / stats.standCount) * 100) : 0
  const evStatus = event ? (EVENT_STATUS[event.status] ?? EVENT_STATUS.draft) : null
  const daysLeft = event?.start_date ? daysUntil(event.start_date) : null

  if (loading) return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${colors.violet.wash}`, borderTopColor: colors.violet.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chargement...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex' }}>

      {/* Sidebar */}
      <div className="evdash-sidebar">
        <EventSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          event={event}
          activeSection={activeSection}
          onSection={setActiveSection}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, backgroundColor: 'var(--bg-primary)' }}>

        {/* Header band */}
        <div style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{event?.title}</h1>
                {evStatus && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, backgroundColor: evStatus.bg, color: evStatus.color }}>
                    {evStatus.label}
                  </span>
                )}
                {daysLeft !== null && daysLeft > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: daysLeft <= 7 ? colors.feedback.danger.solid : daysLeft <= 30 ? '#F59E0B' : colors.feedback.success.text }}>
                    J-{daysLeft}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                {event?.city && <>{event.city} · </>}
                {event?.start_date && fmtDate(event.start_date)}
                {event?.end_date && event.end_date !== event.start_date && <> → {fmtDate(event.end_date)}</>}
                {activeSection !== 'overview' && (
                  <span style={{ marginLeft: 8, color: colors.violet.primary, fontWeight: 600 }}>
                    · {NAV_ITEMS.find(n => n.section === activeSection)?.label}
                  </span>
                )}
              </p>
            </div>
            <Link href={`/events/${resolvedId}/edit`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              <Edit size={13} /> Modifier
            </Link>
          </div>
        </div>

        {/* Section content */}
        {activeSection === 'overview' && (
          <div style={{ padding: '24px' }}>
            {/* Bento stats */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'auto auto', gap: 10, marginBottom: 20 }}>

              {/* Big: total candidatures */}
              <div style={{ gridColumn: '1 / 4', gridRow: '1 / 3', padding: '28px', borderRadius: 16, backgroundColor: colors.violet.primary, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 160 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px 1px, transparent 1px 10px)', pointerEvents: 'none' }} />
                <div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>Candidatures</span>
                  <p style={{ fontSize: 64, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>{stats?.total ?? 0}</p>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>candidatures reçues au total</p>
              </div>

              {/* Places libres + remplissage */}
              <div style={{ gridColumn: '4 / 7', gridRow: '1 / 2', padding: '20px 24px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Places libres</p>
                  <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{stats?.remaining ?? 0}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: fillPct >= 80 ? colors.feedback.success.text : fillPct >= 50 ? '#F59E0B' : colors.violet.primary }}>{fillPct}%</span>
                  <div style={{ width: 100, height: 6, borderRadius: 99, backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, borderRadius: 99, backgroundColor: fillPct >= 80 ? colors.feedback.success.border : fillPct >= 50 ? '#F59E0B' : colors.violet.primary, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{stats?.accepted ?? 0} / {stats?.standCount ?? 0} stands</span>
                </div>
              </div>

              {/* En attente */}
              <div style={{ gridColumn: '4 / 5', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>En attente</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats?.pending ?? 0}</p>
              </div>

              {/* Acceptés */}
              <div style={{ gridColumn: '5 / 6', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: colors.feedback.success.text, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Acceptés</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats?.accepted ?? 0}</p>
              </div>

              {/* Refusés */}
              <div style={{ gridColumn: '6 / 7', gridRow: '2 / 3', padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: colors.feedback.danger.solid, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Refusés</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{stats?.refused ?? 0}</p>
              </div>

            </motion.div>

            {/* 2-col: recent apps + quick actions */}
            <div className="evdash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', margin: 0 }}>Candidatures récentes</p>
                  <button onClick={() => setActiveSection('exhibitors')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: colors.violet.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Voir tout <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recent.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', borderRadius: 10, border: '1px dashed var(--border-color)' }}>
                      <Users size={20} color='var(--text-secondary)' style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Aucune candidature pour l'instant</p>
                    </div>
                  ) : recent.map((app, i) => {
                    const s = STATUS_CFG[app.status] ?? STATUS_CFG.pending
                    const ini = app.profiles?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                    return (
                      <motion.div key={app.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.16, delay: 0.15 + i * 0.04 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: colors.violet.wash, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: colors.violet.primary, flexShrink: 0 }}>{ini}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.profiles?.full_name ?? 'Créateur'}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{new Date(app.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, backgroundColor: s.bg, flexShrink: 0 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Infos événement */}
                {event && (() => {
                  const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
                    published: { label: 'Publié',  color: colors.feedback.success.text, bg: colors.feedback.success.bg },
                    draft:     { label: 'Brouillon', color: '#92400E', bg: '#FFFBEB' },
                    closed:    { label: 'Clôturé', color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
                  }
                  const sc = statusCfg[event.status] ?? statusCfg.draft
                  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', margin: 0 }}>Informations</p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                      </div>
                      {[
                        { icon: <MapPin size={13} />,      label: event.city || 'Ville non définie' },
                        { icon: <CalendarDays size={13} />, label: fmt(event.start_date) },
                        { icon: <CalendarDays size={13} />, label: `Fin : ${fmt(event.end_date)}` },
                        { icon: <LayoutDashboard size={13} />, label: `${event.stand_count} stand${event.stand_count > 1 ? 's' : ''} configuré${event.stand_count > 1 ? 's' : ''}` },
                      ].map((row, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: colors.violet.primary, flexShrink: 0, display: 'flex' }}>{row.icon}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.label}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* À traiter */}
                {stats && stats.pending > 0 && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid #FDE68A`, backgroundColor: '#FFFBEB', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={13} color='#D97706' />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                        {stats.pending} candidature{stats.pending > 1 ? 's' : ''} en attente
                      </span>
                    </div>
                    <button onClick={() => setActiveSection('exhibitors')}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, border: 'none', backgroundColor: '#D97706', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Examiner <ChevronRight size={12} />
                    </button>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}

        {activeSection === 'candidatures'  && <ExhibitorsClient eventId={resolvedId} defaultTab="dashboard" solo />}
        {activeSection === 'exhibitors'   && <ExhibitorsClient eventId={resolvedId} defaultTab="form-setup" solo />}
        {activeSection === 'analytics'    && <AnalyticsClient eventId={resolvedId} />}
        {activeSection === 'waitlist'     && <WaitlistClient eventId={resolvedId} />}
        {activeSection === 'team'         && <TeamCollaborationClient eventId={resolvedId} />}
        {activeSection === 'volunteers'   && <VolunteersClient eventId={resolvedId} />}
        {activeSection === 'collaboration'&& <CollaborationClient eventId={resolvedId} />}
        {activeSection === 'marketing'    && <MarketingClient eventId={resolvedId} />}
        {activeSection === 'stands'       && <StandsClient eventId={resolvedId} />}
        {activeSection === 'faqs'         && <FAQsClient eventId={resolvedId} />}
      </div>

      <style>{`
        .evdash-sidebar { flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow-y: auto; overflow-x: hidden; }
        @media (max-width: 768px) { .evdash-sidebar { display: none; } }
        @media (max-width: 900px) { .evdash-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
