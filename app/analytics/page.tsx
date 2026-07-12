'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Users, Calendar, BarChart2, Award, Eye } from 'lucide-react'

interface EventStat {
  event_id: string
  title: string
  start_date: string
  stand_count: number
  total_applications: number
  pending_count: number
  accepted_count: number
  refused_count: number
  fill_rate_pct: number
}

interface CreatorStat {
  creator_id: string
  full_name: string
  total_applications: number
  accepted_count: number
  refused_count: number
  acceptance_rate_pct: number
  profile_views_30d: number
}

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  const [eventStats, setEventStats] = useState<EventStat[]>([])
  const [creatorStats, setCreatorStats] = useState<CreatorStat | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

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
    const load = async () => {
      setLoading(true)
      if (user.role === 'organizer') {
        const { data } = await supabase.from('event_analytics').select('*').eq('organizer_id', user.id).order('start_date', { ascending: false })
        setEventStats((data || []) as unknown as EventStat[])
      } else if (user.role === 'creator') {
        const { data } = await supabase.from('creator_analytics').select('*').eq('creator_id', user.id).single()
        setCreatorStats(data as CreatorStat | null)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (!user || loading) return (
    <div className="bg-white min-h-screen">
      <div className="h-48 bg-[#06060f] animate-pulse" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-16 left-0 w-72 h-72 rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-14 relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/40 text-sm hover:text-white/70 transition-colors mb-5">
              <ArrowLeft size={14} /> Tableau de bord
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Analytiques</h1>
            <p className="text-white/40 text-sm mt-2">
              {user.role === 'organizer' ? 'Performances de vos événements' : 'Vos statistiques de créateur'}
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* Organizer */}
        {user.role === 'organizer' && (
          eventStats.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <BarChart2 size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-base font-semibold text-gray-500 mb-1">Aucun événement pour le moment</p>
              <p className="text-sm text-gray-400 mb-6">Créez votre premier événement pour voir les statistiques</p>
              <Link href="/events/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors">
                Créer un événement
              </Link>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Événements',             value: eventStats.length,                                                          icon: <Calendar size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
                  { label: 'Candidatures totales',   value: eventStats.reduce((s, e) => s + e.total_applications, 0),                  icon: <Users size={20} className="text-indigo-600" />,   bg: 'bg-indigo-50' },
                  { label: 'Créateurs acceptés',     value: eventStats.reduce((s, e) => s + e.accepted_count, 0),                      icon: <Award size={20} className="text-indigo-600" />,   bg: 'bg-indigo-50' },
                  { label: 'Taux de remplissage moy', value: eventStats.length ? `${Math.round(eventStats.reduce((s, e) => s + e.fill_rate_pct, 0) / eventStats.length)}%` : '—', icon: <TrendingUp size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                    <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-black text-gray-900 leading-none mb-1">{stat.value}</p>
                    <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden mb-6 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="text-base font-bold text-gray-900">Par événement</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {['Événement', 'Date', 'Candidatures', 'Acceptés', 'En attente', 'Remplissage'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {eventStats.map((ev, i) => (
                        <tr key={ev.event_id}
                          onClick={() => setSelected(selected === ev.event_id ? null : ev.event_id)}
                          className={`border-t border-gray-50 cursor-pointer transition-colors duration-100 ${
                            selected === ev.event_id ? 'bg-indigo-50/60' : 'hover:bg-gray-50/60'
                          }`}>
                          <td className="px-4 py-3.5">
                            <Link href={`/events/${ev.event_id}`} onClick={e => e.stopPropagation()}
                              className="text-sm font-bold text-gray-900 hover:text-indigo-700 transition-colors">{ev.title}</Link>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                            {ev.start_date ? new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-center">{ev.total_applications}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{ev.accepted_count}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">{ev.pending_count}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${ev.fill_rate_pct}%`,
                                    backgroundColor: ev.fill_rate_pct >= 80 ? '#10B981' : ev.fill_rate_pct >= 50 ? '#F59E0B' : '#E05A5A',
                                  }} />
                              </div>
                              <span className="text-xs font-bold text-gray-700 min-w-[36px]">{ev.fill_rate_pct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comparative bars */}
              {eventStats.length >= 2 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-5">Comparatif des événements</h2>
                  <div className="flex flex-col gap-4">
                    {eventStats.slice(0, 5).map(ev => {
                      const maxApps = Math.max(...eventStats.map(e => e.total_applications), 1)
                      return (
                        <div key={ev.event_id}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-semibold text-gray-700 truncate max-w-[200px]">{ev.title}</span>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">{ev.total_applications} candidatures · {ev.fill_rate_pct}% rempli</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(ev.total_applications / maxApps) * 100}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* Creator */}
        {user.role === 'creator' && (
          !creatorStats ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <TrendingUp size={40} className="text-gray-200 mx-auto mb-4" />
              <p className="text-base font-semibold text-gray-500 mb-1">Pas encore de données</p>
              <p className="text-sm text-gray-400">Postulez à des événements pour voir vos statistiques</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Candidatures envoyées', value: creatorStats.total_applications,    icon: <Calendar size={20} className="text-indigo-600" />,  bg: 'bg-indigo-50' },
                { label: 'Candidatures acceptées', value: creatorStats.accepted_count,       icon: <Award size={20} className="text-indigo-600" />,    bg: 'bg-indigo-50' },
                { label: "Taux d'acceptation",     value: `${creatorStats.acceptance_rate_pct}%`, icon: <TrendingUp size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
                { label: 'Vues profil (30 jours)', value: creatorStats.profile_views_30d,   icon: <Eye size={20} className="text-indigo-600" />,       bg: 'bg-indigo-50' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-black text-gray-900 leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-semibold text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
