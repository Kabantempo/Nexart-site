'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { TrendingUp, MapPin, Calendar, Users, ArrowRight } from 'lucide-react'

type DisciplineCount = { name: string; count: number }
type RegionCount = { name: string; count: number; eventCount: number }
type UpcomingEvent = { id: string; title: string; city: string; start_date: string; cover_image: string | null }

export default function TendancesPage() {
  const [disciplines, setDisciplines] = useState<DisciplineCount[]>([])
  const [regions, setRegions] = useState<RegionCount[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: creators }, { data: events }] = await Promise.all([
        supabase.from('creator_profiles').select('disciplines, region'),
        supabase.from('events').select('id, title, city, start_date, cover_image, region').eq('status', 'published').gte('start_date', new Date().toISOString()).order('start_date').limit(6),
      ])

      // Disciplines les plus populaires
      const discMap: Record<string, number> = {}
      ;(creators ?? []).forEach(c => {
        ;(c.disciplines as string[] ?? []).forEach(d => { discMap[d] = (discMap[d] ?? 0) + 1 })
      })
      setDisciplines(
        Object.entries(discMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([name, count]) => ({ name, count }))
      )

      // Régions les plus actives (créateurs + événements)
      const regMap: Record<string, { creators: number; events: number }> = {}
      ;(creators ?? []).forEach(c => {
        if (c.region) regMap[c.region] = { creators: (regMap[c.region]?.creators ?? 0) + 1, events: regMap[c.region]?.events ?? 0 }
      })
      ;(events ?? []).forEach(e => {
        const r = (e as unknown as { region?: string }).region || ''
        if (r) regMap[r] = { creators: regMap[r]?.creators ?? 0, events: (regMap[r]?.events ?? 0) + 1 }
      })
      setRegions(
        Object.entries(regMap)
          .sort((a, b) => (b[1].creators + b[1].events * 2) - (a[1].creators + a[1].events * 2))
          .slice(0, 8)
          .map(([name, v]) => ({ name, count: v.creators, eventCount: v.events }))
      )

      setUpcoming((events ?? []) as unknown as UpcomingEvent[])
      setLoading(false)
    }
    load()
  }, [])

  const maxDisc = disciplines[0]?.count ?? 1

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <TrendingUp size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tendances</h1>
            <p className="text-sm text-gray-400">Disciplines populaires, régions actives, événements à venir</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-10">

            {/* Disciplines */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" /> Disciplines les plus représentées
              </h2>
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
                {disciplines.map((d, i) => (
                  <motion.div key={d.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/creators?discipline=${encodeURIComponent(d.name)}`}
                        className="text-sm font-semibold text-gray-800 hover:text-indigo-600 transition-colors">
                        {d.name}
                      </Link>
                      <span className="text-xs text-gray-400 font-semibold">{d.count} créateur{d.count > 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                        style={{ width: `${Math.round((d.count / maxDisc) * 100)}%` }} />
                    </div>
                  </motion.div>
                ))}
                {disciplines.length === 0 && <p className="text-sm text-gray-400">Aucune donnée disponible.</p>}
              </div>
            </section>

            {/* Régions */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-indigo-600" /> Régions les plus actives
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {regions.map((r, i) => (
                  <motion.div key={r.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-900 mb-2 leading-tight">{r.name}</p>
                    <p className="text-xs text-indigo-600 font-semibold">{r.count} créateur{r.count > 1 ? 's' : ''}</p>
                    {r.eventCount > 0 && <p className="text-xs text-gray-400">{r.eventCount} événement{r.eventCount > 1 ? 's' : ''}</p>}
                  </motion.div>
                ))}
                {regions.length === 0 && <p className="col-span-4 text-sm text-gray-400">Aucune donnée disponible.</p>}
              </div>
            </section>

            {/* Événements à venir */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-600" /> Prochains événements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/events/${ev.id}`}
                      className="flex gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:border-indigo-200 hover:-translate-y-px transition-all duration-150 group">
                      {ev.cover_image ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ev.cover_image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-indigo-50 shrink-0 flex items-center justify-center">
                          <Calendar size={20} className="text-indigo-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ev.city}</p>
                        <p className="text-xs text-indigo-600 font-semibold mt-1">
                          {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-indigo-300 group-hover:translate-x-0.5 transition-transform shrink-0 mt-1" />
                    </Link>
                  </motion.div>
                ))}
                {upcoming.length === 0 && (
                  <p className="col-span-2 text-sm text-gray-400">Aucun événement à venir pour le moment.</p>
                )}
              </div>
              {upcoming.length > 0 && (
                <div className="text-center mt-4">
                  <Link href="/events" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors inline-flex items-center gap-1.5">
                    Voir tous les événements <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>

          </div>
        )}
      </motion.div>
    </div>
  )
}
