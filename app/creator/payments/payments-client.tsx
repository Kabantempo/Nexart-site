'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, CreditCard, Calendar, MapPin, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { colors, alpha } from '@/lib/design-tokens'
import { supabase } from '@/lib/supabase'
import { NexBadge } from '@/components/ui/nex-badge'
import { NexButton } from '@/components/ui/nex-button'

interface Payment {
  id: string
  amount_cents: number
  commission_cents: number
  status: string
  created_at: string
  stripe_payment_id: string | null
  application_id: string | null
  event: {
    id: string
    title: string
    start_date: string
    city: string
    cover_image: string | null
    organizer: { full_name: string } | null
  } | null
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'
}

const PAYMENT_STATUS: Record<string, { label: string; variant: 'accepted' | 'warning' | 'danger' | 'pending' }> = {
  completed: { label: 'Payé',       variant: 'accepted' },
  pending:   { label: 'En attente', variant: 'warning'  },
  refunded:  { label: 'Remboursé',  variant: 'danger'   },
}

function StatusBadge({ status }: { status: string }) {
  const s = PAYMENT_STATUS[status] ?? PAYMENT_STATUS.pending
  return <NexBadge variant={s.variant} dot={false}>{s.label}</NexBadge>
}

export default function PaymentsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [token, setToken] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login?next=/creator/payments'); return }

      const { data: prof } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      if (prof?.role !== 'creator') { router.push('/dashboard'); return }

      setToken(session.access_token)

      const res = await fetch('/api/creator/payments', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPayments(json.payments ?? [])
      }
      setLoading(false)
    })
  }, [router])

  async function downloadPdf(payment: Payment) {
    if (!payment.application_id) return
    setDownloading(payment.id)
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ application_id: payment.application_id, transaction_id: payment.stripe_payment_id }),
      })
      if (!res.ok) throw new Error('Erreur génération')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const num = `NX-${new Date(payment.created_at).getFullYear()}-${(payment.stripe_payment_id ?? payment.id).slice(-8).toUpperCase()}`
      a.href = url
      a.download = `facture-nexart-${num}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloading(null)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <div style={{ width: '32px', height: '32px', border: `3px solid ${alpha(colors.violet.primary, 0.2)}`, borderTopColor: colors.violet.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ backgroundColor: colors.bg.secondary, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: colors.bg.primary, borderBottom: `1px solid ${colors.border.default}`, padding: '0 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.text.secondary, fontSize: '13px', textDecoration: 'none' }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <span style={{ color: colors.border.default }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: alpha(colors.violet.primary, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color={colors.violet.primary} />
            </div>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '700', color: colors.text.primary, margin: 0 }}>Mes paiements</h1>
              <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Historique et reçus PDF</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>
        {payments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', padding: '80px 20px', borderRadius: '16px', border: `1px dashed ${colors.border.default}`, backgroundColor: colors.bg.primary }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: alpha(colors.violet.primary, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CreditCard size={26} color={colors.violet.primary} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: colors.text.primary, margin: '0 0 8px' }}>Aucun paiement</h2>
            <p style={{ fontSize: '14px', color: colors.text.secondary, margin: '0 0 24px', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto' }}>
              Vos paiements de stands apparaîtront ici dès qu&apos;une candidature acceptée aura été réglée.
            </p>
            <Link href="/events" style={{ display: 'inline-block', padding: '10px 22px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: colors.text.white, fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
              Explorer les marchés
            </Link>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {/* Résumé */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '8px' }}>
              {[
                { label: 'Total payé', value: fmt(payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount_cents, 0)), color: colors.green.textMid },
                { label: 'Transactions', value: String(payments.filter(p => p.status === 'completed').length), color: colors.violet.primary },
                ...(payments.some(p => p.status === 'refunded') ? [{ label: 'Remboursé', value: fmt(payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount_cents, 0)), color: colors.feedback.danger.solid }] : []),
              ].map(k => (
                <div key={k.label} style={{ padding: '16px 20px', borderRadius: '12px', border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.primary }}>
                  <p style={{ fontSize: '11px', color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px', fontWeight: '600' }}>{k.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: '800', color: k.color, margin: 0 }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Liste */}
            {payments.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{ backgroundColor: colors.bg.primary, borderRadius: '14px', border: `1px solid ${colors.border.default}`, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
              >
                {/* Cover */}
                <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: colors.bg.secondary }}>
                  {p.event?.cover_image ? (
                    <Image src={p.event.cover_image} alt={p.event.title} width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={22} color={colors.text.muted} />
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: colors.text.primary, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.event?.title ?? '—'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    {p.event?.city && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: colors.text.secondary }}>
                        <MapPin size={11} /> {p.event.city}
                      </span>
                    )}
                    {p.event?.start_date && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: colors.text.secondary }}>
                        <Calendar size={11} /> {new Date(p.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: colors.text.muted }}>
                      <RefreshCw size={11} /> {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Montant + statut + PDF */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: p.status === 'refunded' ? colors.feedback.danger.solid : colors.green.textMid, margin: 0 }}>
                    {fmt(p.amount_cents)}
                  </p>
                  <StatusBadge status={p.status} />
                  {p.application_id && p.status === 'completed' && (
                    <NexButton
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadPdf(p)}
                      disabled={downloading === p.id}
                      loading={downloading === p.id}
                    >
                      <Download size={12} />
                      {downloading === p.id ? 'Génération…' : 'Reçu PDF'}
                    </NexButton>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
