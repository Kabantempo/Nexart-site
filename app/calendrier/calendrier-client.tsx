'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'

interface EventItem {
  id: string
  title: string
  start_date: string
  end_date: string
  city: string
  status: string
  cover_image?: string
}

const STATUS_PILL_BG: Record<string, string> = {
  published: 'rgba(99,102,241,0.2)',
  draft:     'rgba(245,158,11,0.2)',
  closed:    'rgba(156,163,175,0.15)',
}

const STATUS_PILL_COLOR: Record<string, string> = {
  published: '#6366F1',
  draft:     '#F59E0B',
  closed:    'var(--text-tertiary)',
}

const STATUS_DOT_COLOR: Record<string, string> = {
  published: '#6366F1',
  draft:     '#F59E0B',
  closed:    '#9CA3AF',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']

export default function CalendrierPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
        if (profile?.role !== 'organizer') { router.push('/dashboard'); return }
      } else if (user.role !== 'organizer') {
        router.push('/dashboard')
      }
    })
  }, [router, user, setUser])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('events')
        .select('id, title, start_date, end_date, city, status, cover_image')
        .eq('organizer_id', user.id)
        .order('start_date', { ascending: true })
      setEvents((data || []) as EventItem[])
      setLoading(false)
    }
    load()
  }, [user])

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1); setSelectedDay(null) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1); setSelectedDay(null) }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day)
    return events.filter(ev => {
      const start = new Date(ev.start_date)
      const end = new Date(ev.end_date)
      return date >= start && date <= end
    })
  }

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []
  const monthEvents = events.filter(ev => {
    const start = new Date(ev.start_date)
    const end = new Date(ev.end_date)
    return start <= new Date(year, month + 1, 0) && end >= new Date(year, month, 1)
  })

  if (!user || loading) return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`@keyframes cal-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      <div style={{ height: '192px', backgroundColor: '#06060f', animation: 'cal-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '40px 16px 80px' }}>
        <div style={{ height: '384px', borderRadius: '16px', backgroundColor: '#F3F4F6', animation: 'cal-pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  )

  const sidebarItems = selectedDay ? selectedEvents : monthEvents

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes cal-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .cal-main-grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start }
        @media (min-width: 1024px) { .cal-main-grid { grid-template-columns: 1fr 260px } }
        .cal-grid-7 { display: grid; grid-template-columns: repeat(7, 1fr) }
        .cal-day-nav { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #fff; transition: all 0.15s }
        .cal-day-nav:hover { border-color: #D1D5DB; background: #F9FAFB }
        .cal-hero-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.4); font-size: 14px; text-decoration: none; margin-bottom: 20px; transition: color 0.15s }
        .cal-hero-back:hover { color: rgba(255,255,255,0.7) }
        .cal-create-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; background: #4F46E5; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; transition: background 0.15s }
        .cal-create-btn:hover { background: #4338CA }
        .cal-sidebar-link { display: block; padding: 16px; border-radius: 12px; border: 1px solid #F3F4F6; background: #fff; text-decoration: none; transition: all 0.15s }
        .cal-sidebar-link:hover { border-color: #C7D2FE; box-shadow: 0 1px 4px rgba(0,0,0,0.06) }
        .cal-sidebar-link:hover .cal-ev-title { color: #4338CA }
      `}</style>

      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: '-96px', right: '-96px', width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(234,88,12,0.15)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-64px', left: 0, width: '288px', height: '288px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '64px 16px 56px', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Link href="/dashboard" className="cal-hero-back">
              <ArrowLeft size={14} /> Tableau de bord
            </Link>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Calendrier</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px' }}>
                  {events.length} événement{events.length > 1 ? 's' : ''} · {monthEvents.length} ce mois-ci
                </p>
              </div>
              <Link href="/events/create" className="cal-create-btn">
                <Plus size={15} /> Créer un événement
              </Link>
            </div>
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px 16px 96px' }}>
        <div className="cal-main-grid">

          {/* Calendar */}
          <div style={{ borderRadius: '16px', border: '1px solid #F3F4F6', backgroundColor: '#fff', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #FAFAFA' }}>
              <button onClick={prevMonth} className="cal-day-nav">
                <ChevronLeft size={16} color="#6B7280" />
              </button>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{MONTHS_FR[month]} {year}</h2>
              <button onClick={nextMonth} className="cal-day-nav">
                <ChevronRight size={16} color="#6B7280" />
              </button>
            </div>

            {/* Day headers */}
            <div className="cal-grid-7" style={{ borderBottom: '1px solid #FAFAFA' }}>
              {DAYS_FR.map(d => (
                <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="cal-grid-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} style={{ minHeight: '72px', backgroundColor: 'rgba(249,250,251,0.5)', borderRight: '1px solid #FAFAFA', borderBottom: '1px solid #FAFAFA' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvs = getEventsForDay(day)
                const isToday = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year
                const isSelected = selectedDay === day

                return (
                  <div key={day}
                    onClick={() => dayEvs.length > 0 && setSelectedDay(isSelected ? null : day)}
                    style={{ minHeight: '72px', padding: '6px', borderRight: '1px solid #FAFAFA', borderBottom: '1px solid #FAFAFA', cursor: dayEvs.length > 0 ? 'pointer' : 'default', backgroundColor: isSelected ? 'rgba(238,242,255,0.6)' : 'transparent', transition: 'background-color 100ms' }}
                    onMouseEnter={e => { if (!isSelected && dayEvs.length > 0) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(249,250,251,0.8)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isSelected ? 'rgba(238,242,255,0.6)' : 'transparent' }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, marginBottom: '4px', backgroundColor: isToday ? '#4F46E5' : 'transparent', color: isToday ? '#fff' : '#374151' }}>{day}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayEvs.slice(0, 2).map(ev => (
                        <div key={ev.id}
                          style={{ padding: '1px 4px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', backgroundColor: STATUS_PILL_BG[ev.status] ?? 'rgba(99,102,241,0.15)', color: STATUS_PILL_COLOR[ev.status] ?? '#6366F1' }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 2 && (
                        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, paddingLeft: '4px' }}>+{dayEvs.length - 2}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedDay ? `${selectedDay} ${MONTHS_FR[month]}` : `${MONTHS_FR[month]} ${year}`}
            </h3>

            {sidebarItems.length === 0 ? (
              <div style={{ padding: '32px 0', borderRadius: '16px', border: '1px dashed #E5E7EB', textAlign: 'center' }}>
                <Calendar size={24} color="#E5E7EB" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Aucun événement</p>
              </div>
            ) : (
              sidebarItems.map(ev => (
                <Link key={ev.id} href={`/events/${ev.id}`} className="cal-sidebar-link">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '9999px', marginTop: '6px', flexShrink: 0, backgroundColor: STATUS_DOT_COLOR[ev.status] ?? '#9CA3AF' }} />
                    <div style={{ minWidth: 0 }}>
                      <p className="cal-ev-title" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{ev.title}</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                        {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {ev.start_date !== ev.end_date ? ` → ${new Date(ev.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                      </p>
                      {ev.city && <p style={{ fontSize: '12px', color: '#818CF8', marginTop: '2px' }}>{ev.city}</p>}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
