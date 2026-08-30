'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, Euro, ArrowLeft, Calendar, MapPin, Users, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { colors, alpha } from '@/lib/design-tokens'
import { supabase } from '@/lib/supabase'
import { NexBadge } from '@/components/ui/nex-badge'

interface Kpi {
  brut_cents: number
  commission_cents: number
  net_cents: number
  refunded_cents: number
  pending_cents: number
  transactions: number
}

interface EventRevenue {
  event_id: string
  title: string
  city: string
  start_date: string
  stands_paid: number
  brut_cents: number
  commission_cents: number
  net_cents: number
  refunded_cents: number
}

interface Transaction {
  id: string
  amount_cents: number
  commission_cents: number
  status: string
  created_at: string
  stripe_payment_id: string | null
  creator: { full_name: string; avatar_url: string | null } | null
  event: { id: string; title: string } | null
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string; sub?: string; color: string; bg: string }) {
  return (
    <div style={{ padding: '20px 24px', borderRadius: '14px', border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.primary }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: '800', color, margin: '0 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function RevenueClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<Kpi | null>(null)
  const [byEvent, setByEvent] = useState<EventRevenue[]>([])
  const [recent, setRecent] = useState<Transaction[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login?next=/organizer/revenue'); return }

      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      if (prof?.role !== 'organizer') { router.push('/dashboard'); return }

      const res = await fetch('/api/organizer/revenue', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setLoading(false); return }
      const json = await res.json()
      setKpi(json.kpi)
      setByEvent(json.by_event ?? [])
      setRecent(json.recent ?? [])
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <div style={{ width: '32px', height: '32px', border: `3px solid ${alpha(colors.violet.primary, 0.2)}`, borderTopColor: colors.violet.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const isEmpty = !kpi || kpi.transactions === 0

  return (
    <div style={{ backgroundColor: colors.bg.secondary, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.bg.primary, borderBottom: `1px solid ${colors.border.default}`, padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.text.secondary, fontSize: '13px', textDecoration: 'none' }}>
            <ArrowLeft size={15} />
            Dashboard
          </Link>
          <span style={{ color: colors.border.default }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: alpha(colors.green.primary, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Euro size={16} color={colors.green.primary} />
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '700', color: colors.text.primary, margin: 0 }}>Revenus</h1>
              <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Paiements stands encaissés</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', padding: '80px 20px', borderRadius: '16px', border: `1px dashed ${colors.border.default}`, backgroundColor: colors.bg.primary }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: alpha(colors.green.primary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <TrendingUp size={26} color={colors.green.primary} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: colors.text.primary, margin: '0 0 8px' }}>Aucune transaction</h2>
            <p style={{ fontSize: '14px', color: colors.text.secondary, margin: '0 0 24px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
              Les paiements apparaîtront ici dès qu&apos;un créateur paiera son stand via Stripe.
            </p>
            <Link href="/dashboard" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: colors.text.white, fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              Retour au dashboard
            </Link>
          </motion.div>
        ) : (
          <>
            {/* KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}
            >
              <KpiCard
                label="Encaissé brut"
                value={fmt(kpi!.brut_cents)}
                sub={`${kpi!.transactions} transaction${kpi!.transactions > 1 ? 's' : ''}`}
                color={colors.green.textMid}
                bg={colors.green.bg}
              />
              <KpiCard
                label="Net reçu"
                value={fmt(kpi!.net_cents)}
                sub="Après commission Nexart"
                color={colors.green.textGreen}
                bg={colors.green.bgLight}
              />
              <KpiCard
                label="Commission Nexart (8%)"
                value={fmt(kpi!.commission_cents)}
                sub="Prélevée automatiquement"
                color={colors.violet.primary}
                bg={colors.violet.bg}
              />
              {kpi!.refunded_cents > 0 && (
                <KpiCard
                  label="Remboursé"
                  value={fmt(kpi!.refunded_cents)}
                  color={colors.feedback.danger.solid}
                  bg={colors.feedback.danger.bg}
                />
              )}
              {kpi!.pending_cents > 0 && (
                <KpiCard
                  label="En attente"
                  value={fmt(kpi!.pending_cents)}
                  color={colors.status.pending.dot}
                  bg={colors.feedback.warning.bg}
                />
              )}
            </motion.div>

            {/* Par événement */}
            {byEvent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                style={{ backgroundColor: colors.bg.primary, borderRadius: '14px', border: `1px solid ${colors.border.default}`, marginBottom: '24px', overflow: 'hidden' }}
              >
                <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.border.default}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={15} color={colors.text.secondary} />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: colors.text.primary }}>Par événement</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: colors.bg.secondary }}>
                        {['Événement', 'Lieu', 'Stands payés', 'Brut', 'Commission', 'Net'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: colors.text.secondary, fontWeight: '600', whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byEvent.map((ev, i) => (
                        <tr key={ev.event_id} style={{ borderTop: i > 0 ? `1px solid ${colors.border.default}` : undefined }}>
                          <td style={{ padding: '14px 16px', color: colors.text.primary, fontWeight: '600', maxWidth: '200px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                            {ev.start_date && <div style={{ fontSize: '11px', color: colors.text.muted, marginTop: '2px' }}>{new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                          </td>
                          <td style={{ padding: '14px 16px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} />
                              {ev.city}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.text.primary }}>
                              <Users size={12} />
                              {ev.stands_paid}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: colors.green.textMid, fontWeight: '700', whiteSpace: 'nowrap' }}>{fmt(ev.brut_cents)}</td>
                          <td style={{ padding: '14px 16px', color: colors.violet.primary, whiteSpace: 'nowrap' }}>−{fmt(ev.commission_cents)}</td>
                          <td style={{ padding: '14px 16px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                            <span style={{ color: colors.green.textGreen, backgroundColor: colors.green.bgPale, padding: '3px 10px', borderRadius: '6px' }}>
                              {fmt(ev.net_cents)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Transactions récentes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ backgroundColor: colors.bg.primary, borderRadius: '14px', border: `1px solid ${colors.border.default}`, overflow: 'hidden' }}
            >
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${colors.border.default}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={15} color={colors.text.secondary} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: colors.text.primary }}>Transactions récentes</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: colors.text.muted }}>{recent.length} dernières</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.bg.secondary }}>
                      {['Date', 'Créateur', 'Événement', 'Montant', 'Net', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: colors.text.secondary, fontWeight: '600', whiteSpace: 'nowrap', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((p, i) => (
                      <tr key={p.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border.default}` : undefined }}>
                        <td style={{ padding: '12px 16px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                          {new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.text.primary, fontWeight: '500', whiteSpace: 'nowrap' }}>
                          {p.creator?.full_name ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.text.secondary, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.event?.title ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.green.textMid, fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {fmt(p.amount_cents)}
                        </td>
                        <td style={{ padding: '12px 16px', color: colors.green.textGreen, fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {fmt(p.amount_cents - p.commission_cents)}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <NexBadge
                            variant={p.status === 'refunded' ? 'danger' : p.status === 'pending' ? 'warning' : 'accepted'}
                            dot={false}
                          >
                            {p.status === 'refunded' ? 'Remboursé' : p.status === 'pending' ? 'En attente' : 'Payé'}
                          </NexBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
