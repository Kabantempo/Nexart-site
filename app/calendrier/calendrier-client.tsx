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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  published: { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  draft:     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  closed:    { bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400' },
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
    <div className="bg-white min-h-screen">
      <div className="h-48 bg-[#06060f] animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  )

  const sidebarItems = selectedDay ? selectedEvents : monthEvents

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-600/15 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-16 left-0 w-72 h-72 rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-14 relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 transition-colors mb-5">
              <ArrowLeft size={14} /> Tableau de bord
            </Link>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Calendrier</h1>
                <p className="text-white/40 text-sm mt-2">
                  {events.length} événement{events.length > 1 ? 's' : ''} · {monthEvents.length} ce mois-ci
                </p>
              </div>
              <Link href="/events/create"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
                <Plus size={15} /> Créer un événement
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
        <div className="grid lg:grid-cols-[1fr_260px] gap-6 items-start">

          {/* Calendar */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <button onClick={prevMonth}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all">
                <ChevronLeft size={16} className="text-gray-500" />
              </button>
              <h2 className="text-base font-bold text-gray-900">{MONTHS_FR[month]} {year}</h2>
              <button onClick={nextMonth}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all">
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-50">
              {DAYS_FR.map(d => (
                <div key={d} className="py-2.5 text-center text-[11px] font-bold text-gray-300 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} className="min-h-[72px] bg-gray-50/50 border-r border-b border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvs = getEventsForDay(day)
                const isToday = now.getDate() === day && now.getMonth() === month && now.getFullYear() === year
                const isSelected = selectedDay === day

                return (
                  <div key={day}
                    onClick={() => dayEvs.length > 0 && setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[72px] p-1.5 border-r border-b border-gray-50 transition-colors duration-100 ${
                      dayEvs.length > 0 ? 'cursor-pointer' : ''
                    } ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50/80'}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold mb-1 ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                    }`}>{day}</div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvs.slice(0, 2).map(ev => (
                        <div key={ev.id}
                          className="px-1 py-0.5 rounded text-[10px] font-semibold truncate"
                          style={{ backgroundColor: STATUS_PILL_BG[ev.status] ?? 'rgba(99,102,241,0.15)', color: STATUS_PILL_COLOR[ev.status] ?? '#6366F1' }}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvs.length > 2 && (
                        <span className="text-[10px] text-gray-400 font-semibold pl-1">+{dayEvs.length - 2}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {selectedDay ? `${selectedDay} ${MONTHS_FR[month]}` : `${MONTHS_FR[month]} ${year}`}
            </h3>

            {sidebarItems.length === 0 ? (
              <div className="py-8 rounded-2xl border border-dashed border-gray-200 text-center">
                <Calendar size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Aucun événement</p>
              </div>
            ) : (
              sidebarItems.map(ev => {
                const sc = STATUS_COLORS[ev.status] ?? STATUS_COLORS.closed
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`}
                    className="block p-4 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-150 group">
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sc.dot}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {ev.start_date !== ev.end_date ? ` → ${new Date(ev.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                        </p>
                        {ev.city && <p className="text-xs text-indigo-400 mt-0.5">{ev.city}</p>}
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
