'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import { FileText, Calendar, MapPin, ArrowLeft, ExternalLink, Download, Loader2 } from 'lucide-react'

interface Doc {
  id: string
  status: string
  created_at: string
  stand_price_cents: number | null
  paid_at: string | null
  event: {
    id: string
    title: string
    city: string
    start_date: string
    end_date: string
  } | null
  contract: {
    id: string
    pdf_url: string | null
    status: string
  } | null
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:       { label: 'Confirmé',        color: colors.green.textGreen, bg: 'rgba(22,163,74,0.12)' },
  awaiting_payment:{ label: 'En attente paiement', color: colors.blue.primary, bg: 'rgba(14,165,233,0.12)' },
  accepted:        { label: 'Accepté',         color: colors.green.textGreen, bg: 'rgba(22,163,74,0.12)' },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtPrice(cents: number | null) {
  if (!cents) return null
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function DocumentsClient() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const res = await fetch('/api/creator/documents', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { setError('Erreur lors du chargement.'); setLoading(false); return }
      const json = await res.json()
      setDocs(json.documents || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function generateContract(doc: Doc) {
    if (!doc.event?.id) return
    setGenerating(doc.id)
    setGenError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: doc.event.id, creator_id: session.user.id, application_id: doc.id }),
      })
      const json = await res.json()
      if (res.ok && json.pdf_url) {
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, contract: { id: json.contract?.id || '', pdf_url: json.pdf_url, status: 'draft' } } : d))
        window.open(json.pdf_url, '_blank')
      } else {
        setGenError(json.error || 'Echec de la generation du contrat.')
      }
    } catch {
      setGenError('Erreur reseau. Veuillez reessayer.')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', backgroundColor: colors.bg.primary, padding: '32px 16px 60px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text.secondary, textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft size={14} /> Tableau de bord
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: `rgba(99,102,241,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={colors.violet.primary} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>Mes documents</h1>
              <p style={{ fontSize: '13px', color: colors.text.secondary, margin: '2px 0 0' }}>Contrats et confirmations de participation</p>
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '100px', borderRadius: '14px', backgroundColor: colors.bg.secondary, border: `1px solid var(--border-color)` }} />
            ))}
          </div>
        )}

        {error && (
          <p style={{ fontSize: '14px', color: colors.feedback?.danger?.solid || '#E05A5A', textAlign: 'center', marginTop: '40px' }}>{error}</p>
        )}

        {!loading && !error && docs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FileText size={40} color={colors.text.secondary} style={{ marginBottom: '16px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary, margin: '0 0 8px' }}>Aucun document pour l'instant</p>
            <p style={{ fontSize: '13px', color: colors.text.secondary, margin: 0 }}>Vos contrats apparaitront ici une fois votre participation confirmée.</p>
          </div>
        )}

        {genError && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', color: colors.feedback?.danger?.solid || '#E05A5A', fontSize: '13px' }}>
            {genError}
          </div>
        )}

        {/* List */}
        {!loading && !error && docs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {docs.map((doc, i) => {
              const st = STATUS_LABELS[doc.status]
              const hasContract = doc.contract?.pdf_url
              const isConfirmed = doc.status === 'confirmed'

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  style={{ borderRadius: '14px', border: `1px solid var(--border-color)`, backgroundColor: colors.bg.secondary, overflow: 'hidden' }}
                >
                  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Icon */}
                    <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isConfirmed ? 'rgba(22,163,74,0.1)' : `rgba(99,102,241,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={17} color={isConfirmed ? colors.green.textGreen : colors.violet.primary} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text.primary, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.event?.title || 'Événement inconnu'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {doc.event?.city && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: colors.text.secondary }}>
                            <MapPin size={10} /> {doc.event.city}
                          </span>
                        )}
                        {doc.event?.start_date && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: colors.text.secondary }}>
                            <Calendar size={10} /> {fmt(doc.event.start_date)}
                          </span>
                        )}
                        {doc.stand_price_cents && (
                          <span style={{ fontSize: '11px', color: colors.text.secondary, fontWeight: 600 }}>
                            {fmtPrice(doc.stand_price_cents)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    {st && (
                      <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '8px', backgroundColor: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: `1px solid var(--border-color)`, padding: '10px 18px', display: 'flex', gap: '8px', backgroundColor: colors.bg.primary }}>
                    <Link
                      href={`/creator/applications/${doc.id}`}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid var(--border-color)`, backgroundColor: 'transparent', color: colors.text.primary, fontSize: '12px', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
                    >
                      Voir la fiche
                    </Link>
                    {hasContract ? (
                      <a
                        href={doc.contract!.pdf_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '12px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <ExternalLink size={12} /> Contrat PDF
                      </a>
                    ) : isConfirmed ? (
                      <button
                        onClick={() => generateContract(doc)}
                        disabled={generating === doc.id}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: generating === doc.id ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', opacity: generating === doc.id ? 0.7 : 1 }}
                      >
                        {generating === doc.id ? <><Loader2 size={12} /> Génération...</> : <><Download size={12} /> Télécharger le contrat</>}
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
