'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Info, MapPin, CalendarDays, Repeat, Store, Tags, ScrollText,
  HelpCircle, CreditCard, CheckCircle2, Circle, AlertCircle, Plus, X, Image as ImageIcon, Images, Hash, Timer,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { colors, typography, spacing, radius, shadows, transitions } from '@/lib/design-tokens'

interface CitySuggestion {
  nom: string
  region: string
  departement: string
  codesPostaux: string[]
  lat: number | null
  lng: number | null
}

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

interface StandType {
  count: string
  dimensions: string
}

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
  stand_types: StandType[]
  stand_price_min: string
  stand_price_max: string
  discipline_tags: string[]
  rules: string
  stripe_enabled: boolean
  faq: { q: string; a: string }[]
  recurrence_type: 'none' | 'weekly' | 'biweekly' | 'monthly'
  recurrence_end_date: string
  cover_image: string
  media: string[]
  lat: number | null
  lng: number | null
  theme: string[]
  application_deadline: string
}

const EMPTY_STAND_TYPE: StandType = { count: '', dimensions: '' }

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
  stand_types: [{ ...EMPTY_STAND_TYPE }],
  stand_price_min: '',
  stand_price_max: '',
  discipline_tags: [],
  rules: '',
  stripe_enabled: false,
  faq: [],
  recurrence_type: 'none',
  recurrence_end_date: '',
  cover_image: '',
  media: [],
  lat: null,
  lng: null,
  theme: [],
  application_deadline: '',
}

function totalStandCount(form: FormData): number {
  return form.stand_types.reduce((sum, t) => sum + (Number(t.count) || 0), 0)
}

function validate(form: FormData): string | null {
  if (!form.title.trim()) return 'Le nom du marché est requis'
  if (!form.city.trim()) return 'La ville est requise'
  if (!form.start_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de début invalide (format AAAA-MM-JJ)'
  if (!form.end_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Date de fin invalide (format AAAA-MM-JJ)'
  if (form.end_date < form.start_date) return 'La date de fin doit être après la date de début'
  if (form.stand_types.some(t => !t.count || isNaN(Number(t.count)) || Number(t.count) <= 0)) return 'Nombre de stands invalide'
  if (totalStandCount(form) <= 0) return 'Ajoutez au moins un type de stand'
  if (form.discipline_tags.length === 0) return 'Sélectionnez au moins une discipline'
  if (form.stand_price_min && form.stand_price_max && Number(form.stand_price_min) > Number(form.stand_price_max)) return 'Le prix le plus bas doit être inférieur au prix le plus haut'
  if (form.application_deadline && form.application_deadline > form.start_date) return 'La date limite de candidature doit être avant le début du marché'
  return null
}

// Étapes utilisées uniquement pour le sommaire / la progression (page reste unique)
const STEPS = [
  { key: 'general',  label: 'Informations générales', icon: Info,
    isComplete: (f: FormData) => !!f.title.trim() },
  { key: 'location', label: 'Localisation', icon: MapPin,
    isComplete: (f: FormData) => !!f.city.trim() },
  { key: 'dates',    label: 'Dates & horaires', icon: CalendarDays,
    isComplete: (f: FormData) => !!f.start_date && !!f.end_date },
  { key: 'pricing',  label: 'Stands & tarification', icon: Store,
    isComplete: (f: FormData) => f.stand_types.some(t => !!t.count) },
  { key: 'tags',     label: 'Disciplines', icon: Tags,
    isComplete: (f: FormData) => f.discipline_tags.length > 0 },
  { key: 'media',   label: 'Visuels', icon: ImageIcon,
    isComplete: (f: FormData) => !!f.cover_image },
  { key: 'theme',   label: 'Thème & mots-clés', icon: Hash,
    isComplete: (f: FormData) => f.theme.length > 0 },
] as const

export default function CreateEventClient() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventLimitReached, setEventLimitReached] = useState(false)
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [themeInput, setThemeInput] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      let profile = null
      if (!user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        profile = data
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url, is_organizer: profile.is_organizer, is_creator: profile.is_creator })
        if (profile?.role !== 'organizer' && !profile?.is_organizer) { router.push('/dashboard'); return }
      } else if (user.role !== 'organizer' && !user.is_organizer) {
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

  const updateStandType = (i: number, key: keyof StandType) => (value: string) =>
    setForm(f => { const stand_types = [...f.stand_types]; stand_types[i] = { ...stand_types[i], [key]: value }; return { ...f, stand_types } })

  const addStandType = () => setForm(f => ({ ...f, stand_types: [...f.stand_types, { ...EMPTY_STAND_TYPE }] }))

  const removeStandType = (i: number) => setForm(f => ({ ...f, stand_types: f.stand_types.filter((_, j) => j !== i) }))

  const handleCityInput = (value: string) => {
    setForm(f => ({ ...f, city: value, lat: null, lng: null }))
    clearTimeout(cityDebounce.current)
    if (value.length < 2) { setCitySuggestions([]); setShowCitySuggestions(false); return }
    cityDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(value)}&fields=nom,region,departement,codesPostaux,centre&limit=6`)
        const data = await res.json()
        const suggestions: CitySuggestion[] = (data as any[]).map(d => ({
          nom: d.nom,
          region: d.region?.nom ?? '',
          departement: d.departement?.nom ?? '',
          codesPostaux: d.codesPostaux ?? [],
          lat: d.centre?.coordinates?.[1] ?? null,
          lng: d.centre?.coordinates?.[0] ?? null,
        }))
        setCitySuggestions(suggestions)
        setShowCitySuggestions(suggestions.length > 0)
      } catch { /* ignore */ }
    }, 300)
  }

  const selectCity = (s: CitySuggestion) => {
    setForm(f => ({ ...f, city: s.nom, region: s.region, lat: s.lat, lng: s.lng }))
    setCitySuggestions([])
    setShowCitySuggestions(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingCover(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/cover_${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('event-media').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('event-media').getPublicUrl(path)
      setForm(f => ({ ...f, cover_image: publicUrl }))
    } else {
      setError(`Erreur upload image : ${upErr.message}`)
    }
    setUploadingCover(false)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !user) return
    setUploadingMedia(true)
    const urls: string[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/media_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('event-media').upload(path, file, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('event-media').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    setForm(f => ({ ...f, media: [...f.media, ...urls] }))
    setUploadingMedia(false)
  }

  const addTheme = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = themeInput.trim()
      if (val && !form.theme.includes(val)) setForm(f => ({ ...f, theme: [...f.theme, val] }))
      setThemeInput('')
    }
  }

  const completedCount = useMemo(() => STEPS.filter(s => s.isComplete(form)).length, [form])
  const progressPct = Math.round((completedCount / STEPS.length) * 100)

  const handleSave = async (publish: boolean) => {
    const validationError = validate(form)
    if (validationError) { setError(validationError); return }
    if (!user) return
    if (eventLimitReached) { setError('Votre plan gratuit est limité à 1 événement actif. Passez au plan Pro pour en créer davantage.'); return }

    setSaving(true)
    setError(null)

    const standDimensions = form.stand_types
      .filter(t => t.count)
      .map(t => t.dimensions.trim() ? `${t.count} x ${t.dimensions.trim()}` : `${t.count} stand${Number(t.count) > 1 ? 's' : ''}`)
      .join(', ')

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
      stand_count: totalStandCount(form),
      stand_price: form.stand_price_min !== '' ? Number(form.stand_price_min) : null,
      pricing_model: form.stand_price_max !== '' && form.stand_price_max !== form.stand_price_min ? 'variable' : 'flat',
      pricing_variable_min: form.stand_price_min !== '' ? Number(form.stand_price_min) : null,
      pricing_variable_max: form.stand_price_max !== '' ? Number(form.stand_price_max) : null,
      pricing_percent: null,
      stand_dimensions: standDimensions || null,
      discipline_tags: form.discipline_tags,
      rules: form.rules.trim() || null,
      faq: form.faq.filter(f => f.q.trim() && f.a.trim()),
      stripe_enabled: form.stripe_enabled,
      status: publish ? 'published' : 'draft',
      cover_image: form.cover_image || null,
      media: form.media.length > 0 ? form.media : null,
      lat: form.lat,
      lng: form.lng,
      theme: form.theme.length > 0 ? form.theme : null,
      application_deadline: form.application_deadline || null,
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

    const { data, error: err } = await supabase.from('events').insert(payload as any).select().single()
    setSaving(false)

    if (err) { setError(err.message); return }
    router.push(publish ? `/events/${data.id}` : '/dashboard')
  }

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: radius.pill, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)', padding: '40px 16px 80px' }}>
      <style>{`
        .form-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border-color); border-radius: ${radius.sm}; font-size: 15px; font-family: ${typography.fontFamily}; color: var(--text-primary); background: var(--bg-primary); outline: none; box-sizing: border-box; transition: ${transitions.fast}; }
        .form-input:hover { border-color: var(--border-color); }
        .form-input:focus { border-color: ${colors.violet.primary}; box-shadow: ${shadows.focus}; }
        .chip { padding: 7px 15px; border-radius: ${radius.pill}; border: 1.5px solid var(--border-color); background: var(--bg-primary); font-size: 14px; font-weight: 500; font-family: ${typography.fontFamily}; cursor: pointer; transition: ${transitions.fast}; white-space: nowrap; color: var(--text-primary); }
        .chip:hover { border-color: ${colors.violet.primary}; color: ${colors.violet.primary}; }
        .chip-active { background: ${colors.violet.primary} !important; border-color: ${colors.violet.primary} !important; color: ${colors.text.onViolet} !important; }
        .pricing-card { padding: 16px; border-radius: ${radius.md}; border: 2px solid var(--border-color); background: var(--bg-primary); cursor: pointer; transition: ${transitions.fast}; }
        .pricing-card:hover { border-color: ${colors.violet.hover}; }
        .pricing-card-active { border-color: ${colors.violet.primary} !important; background: ${colors.violet.bg} !important; }
      `}</style>

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: typography.fontFamily, cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            <ArrowLeft size={15} /> Retour
          </button>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Créer un marché</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>Remplissez les informations de votre événement — vous pourrez tout modifier plus tard</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: '28px', alignItems: 'start' }}>

          {/* Colonne principale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

            <AnimatePresence>
              {eventLimitReached && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '16px 20px', borderRadius: radius.md, backgroundColor: colors.feedback.warning.bg, border: `1px solid ${colors.feedback.warning.border}`, display: 'flex', gap: '10px' }}>
                  <AlertCircle size={18} color={colors.feedback.warning.text} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: colors.feedback.warning.text, margin: '0 0 4px' }}>Limite du plan Découverte atteinte</p>
                    <p style={{ fontSize: '13px', color: colors.feedback.warning.text, margin: 0 }}>Vous avez déjà 1 événement actif. Passez au plan Pro pour créer des événements illimités.</p>
                  </div>
                </motion.div>
              )}
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '14px 18px', borderRadius: radius.sm, backgroundColor: colors.feedback.danger.bg, border: `1px solid ${colors.feedback.danger.border}`, color: colors.feedback.danger.text, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Infos générales */}
            <Section id="general" title="Informations générales" icon={Info}>
              <Field label="Nom du marché">
                <input className="form-input" value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Ex : Marché de Noël de Lyon" />
              </Field>

              <Field label="Type de marché">
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
            <Section id="location" title="Localisation" icon={MapPin}>
              <Field label="Adresse / lieu" hint="(optionnel)">
                <input className="form-input" value={form.location} onChange={e => set('location')(e.target.value)} placeholder="Ex : Parc de la Tête d'Or" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '16px' }}>
                <Field label="Ville">
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      value={form.city}
                      onChange={e => handleCityInput(e.target.value)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                      placeholder="Ex : Lyon"
                      autoComplete="off"
                    />
                    {showCitySuggestions && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, borderRadius: radius.sm, boxShadow: shadows.md, marginTop: '2px', overflow: 'hidden' }}>
                        {citySuggestions.map((s, i) => (
                          <button key={i} onMouseDown={() => selectCity(s)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', fontFamily: typography.fontFamily, borderBottom: i < citySuggestions.length - 1 ? `1px solid var(--bg-secondary)` : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span style={{ fontWeight: 600 }}>{s.nom}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>{s.departement}{s.region ? ` · ${s.region}` : ''}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {form.lat && (
                      <p style={{ fontSize: '11px', color: colors.feedback.success.solid, margin: '4px 0 0', fontWeight: 600 }}>
                        📍 {form.lat.toFixed(4)}, {form.lng?.toFixed(4)}
                      </p>
                    )}
                  </div>
                </Field>
                <Field label="Région" hint="(optionnel)">
                  <input className="form-input" value={form.region} onChange={e => set('region')(e.target.value)} placeholder="Ex : Auvergne-Rhône-Alpes" />
                </Field>
              </div>
            </Section>

            {/* Dates */}
            <Section id="dates" title="Dates & horaires" icon={CalendarDays}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '16px' }}>
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
                <Field label="Date limite de candidature" hint="(optionnel)">
                  <input className="form-input" type="date" value={form.application_deadline} onChange={e => set('application_deadline')(e.target.value)} max={form.start_date || undefined} />
                </Field>
              </div>
            </Section>

            {/* Récurrence */}
            <Section title="Récurrence" hint="(optionnel)" icon={Repeat}>
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
                <p style={{ fontSize: '13px', color: colors.violet.primary, fontWeight: 600, margin: 0 }}>
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
            <Section id="pricing" title="Stands & tarification" icon={Store}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.stand_types.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Nombre de stands">
                        <input className="form-input" type="number" min="1" value={t.count} onChange={e => updateStandType(i, 'count')(e.target.value)} placeholder="Ex : 40" />
                      </Field>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Field label="Dimensions du stand">
                        <input className="form-input" value={t.dimensions} onChange={e => updateStandType(i, 'dimensions')(e.target.value)} placeholder="Ex : 3m × 2m" />
                      </Field>
                    </div>
                    {form.stand_types.length > 1 && (
                      <button onClick={() => removeStandType(i)}
                        style={{ marginBottom: '1px', width: '42px', height: '42px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.solid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addStandType}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: radius.sm, border: `1px dashed var(--border-color)`, backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={14} /> Ajouter un type de stand
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '16px' }}>
                <Field label="Prix le plus bas (€)" hint="0 = gratuit">
                  <input className="form-input" type="number" min="0" value={form.stand_price_min} onChange={e => set('stand_price_min')(e.target.value)} placeholder="Ex : 60" />
                </Field>
                <Field label="Prix le plus haut (€)">
                  <input className="form-input" type="number" min="0" value={form.stand_price_max} onChange={e => set('stand_price_max')(e.target.value)} placeholder="Ex : 120" />
                </Field>
              </div>
            </Section>

            {/* Disciplines */}
            <Section id="tags" title="Disciplines recherchées" icon={Tags}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DISCIPLINE_TAGS.map(tag => (
                  <button key={tag} className={`chip ${form.discipline_tags.includes(tag) ? 'chip-active' : ''}`} onClick={() => toggleDiscipline(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
              {form.discipline_tags.length > 0 && (
                <p style={{ fontSize: '13px', color: colors.violet.primary, marginTop: '8px', fontWeight: 600 }}>
                  {form.discipline_tags.length} discipline{form.discipline_tags.length > 1 ? 's' : ''} sélectionnée{form.discipline_tags.length > 1 ? 's' : ''}
                </p>
              )}
            </Section>

            {/* Thème / mots-clés */}
            <Section title="Thème / mots-clés" hint="(optionnel)" icon={Hash}>
              <Field label="Ajoutez des mots-clés" hint="— appuyez sur Entrée">
                <input
                  className="form-input"
                  value={themeInput}
                  onChange={e => setThemeInput(e.target.value)}
                  onKeyDown={addTheme}
                  placeholder="Ex : nature, bien-être, upcycling…"
                />
              </Field>
              {form.theme.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.theme.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: radius.pill, backgroundColor: colors.violet.bg, border: `1px solid ${colors.violet.primary}30`, color: colors.violet.primary, fontSize: '13px', fontWeight: 600 }}>
                      #{t}
                      <button onClick={() => setForm(f => ({ ...f, theme: f.theme.filter(x => x !== t) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: colors.violet.primary, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* Médias */}
            <Section title="Visuels" hint="(optionnel)" icon={Images}>
              {/* Couverture */}
              <Field label="Image de couverture">
                {form.cover_image ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                    <img src={form.cover_image} alt="cover" style={{ width: '100%', borderRadius: radius.sm, objectFit: 'cover', maxHeight: '180px', display: 'block' }} />
                    <button onClick={() => setForm(f => ({ ...f, cover_image: '' }))}
                      style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: radius.pill, border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: radius.sm, border: `1.5px dashed var(--border-color)`, cursor: uploadingCover ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                    <ImageIcon size={18} />
                    {uploadingCover ? 'Chargement…' : 'Choisir une image'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} disabled={uploadingCover} />
                  </label>
                )}
              </Field>

              {/* Galerie */}
              <Field label="Galerie de photos">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.media.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={url} alt={`media-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius.sm, display: 'block' }} />
                      <button onClick={() => setForm(f => ({ ...f, media: f.media.filter((_, j) => j !== i) }))}
                        style={{ position: 'absolute', top: '3px', right: '3px', width: '20px', height: '20px', borderRadius: radius.pill, border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: radius.sm, border: `1.5px dashed var(--border-color)`, cursor: uploadingMedia ? 'not-allowed' : 'pointer', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: 600 }}>
                    {uploadingMedia ? '…' : <><Plus size={18} /><span>Ajouter</span></>}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleMediaUpload} disabled={uploadingMedia} />
                  </label>
                </div>
              </Field>
            </Section>

            {/* Règlement */}
            <Section title="Règlement" hint="(optionnel)" icon={ScrollText}>
              <textarea className="form-input" value={form.rules} onChange={e => set('rules')(e.target.value)} placeholder="Commission, assurance requise, horaires de setup…" rows={4} style={{ resize: 'vertical' }} />
            </Section>

            {/* FAQ */}
            <Section title="FAQ" hint="(optionnel)" icon={HelpCircle}>
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
                      style={{ marginTop: '8px', width: '32px', height: '32px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.solid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, faq: [...f.faq, { q: '', a: '' }] }))}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: radius.sm, border: `1px dashed var(--border-color)`, backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={14} /> Ajouter une question
                </button>
              </div>
            </Section>

            {/* Paiement Stripe */}
            <Section title="Paiement en ligne" icon={CreditCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: radius.md, border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: radius.sm, backgroundColor: form.stripe_enabled ? colors.violet.bg : 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={18} color={form.stripe_enabled ? colors.violet.primary : 'var(--text-tertiary)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Activer le paiement Stripe</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Le créateur paie son stand en ligne à la validation</p>
                </div>
                <button
                  onClick={() => set('stripe_enabled')(!form.stripe_enabled)}
                  style={{ width: '48px', height: '28px', borderRadius: radius.pill, border: 'none', cursor: 'pointer', backgroundColor: form.stripe_enabled ? colors.violet.primary : 'var(--border-color)', position: 'relative', transition: transitions.base, flexShrink: 0 }}
                >
                  <span style={{ position: 'absolute', top: '3px', width: '22px', height: '22px', borderRadius: radius.pill, backgroundColor: 'var(--bg-primary)', boxShadow: shadows.sm, transition: 'left 200ms', left: form.stripe_enabled ? '23px' : '3px' }} />
                </button>
              </div>
            </Section>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
              <button
                onClick={() => handleSave(false)}
                disabled={saving || eventLimitReached}
                style={{ flex: 1, padding: '14px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, fontFamily: typography.fontFamily, cursor: (saving || eventLimitReached) ? 'not-allowed' : 'pointer', opacity: (saving || eventLimitReached) ? 0.5 : 1, transition: transitions.base }}
              >
                Enregistrer en brouillon
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || eventLimitReached}
                style={{ flex: 2, padding: '14px', borderRadius: radius.sm, border: 'none', backgroundColor: colors.violet.primary, color: colors.text.onViolet, fontSize: '15px', fontWeight: 700, fontFamily: typography.fontFamily, cursor: (saving || eventLimitReached) ? 'not-allowed' : 'pointer', opacity: (saving || eventLimitReached) ? 0.5 : 1, transition: transitions.base, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? (
                  <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: colors.text.onViolet, borderRadius: radius.pill, display: 'inline-block', animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
                ) : 'Publier maintenant'}
              </button>
            </div>
          </div>

          {/* Sidebar de progression / résumé (sticky) */}
          <div style={{ position: 'sticky', top: '96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: radius.md, border: `1px solid var(--border-color)`, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>Progression</h3>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.violet.primary }}>{progressPct}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: radius.pill, backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '18px' }}>
                <motion.div
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', backgroundColor: colors.violet.primary, borderRadius: radius.pill }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {STEPS.map(step => {
                  const done = step.isComplete(form)
                  const Icon = step.icon
                  return (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {done
                        ? <CheckCircle2 size={16} color={colors.feedback.success.solid} style={{ flexShrink: 0 }} />
                        : <Circle size={16} color={'var(--border-color)'} style={{ flexShrink: 0 }} />}
                      <Icon size={14} color={'var(--text-tertiary)'} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: done ? 600 : 400 }}>{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {form.title && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: 'var(--bg-primary)', borderRadius: radius.md, border: `1px solid var(--border-color)`, padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 12px' }}>Aperçu</h3>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>{form.title}</p>
                {form.city && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={12} /> {form.city}</p>}
                {form.start_date && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CalendarDays size={12} /> {new Date(form.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    {form.end_date && form.end_date !== form.start_date && ` – ${new Date(form.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                  </p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ id, title, hint, icon: Icon, children }: { id?: string; title: string; hint?: string; icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode }) {
  return (
    <motion.div id={id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4 }}
      style={{ backgroundColor: 'var(--bg-primary)', borderRadius: radius.md, border: `1px solid var(--border-color)`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid var(--bg-secondary)`, paddingBottom: '12px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: radius.sm, backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={colors.violet.primary} />
        </div>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {title} {hint && <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>{hint}</span>}
        </h2>
      </div>
      {children}
    </motion.div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label} {hint && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}
