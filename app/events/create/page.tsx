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
  stand_dimensions: string
  discipline_tags: string[]
  rules: string
  stripe_enabled: boolean
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
  stand_dimensions: '',
  discipline_tags: [],
  rules: '',
  stripe_enabled: false,
}

function validate(form: FormData): string | null {
  if (!form.title.trim()) return 'Le nom du marché est requis'
  if (!form.city.trim()) return 'La ville est requise'
  if (!form.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de début invalide (format AAAA-MM-JJ)'
  if (!form.end_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de fin invalide (format AAAA-MM-JJ)'
  if (form.end_date < form.start_date) return 'La date de fin doit être après la date de début'
  if (!form.stand_count || isNaN(Number(form.stand_count))) return 'Nombre de stands invalide'
  if (form.discipline_tags.length === 0) return 'Sélectionnez au moins une discipline'
  return null
}

export default function CreateEventPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    setSaving(true)
    setError(null)

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
      stand_price: form.stand_price !== '' ? Number(form.stand_price) : null,
      stand_dimensions: form.stand_dimensions.trim() || null,
      discipline_tags: form.discipline_tags,
      rules: form.rules.trim() || null,
      stripe_enabled: form.stripe_enabled,
      status: publish ? 'published' : 'draft',
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
    <div style={{ backgroundColor: '#F9F9FB', minHeight: 'calc(100vh - 80px)', padding: '40px 16px 80px' }}>
      <style>{`
        .form-input { width: 100%; padding: 12px 14px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 15px; color: #1A1A1A; background: #FFFFFF; outline: none; box-sizing: border-box; transition: border-color 200ms; }
        .form-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .chip { padding: 6px 14px; border-radius: 9999px; border: 1px solid #E5E7EB; background: #FFFFFF; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 150ms; white-space: nowrap; }
        .chip:hover { border-color: #6366F1; color: #6366F1; }
        .chip-active { background: #6366F1 !important; border-color: #6366F1 !important; color: #FFFFFF !important; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#888888', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Retour
          </button>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Créer un marché</h1>
          <p style={{ fontSize: '15px', color: '#888888', margin: '6px 0 0' }}>Remplissez les informations de votre événement</p>
        </div>

        {/* Error */}
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

          {/* Stands */}
          <Section title="Stands">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Nombre de stands">
                <input className="form-input" type="number" min="1" value={form.stand_count} onChange={e => set('stand_count')(e.target.value)} placeholder="Ex : 40" />
              </Field>
              <Field label="Prix du stand (€)" hint="0 = gratuit">
                <input className="form-input" type="number" min="0" value={form.stand_price} onChange={e => set('stand_price')(e.target.value)} placeholder="Ex : 80" />
              </Field>
            </div>
            <Field label="Dimensions du stand" hint="(optionnel)">
              <input className="form-input" value={form.stand_dimensions} onChange={e => set('stand_dimensions')(e.target.value)} placeholder="Ex : 3m × 2m" />
            </Field>
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

          {/* Paiement Stripe */}
          <Section title="Paiement en ligne">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: form.stripe_enabled ? '#EEF2FF' : '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={form.stripe_enabled ? '#6366F1' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Activer le paiement Stripe</p>
                <p style={{ fontSize: '13px', color: '#888888', margin: '2px 0 0' }}>Le créateur paie son stand en ligne à la validation</p>
              </div>
              <button
                onClick={() => set('stripe_enabled')(!form.stripe_enabled)}
                style={{
                  width: '48px', height: '28px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                  backgroundColor: form.stripe_enabled ? '#6366F1' : '#E5E7EB',
                  position: 'relative', transition: 'background 200ms', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px', width: '22px', height: '22px', borderRadius: '50%',
                  backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 200ms', left: form.stripe_enabled ? '23px' : '3px',
                }} />
              </button>
            </div>
            {form.stripe_enabled && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: '#EEF2FF', marginTop: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <p style={{ fontSize: '13px', color: '#6366F1', margin: 0, lineHeight: '1.5' }}>
                  Le montant facturé sera le prix du stand ({form.stand_price || '0'} €). Assurez-vous que votre compte Stripe est actif.
                </p>
              </div>
            )}
          </Section>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '15px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 200ms' }}
            >
              Enregistrer en brouillon
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              style={{ flex: 2, padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 200ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ borderBottom: '1px solid #F0F0F0', paddingBottom: '12px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
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
