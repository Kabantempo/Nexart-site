'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, Clock, CheckCircle, XCircle, BarChart2,
  Mail, UserCheck, Wrench, ClipboardList, CalendarDays, Settings,
  FileText, ListChecks, Megaphone, MapPin, Edit,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { colors } from '@/lib/design-tokens'

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
}

const TOOLS = [
  { label: 'Exposants',      href: (id: string) => `/events/${id}/exhibitors`,        icon: Users },
  { label: 'Analytics',      href: (id: string) => `/events/${id}/analytics`,          icon: BarChart2 },
  { label: "Liste d'attente",href: (id: string) => `/events/${id}/waitlist`,           icon: ClipboardList },
  { label: 'Équipe',         href: (id: string) => `/events/${id}/team`,               icon: UserCheck },
  { label: 'Bénévoles',      href: (id: string) => `/events/${id}/volunteers`,         icon: CalendarDays },
  { label: 'Campagnes',      href: (id: string) => `/events/${id}/campaigns`,          icon: Megaphone },
  { label: 'Collaboration',  href: (id: string) => `/events/${id}/collaboration`,      icon: ListChecks },
  { label: 'Checklist',      href: (id: string) => `/events/${id}/settings/checklist`, icon: CheckCircle },
  { label: 'Marketing',      href: (id: string) => `/events/${id}/settings/marketing`, icon: Mail },
  { label: 'Rappels',        href: (id: string) => `/events/${id}/settings/reminders`, icon: Clock },
  { label: 'Plan stands',    href: (id: string) => `/events/${id}/settings/stands`,    icon: MapPin },
  { label: 'Paramètres FAQ', href: (id: string) => `/events/${id}/settings/faqs`,     icon: Settings },
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'En attente', color: colors.feedback.warning.solid, bg: colors.red.bgFbeb },
  accepted: { label: 'Accepté',    color: colors.feedback.success.solid, bg: colors.green.bgPale },
  refused:  { label: 'Refusé',     color: colors.feedback.danger.solid,  bg: colors.red.bg },
}

export default function DashboardClient({ eventId }: { eventId: string }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<RecentApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    load()
  }, [user, eventId])

  async function load() {
    setLoading(true)

    const [{ data: ev }, { data: apps }] = await Promise.all([
      supabase.from('events').select('title, city, start_date, end_date, status, stand_count, organizer_id').eq('id', eventId).single(),
      supabase.from('applications').select('id, status, created_at, profiles(full_name, avatar_url)').eq('event_id', eventId).order('created_at', { ascending: false }),
    ])

    if (!ev || ev.organizer_id !== user?.id) { router.push('/dashboard'); return }

    setEvent({ title: ev.title, city: ev.city, start_date: ev.start_date, end_date: ev.end_date, status: ev.status })

    const list = apps ?? []
    const accepted = list.filter(a => a.status === 'accepted').length
    setStats({
      total: list.length,
      pending: list.filter(a => a.status === 'pending').length,
      accepted,
      refused: list.filter(a => a.status === 'refused').length,
      standCount: ev.stand_count ?? 0,
      remaining: Math.max(0, (ev.stand_count ?? 0) - accepted),
    })
    setRecent(list.slice(0, 5) as RecentApp[])
    setLoading(false)
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Link href={`/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} /> Retour à l'événement
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>{event?.title}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                {event?.city} · {fmtDate(event?.start_date ?? '')} → {fmtDate(event?.end_date ?? '')}
              </p>
            </div>
            <Link href={`/events/${eventId}/edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
              <Edit size={14} /> Modifier l'événement
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 40 }}>
          {[
            { label: 'Candidatures', value: stats?.total ?? 0, icon: FileText, color: colors.violet.primary, bg: colors.violet.bg },
            { label: 'En attente',   value: stats?.pending ?? 0, icon: Clock,     color: colors.feedback.warning.solid, bg: colors.red.bgFbeb },
            { label: 'Acceptés',     value: stats?.accepted ?? 0, icon: CheckCircle, color: colors.feedback.success.solid, bg: colors.green.bgPale },
            { label: 'Refusés',      value: stats?.refused ?? 0, icon: XCircle,   color: colors.feedback.danger.solid,  bg: colors.red.bg },
            { label: 'Places restantes', value: stats?.remaining ?? 0, icon: MapPin, color: colors.violet.primary, bg: colors.violet.bg },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={15} color={s.color} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

          {/* Tools grid */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 14px' }}>Outils</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {TOOLS.map(tool => (
                <Link key={tool.label} href={tool.href(eventId)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 12, fontWeight: 600, textAlign: 'center', transition: 'border-color 0.15s' }}>
                  <tool.icon size={18} color={colors.violet.primary} />
                  {tool.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent applications */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Candidatures récentes</p>
              <Link href={`/events/${eventId}/exhibitors`} style={{ fontSize: 12, color: colors.violet.primary, textDecoration: 'none', fontWeight: 600 }}>Voir tout</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recent.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>Aucune candidature</p>
              ) : recent.map(app => {
                const s = STATUS_LABELS[app.status] ?? STATUS_LABELS.pending
                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.violet.primary, flexShrink: 0 }}>
                      {app.profiles?.full_name?.[0] ?? '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.profiles?.full_name ?? 'Créateur'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                        {new Date(app.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, color: s.color, backgroundColor: s.bg, whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .db-grid { grid-template-columns: 1fr !important; }
          .db-tools { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
