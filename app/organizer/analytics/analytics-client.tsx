'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart2, Users, CheckCircle, Clock, Eye, TrendingUp, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

interface KPI {
  totalApplications: number
  accepted: number
  refused: number
  pending: number
  acceptanceRate: number
  profileViews: number
}

interface EventStat {
  event_id: string
  title: string
  status: string
  stand_count: number
  total: number
  accepted: number
  refused: number
  pending: number
  fill_rate: number
}

interface AnalyticsData {
  kpi: KPI
  eventsByStatus: { draft: number; published: number; closed: number }
  applicationsPerEvent: EventStat[]
  topDisciplines: { discipline: string; count: number }[]
}

// Animated counter
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = Date.now()
    const from = 0
    const step = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <>{display}</>
}

function Skeleton({ width, height }: { width?: string | number; height?: string | number }) {
  return (
    <div
      style={{
        width: width || '100%',
        height: height || 16,
        borderRadius: 8,
        background: 'linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulse-skeleton 1.5s infinite',
      }}
    />
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#10B981',
  refused: '#EF4444',
  draft: '#9CA3AF',
  published: '#6366F1',
  closed: '#6B7280',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  closed: 'Clôturé',
}

export default function AnalyticsClient() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const res = await fetch('/api/organizer/analytics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.status === 401) { router.replace('/login'); return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Erreur lors du chargement')
        setLoading(false)
        return
      }
      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    load()
  }, [user, router])

  if (loading) return <LoadingSkeleton />
  if (error) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#EF4444', fontSize: 16 }}>
        <BarChart2 size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>{error}</p>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, eventsByStatus, applicationsPerEvent, topDisciplines } = data
  const totalEvents = eventsByStatus.draft + eventsByStatus.published + eventsByStatus.closed
  const maxApps = Math.max(...applicationsPerEvent.map(e => e.total), 1)
  const maxDiscipline = Math.max(...topDisciplines.map(d => d.count), 1)

  const pieTotal = totalEvents || 1
  const pieSlices = [
    { label: 'Publié', value: eventsByStatus.published, color: '#6366F1' },
    { label: 'Clôturé', value: eventsByStatus.closed, color: '#6B7280' },
    { label: 'Brouillon', value: eventsByStatus.draft, color: '#9CA3AF' },
  ]

  // SVG Pie chart
  let cumulativeAngle = -Math.PI / 2
  const cx = 70
  const cy = 70
  const r = 60
  const pieSegments = pieSlices.map(slice => {
    const angle = (slice.value / pieTotal) * 2 * Math.PI
    const x1 = cx + r * Math.cos(cumulativeAngle)
    const y1 = cy + r * Math.sin(cumulativeAngle)
    cumulativeAngle += angle
    const x2 = cx + r * Math.cos(cumulativeAngle)
    const y2 = cy + r * Math.sin(cumulativeAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const d = angle > 0.001
      ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
      : ''
    return { ...slice, d }
  })

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 64px)' }}>
      <style>{`
        @keyframes pulse-skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Hero dark */}
      <div className="bg-[#06060f] relative overflow-hidden">
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 48px', position: 'relative', zIndex: 10 }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: 13, marginBottom: 20, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Retour au dashboard
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={20} color="#6366F1" />
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Analytics</h1>
            </div>
            <p style={{ fontSize: 15, color: '#9CA3AF', margin: 0 }}>Vue d'ensemble des performances de vos événements</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Total candidatures', value: kpi.totalApplications, icon: <Users size={18} color="#6366F1" />, color: '#EEF2FF' },
            { label: 'Acceptées', value: kpi.accepted, icon: <CheckCircle size={18} color="#10B981" />, color: '#ECFDF5' },
            { label: 'Taux d\'acceptation', value: kpi.acceptanceRate, icon: <TrendingUp size={18} color="#F59E0B" />, color: '#FFFBEB', suffix: '%' },
            { label: 'Vues profil (30j)', value: kpi.profileViews, icon: <Eye size={18} color="#8B5CF6" />, color: '#F5F3FF' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
                <AnimatedNumber value={card.value} />{card.suffix || ''}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 40, alignItems: 'start' }}>

          {/* Bar chart — candidatures par événement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px' }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 20, marginTop: 0 }}>
              Candidatures par événement
            </h2>
            {applicationsPerEvent.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontSize: 14 }}>Aucun événement trouvé</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applicationsPerEvent.slice(0, 8).map(ev => (
                  <div key={ev.event_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#1A1A1A', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>{ev.total} candidature{ev.total !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(ev.total / maxApps) * 100}%` }}
                        transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', background: '#6366F1', borderRadius: 6 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 11, color: '#10B981' }}>{ev.accepted} acc.</span>
                      <span style={{ fontSize: 11, color: '#F59E0B' }}>{ev.pending} att.</span>
                      <span style={{ fontSize: 11, color: '#EF4444' }}>{ev.refused} ref.</span>
                      {ev.stand_count > 0 && (
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                          {ev.fill_rate}% rempli
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pie chart — events by status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px' }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 16, marginTop: 0 }}>
              Événements par statut
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <svg viewBox="0 0 140 140" width={140} height={140}>
                {totalEvents === 0 ? (
                  <circle cx={cx} cy={cy} r={r} fill="#F3F4F6" />
                ) : (
                  pieSegments.map((seg, i) => (
                    seg.d ? <path key={i} d={seg.d} fill={seg.color} stroke="#FFF" strokeWidth={2} /> : null
                  ))
                )}
                <circle cx={cx} cy={cy} r={36} fill="#FFF" />
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill="#1A1A1A">{totalEvents}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="#888">événements</text>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieSlices.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#1A1A1A' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top disciplines */}
        {topDisciplines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 40 }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 20, marginTop: 0 }}>
              Top disciplines (créateurs acceptés)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {topDisciplines.map((d, i) => (
                <div key={d.discipline}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#1A1A1A', textTransform: 'capitalize' }}>{d.discipline}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>{d.count}</span>
                  </div>
                  <div style={{ background: '#F3F4F6', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(d.count / maxDiscipline) * 100}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                      style={{ height: '100%', background: '#818CF8', borderRadius: 6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Events table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Détail par événement</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Titre', 'Statut', 'Candidatures', 'Acceptées', 'En attente', 'Taux remplissage'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applicationsPerEvent.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 14 }}>
                      Aucun événement
                    </td>
                  </tr>
                ) : applicationsPerEvent.map((ev, i) => (
                  <tr key={ev.event_id} style={{ borderTop: '1px solid #F3F4F6', background: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1A1A1A', maxWidth: 220 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {ev.title}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: STATUS_COLORS[ev.status] + '22',
                        color: STATUS_COLORS[ev.status],
                      }}>
                        {STATUS_LABELS[ev.status] || ev.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>{ev.total}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#10B981', fontWeight: 600 }}>{ev.accepted}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#F59E0B', fontWeight: 600 }}>{ev.pending}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {ev.stand_count > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 6, minWidth: 60 }}>
                            <div style={{ width: `${Math.min(ev.fill_rate, 100)}%`, height: '100%', background: '#6366F1', borderRadius: 4, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{ev.fill_rate}%</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ background: '#06060f', height: 160 }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
              <Skeleton width={36} height={36} />
              <div style={{ marginTop: 12 }}><Skeleton width={80} height={28} /></div>
              <div style={{ marginTop: 6 }}><Skeleton width={120} height={14} /></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 40 }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
            <Skeleton width={200} height={20} />
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ animationDelay: `${i * 80}ms` }}><Skeleton height={24} /></div>)}
            </div>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
            <Skeleton width={140} height={20} />
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}><Skeleton width={140} height={140} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}
