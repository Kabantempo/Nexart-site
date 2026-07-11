'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

const EVENT_TYPES = [
  { label: 'Pop-up',     value: 'popup' },
  { label: 'Salon',      value: 'salon' },
  { label: 'Foire',      value: 'fair' },
  { label: 'Permanent',  value: 'permanent' },
  { label: 'Saisonnier', value: 'seasonal' },
] as const

const DISCIPLINE_TAGS = [
  'Tatouage', 'Céramique', 'Gravure', 'Joaillerie', 'Bijoux', 'Illustration',
  'Textile', 'Maroquinerie', 'Sculpture', 'Photographie', 'Peinture', 'Poterie',
  'Broderie', 'Lutherie', 'Verrerie', 'Reliure', 'Cosmétique naturelle', 'Savonnerie',
  'Coutellerie', 'Bougies', 'Macramé', 'Origami', 'Calligraphie', 'Sérigraphie',
]

type PricingModel = 'flat' | 'variable' | 'percent'

interface FormData {
  title: string
  description: string
  event_type: 'popup' | 'salon' | 'fair' | 'permanent' | 'seasonal'
  location: string
  city: string
  region: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  stand_count: string
  stand_price: string
  pricing_model: PricingModel
  pricing_variable_min: string
  pricing_variable_max: string
  pricing_percent: string
  stand_dimensions: string
  discipline_tags: string[]
  rules: string
  stripe_enabled: boolean
  faq: { q: string; a: string }[]
  recurrence_type: 'none' | 'weekly' | 'biweekly' | 'monthly'
  recurrence_end_date: string
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  event_type: 'popup',
  location: '',
  city: '',
  region: '',
  start_date: '',
  end_date: '',
  start_time: '',
  end_time: '',
  stand_count: '',
  stand_price: '',
  pricing_model: 'flat',
  pricing_variable_min: '',
  pricing_variable_max: '',
  pricing_percent: '',
  stand_dimensions: '',
  discipline_tags: [],
  rules: '',
  stripe_enabled: false,
  faq: [],
  recurrence_type: 'none',
  recurrence_end_date: '',
}

function validate(form: FormData): string | null {
  if (!form.title.trim()) return 'Le nom du marché est requis'
  if (!form.city.trim()) return 'La ville est requise'
  if (!form.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de début invalide (format AAAA-MM-JJ)'
  if (!form.end_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de fin invalide (format AAAA-MM-JJ)'
  if (form.end_date < form.start_date) return 'La date de fin doit être après la date de début'
  if (!form.stand_count || isNaN(Number(form.stand_count))) return 'Nombre de stands invalide'
  if (form.discipline_tags.length === 0) return 'Sélectionnez au moins une discipline'
  if (form.pricing_model === 'variable') {
    if (!form.pricing_variable_min || !form.pricing_variable_max) return 'Renseignez le tarif min et max'
    if (Number(form.pricing_variable_min) > Number(form.pricing_variable_max)) return 'Le tarif min doit être inférieur au max'
  }
  if (form.pricing_model === 'percent') {
    if (!form.pricing_percent || Number(form.pricing_percent) <= 0 || Number(form.pricing_percent) > 100) return 'Pourcentage invalide (1–100)'
  }
  return null
}

export default function CreateEventPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventLimitReached, setEventLimitReached] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      let profile = null
      if (!user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        profile = data
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
        if (profile?.role !== 'organizer') { router.push('/dashboard'); return }
      } else if (user.role !== 'organizer') {
        router.push('/dashboard')
        return
      }

      // Vérifier la limite 1 événement actif pour le plan gratuit
      const uid = session.user.id
      const { data: sub } = await supabase.from('profiles').select('subscription_tier').eq('id', uid).single()
      if (!sub?.subscription_tier || sub.subscription_tier === 'free') {
        const { count } = await supabase.from('events').select('id', { count: 'exact', head: true })
          .eq('organizer_id', uid).in('status', ['published', 'draft'])
        if ((count ?? 0) >= 1) setEventLimitReached(true)
      }
    })
  }, [router, user, setUser])

  const set = (key: keyof FormData) => (value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleDiscipline = (tag: string) => {
    setForm(f => ({
      ...f,
      discipline_tags: f.discipline_tags.includes(tag)
        ? f.discipline_tags.filter(t => t !== tag)
        : [...f.discipline_tags, tag],
    }))
  }

  const handleSave = async (publish: boolean) => {
    const validationError = validate(form)
    if (validationError) { setError(validationError); return }
    if (!user) return
    if (eventLimitReached) { setError('Votre plan gratuit est limité à 1 événement actif. Passez au plan Pro pour en créer davantage.'); return }

    setSaving(true)
    setError(null)

    // Prix du stand selon le modèle
    let standPrice: number | null = null
    if (form.pricing_model === 'flat') standPrice = form.stand_price !== '' ? Number(form.stand_price) : null
    else if (form.pricing_model === 'variable') standPrice = Number(form.pricing_variable_min)
    else if (form.pricing_model === 'percent') standPrice = null

    const payload = {
      organizer_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_type: form.event_type,
      city: form.city.trim(),
      region: form.region.trim() || null,
      location: form.location.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      stand_count: Number(form.stand_count),
      stand_price: standPrice,
      pricing_model: form.pricing_model,
      pricing_variable_min: form.pricing_model === 'variable' ? Number(form.pricing_variable_min) : null,
      pricing_variable_max: form.pricing_model === 'variable' ? Number(form.pricing_variable_max) : null,
      pricing_percent: form.pricing_model === 'percent' ? Number(form.pricing_percent) : null,
      stand_dimensions: form.stand_dimensions.trim() || null,
      discipline_tags: form.discipline_tags,
      rules: form.rules.trim() || null,
      faq: form.faq.filter(f => f.q.trim() && f.a.trim()),
      stripe_enabled: form.stripe_enabled,
      status: publish ? 'published' : 'draft',
      recurrence_type: form.recurrence_type,
      ...(form.recurrence_type !== 'none' && form.start_date && form.recurrence_end_date ? {
        recurrence_dates: (() => {
          const dates: string[] = []
          const cur = new Date(form.start_date)
          const end = new Date(form.recurrence_end_date)
          const step = form.recurrence_type === 'weekly' ? 7 : form.recurrence_type === 'biweekly' ? 14 : 0
          if (step > 0) {
            while (cur <= end) { dates.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + step) }
          } else {
            // monthly
            while (cur <= end) { dates.push(cur.toISOString().slice(0, 10)); cur.setMonth(cur.getMonth() + 1) }
          }
          return dates
        })(),
        recurrence_end_date: form.recurrence_end_date,
      } : {}),
    }

    const { data, error: err } = await supabase.from('events').insert(payload).select().single()
    setSaving(false)

    if (err) { setError(err.message); return }
    router.push(publish ? `/events/${data.id}` : '/dashboard')
  }

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)', padding: '40px 16px 80px' }}>
      <style>{`
        .form-input { width: 100%; padding: 12px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 15px; color: #1A1A1A; background: #FFFFFF; outline: none; box-sizing: border-box; transition: border-color 200ms; }
        .form-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .chip { padding: 6px 14px; border-radius: 9999px; border: 1px solid #E5E7EB; background: #FFFFFF; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 150ms; white-space: nowrap; }
        .chip:hover { border-color: #6366F1; color: #6366F1; }
        .chip-active { background: #6366F1 !important; border-color: #6366F1 !important; color: #FFFFFF !important; }
        .pricing-card { padding: 16px; border-radius: 10px; border: 2px solid #E5E7EB; background: #FFFFFF; cursor: pointer; transition: all 150ms; }
        .pricing-card:hover { border-color: #A5B4FC; }
        .pricing-card-active { border-color: #6366F1 !important; background: #F8F7FF !important; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '36px' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Créer un marché</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>Remplissez les informations de votre événement</p>
        </div>

        {/* Alerte limite plan gratuit */}
        {eventLimitReached && (
          <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400E', margin: '0 0 4px' }}>Limite du plan Découverte atteinte</p>
            <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>Vous avez déjà 1 événement actif. Passez au plan Pro pour créer des événements illimités.</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Infos générales */}
          <Section title="Informations générales">
            <Field label="Nom du marché">
              <input className="form-input" value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Ex : Marché de Noël de Lyon" />
            </Field>

            <Field label="Type d'événement">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.value} className={`chip ${form.event_type === t.value ? 'chip-active' : ''}`} onClick={() => set('event_type')(t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Description" hint="(optionnel)">
              <textarea className="form-input" value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Décrivez votre marché…" rows={4} style={{ resize: 'vertical' }} />
            </Field>
          </Section>

          {/* Localisation */}
          <Section title="Localisation">
            <Field label="Adresse / lieu" hint="(optionnel)">
              <input className="form-input" value={form.location} onChange={e => set('location')(e.target.value)} placeholder="Ex : Parc de la Tête d'Or" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Ville">
                <input className="form-input" value={form.city} onChange={e => set('city')(e.target.value)} placeholder="Ex : Lyon" />
              </Field>
              <Field label="Région" hint="(optionnel)">
                <input className="form-input" value={form.region} onChange={e => set('region')(e.target.value)} placeholder="Ex : Auvergne-Rhône-Alpes" />
              </Field>
            </div>
          </Section>

          {/* Dates */}
          <Section title="Dates & Horaires">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Date de début">
                <input className="form-input" type="date" value={form.start_date} onChange={e => set('start_date')(e.target.value)} />
              </Field>
              <Field label="Date de fin">
                <input className="form-input" type="date" value={form.end_date} onChange={e => set('end_date')(e.target.value)} />
              </Field>
              <Field label="Heure ouverture" hint="(optionnel)">
                <input className="form-input" type="time" value={form.start_time} onChange={e => set('start_time')(e.target.value)} />
              </Field>
              <Field label="Heure fermeture" hint="(optionnel)">
                <input className="form-input" type="time" value={form.end_time} onChange={e => set('end_time')(e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Récurrence */}
          <Section title="Récurrence (optionnel)">
            <Field label="Fréquence">
              <select className="form-input" value={form.recurrence_type}
                onChange={e => setForm(f => ({ ...f, recurrence_type: e.target.value as FormData['recurrence_type'] }))}>
                <option value="none">Événement ponctuel</option>
                <option value="weekly">Hebdomadaire (chaque semaine)</option>
                <option value="biweekly">Bimensuel (toutes les 2 semaines)</option>
                <option value="monthly">Mensuel (chaque mois)</option>
              </select>
            </Field>
            {form.recurrence_type !== 'none' && (
              <Field label="Jusqu'au">
                <input className="form-input" type="date" value={form.recurrence_end_date}
                  onChange={e => setForm(f => ({ ...f, recurrence_end_date: e.target.value }))} />
              </Field>
            )}
            {form.recurrence_type !== 'none' && form.start_date && form.recurrence_end_date && (
              <p style={{ fontSize: '13px', color: '#6366F1', fontWeight: '600' }}>
                {(() => {
                  const step = form.recurrence_type === 'weekly' ? 7 : form.recurrence_type === 'biweekly' ? 14 : 0
                  let count = 0
                  const cur = new Date(form.start_date)
                  const end = new Date(form.recurrence_end_date)
                  if (step > 0) { while (cur <= end) { count++; cur.setDate(cur.getDate() + step) } }
                  else { while (cur <= end) { count++; cur.setMonth(cur.getMonth() + 1) } }
                  return `${count} date${count > 1 ? 's' : ''} générée${count > 1 ? 's' : ''}`
                })()}
              </p>
            )}
          </Section>

          {/* Stands & Tarification */}
          <Section title="Stands & Tarification">
            <Field label="Nombre de stands">
              <input className="form-input" type="number" min="1" value={form.stand_count} onChange={e => set('stand_count')(e.target.value)} placeholder="Ex : 40" />
            </Field>
            <Field label="Dimensions du stand" hint="(optionnel)">
              <input className="form-input" value={form.stand_dimensions} onChange={e => set('stand_dimensions')(e.target.value)} placeholder="Ex : 3m × 2m" />
            </Field>

            <Field label="Modèle de tarification">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                {([
                  { value: 'flat', label: 'Tarif fixe', desc: 'Un prix unique par stand' },
                  { value: 'variable', label: 'Tarif variable', desc: 'Fourchette min–max' },
                  { value: 'percent', label: '% du chiffre d\'affaires', desc: 'Commission sur les ventes' },
                ] as { value: PricingModel; label: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    className={`pricing-card ${form.pricing_model === opt.value ? 'pricing-card-active' : ''}`}
                    onClick={() => set('pricing_model')(opt.value)}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${form.pricing_model === opt.value ? '#6366F1' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {form.pricing_model === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366F1' }} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: form.pricing_model === opt.value ? '#6366F1' : '#1A1A1A' }}>{opt.label}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Field>

            {form.pricing_model === 'flat' && (
              <Field label="Prix du stand (€)" hint="0 = gratuit">
                <input className="form-input" type="number" min="0" value={form.stand_price} onChange={e => set('stand_price')(e.target.value)} placeholder="Ex : 80" />
              </Field>
            )}

            {form.pricing_model === 'variable' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Prix minimum (€)">
                  <input className="form-input" type="number" min="0" value={form.pricing_variable_min} onChange={e => set('pricing_variable_min')(e.target.value)} placeholder="Ex : 60" />
                </Field>
                <Field label="Prix maximum (€)">
                  <input className="form-input" type="number" min="0" value={form.pricing_variable_max} onChange={e => set('pricing_variable_max')(e.target.value)} placeholder="Ex : 120" />
                </Field>
              </div>
            )}

            {form.pricing_model === 'percent' && (
              <Field label="Pourcentage du CA (%)">
                <input className="form-input" type="number" min="1" max="100" value={form.pricing_percent} onChange={e => set('pricing_percent')(e.target.value)} placeholder="Ex : 10" />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>L&apos;organisateur prélève ce % sur les ventes du créateur.</p>
              </Field>
            )}
          </Section>

          {/* Disciplines */}
          <Section title="Disciplines recherchées">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DISCIPLINE_TAGS.map(tag => (
                <button key={tag} className={`chip ${form.discipline_tags.includes(tag) ? 'chip-active' : ''}`} onClick={() => toggleDiscipline(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            {form.discipline_tags.length > 0 && (
              <p style={{ fontSize: '13px', color: '#6366F1', marginTop: '8px', fontWeight: '600' }}>
                {form.discipline_tags.length} discipline{form.discipline_tags.length > 1 ? 's' : ''} sélectionnée{form.discipline_tags.length > 1 ? 's' : ''}
              </p>
            )}
          </Section>

          {/* Règlement */}
          <Section title="Règlement" hint="(optionnel)">
            <textarea className="form-input" value={form.rules} onChange={e => set('rules')(e.target.value)} placeholder="Commission, assurance requise, horaires de setup…" rows={4} style={{ resize: 'vertical' }} />
          </Section>

          {/* FAQ */}
          <Section title="FAQ" hint="(optionnel)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {form.faq.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      className="form-input"
                      value={item.q}
                      onChange={e => setForm(f => { const faq = [...f.faq]; faq[i] = { ...faq[i], q: e.target.value }; return { ...f, faq } })}
                      placeholder="Question…"
                    />
                    <textarea
                      className="form-input"
                      value={item.a}
                      onChange={e => setForm(f => { const faq = [...f.faq]; faq[i] = { ...faq[i], a: e.target.value }; return { ...f, faq } })}
                      placeholder="Réponse…"
                      rows={2}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, faq: f.faq.filter((_, j) => j !== i) }))}
                    style={{ marginTop: '8px', width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#FEF2F2', color: '#E05A5A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              ))}
              <button onClick={() => setForm(f => ({ ...f, faq: [...f.faq, { q: '', a: '' }] }))}
                style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '8px', border: '1px dashed #D1D5DB', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                + Ajouter une question
              </button>
            </div>
          </Section>

          {/* Paiement Stripe */}
          <Section title="Paiement en ligne">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: form.stripe_enabled ? '#EEF2FF' : '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={form.stripe_enabled ? '#6366F1' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="12" x2="12.01" y1="14" y2="14"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Activer le paiement Stripe</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Le créateur paie son stand en ligne à la validation</p>
              </div>
              <button
                onClick={() => set('stripe_enabled')(!form.stripe_enabled)}
                style={{ width: '48px', height: '28px', borderRadius: '9999px', border: 'none', cursor: 'pointer', backgroundColor: form.stripe_enabled ? '#6366F1' : '#E5E7EB', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '3px', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 200ms', left: form.stripe_enabled ? '23px' : '3px' }} />
              </button>
            </div>
          </Section>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving || eventLimitReached}
              style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', cursor: (saving || eventLimitReached) ? 'not-allowed' : 'pointer', opacity: (saving || eventLimitReached) ? 0.5 : 1, transition: 'all 200ms' }}
            >
              Enregistrer en brouillon
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || eventLimitReached}
              style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '15px', fontWeight: '700', cursor: (saving || eventLimitReached) ? 'not-allowed' : 'pointer', opacity: (saving || eventLimitReached) ? 0.5 : 1, transition: 'all 200ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {saving ? (
                <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
              ) : 'Publier maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ borderBottom: '1px solid #F0F0F0', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
          {title} {hint && <span style={{ fontWeight: '400', color: '#BBBBBB', textTransform: 'none', letterSpacing: 0 }}>{hint}</span>}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#555555' }}>
        {label} {hint && <span style={{ color: '#BBBBBB', fontWeight: '400' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}
