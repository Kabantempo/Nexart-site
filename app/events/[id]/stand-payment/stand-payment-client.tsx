'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'

interface Field {
  id: string
  field_name: string
  field_type: string
  label: string
  placeholder: string | null
  is_required: boolean
  options: string[] | null
}

interface ProposedStand {
  size: string
  price: number
  note?: string
}

interface AppInfo {
  id: string
  event_id: string
  status: string
  stripe_payment_id: string | null
  proposed_stand: ProposedStand | null
  event: {
    title: string
    stand_price: number
    city: string | null
    start_date: string
  } | null
}

export default function StandPaymentClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appId = searchParams.get('app')

  const [app, setApp] = useState<AppInfo | null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId) { router.push('/dashboard'); return }
    load()
  }, [appId])

  async function load() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const [{ data: appData }, { data: fieldsData }] = await Promise.all([
      supabase
        .from('applications')
        .select('id, event_id, status, stripe_payment_id, proposed_stand, events(title, stand_price, city, start_date)')
        .eq('id', appId!)
        .eq('creator_id', session.user.id)
        .single(),
      fetch(`/api/events/${eventId}/exhibitor-fields`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(r => r.ok ? r.json() : { fields: [] }),
    ])

    if (!appData || appData.status !== 'accepted' || appData.stripe_payment_id) {
      router.push('/dashboard')
      return
    }

    setApp({
      id: appData.id,
      event_id: appData.event_id,
      status: appData.status,
      stripe_payment_id: appData.stripe_payment_id,
      proposed_stand: (appData as any).proposed_stand ?? null,
      event: (appData as any).events ?? null,
    })
    setFields(fieldsData.fields ?? [])
    setLoading(false)
  }

  async function handlePay() {
    if (!app) return
    const missing = fields.filter(f => f.is_required && !responses[f.field_name]?.trim())
    if (missing.length > 0) {
      setError(`Champ${missing.length > 1 ? 's' : ''} requis : ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setPaying(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    // Save form responses if fields exist
    if (fields.length > 0 && Object.keys(responses).length > 0) {
      await supabase.from('event_exhibitor_responses').upsert({
        event_id: eventId,
        exhibitor_id: session.user.id,
        response_data: responses,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tables_count: 1,
      }, { onConflict: 'event_id,exhibitor_id' })
    }

    // Start Stripe checkout
    const res = await fetch('/api/stripe/stand-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ application_id: app.id }),
    })
    const json = await res.json()

    if (!res.ok || !json.url) {
      setError(json.error ?? 'Erreur paiement')
      setPaying(false)
      return
    }

    window.location.href = json.url
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Chargement...</span>
    </div>
  )

  if (!app) return null

  const price = app.proposed_stand?.price ?? app.event?.stand_price ?? 0

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px 60px' }}>

      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24 }}>
        <ArrowLeft size={14} /> Retour au tableau de bord
      </Link>

      {/* Event header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
          Régler mon stand
        </h1>
        {app.event && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            {app.event.title}{app.event.city ? ` · ${app.event.city}` : ''}{app.event.start_date ? ` · ${fmtDate(app.event.start_date)}` : ''}
          </p>
        )}
      </div>

      {/* Stand summary */}
      <div style={{ padding: '16px 20px', borderRadius: 12, border: `1px solid rgba(99,102,241,0.3)`, backgroundColor: 'rgba(99,102,241,0.07)', marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: colors.violet.primary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Stand attribué</p>
        {app.proposed_stand ? (
          <>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {app.proposed_stand.size} — {price} EUR
            </p>
            {app.proposed_stand.note && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{app.proposed_stand.note}</p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{price} EUR</p>
        )}
      </div>

      {/* Form fields */}
      {fields.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.7px', margin: '0 0 14px' }}>
            Formulaire exposant
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {fields.map(field => (
              <div key={field.id}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {field.label}
                  {field.is_required && <span style={{ color: colors.feedback.danger.solid, marginLeft: 3 }}>*</span>}
                </label>
                {field.field_type === 'textarea' ? (
                  <textarea
                    value={responses[field.field_name] ?? ''}
                    onChange={e => setResponses(r => ({ ...r, [field.field_name]: e.target.value }))}
                    placeholder={field.placeholder ?? ''}
                    rows={3}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                ) : field.field_type === 'select' && field.options ? (
                  <select
                    value={responses[field.field_name] ?? ''}
                    onChange={e => setResponses(r => ({ ...r, [field.field_name]: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Sélectionner...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.field_type === 'number' ? 'number' : 'text'}
                    value={responses[field.field_name] ?? ''}
                    onChange={e => setResponses(r => ({ ...r, [field.field_name]: e.target.value }))}
                    placeholder={field.placeholder ?? ''}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, color: colors.feedback.danger.solid, marginBottom: 14 }}>{error}</p>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying}
        style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', backgroundColor: paying ? 'var(--bg-secondary)' : colors.violet.primary, color: paying ? 'var(--text-secondary)' : '#fff', fontSize: 15, fontWeight: 700, cursor: paying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms' }}>
        <CreditCard size={16} />
        {paying ? 'Redirection...' : `Payer ${price} EUR`}
      </button>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', margin: '12px 0 0' }}>
        Paiement sécurisé par Stripe
      </p>
    </div>
  )
}
