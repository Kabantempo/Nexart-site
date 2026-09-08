'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Info, MapPin, CalendarDays, Repeat, Store, Tags, ScrollText,
  HelpCircle, CreditCard, CheckCircle2, Circle, AlertCircle, Plus, X, Image as ImageIcon, Images, Hash,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors, typography, spacing, radius, shadows, transitions } from '@/lib/design-tokens'

interface CitySuggestion {
  nom: string; region: string; departement: string; lat: number | null; lng: number | null
}

const EVENT_TYPES = [
  { label: 'Pop-up', value: 'popup' }, { label: 'Salon', value: 'salon' },
  { label: 'Foire', value: 'fair' }, { label: 'Permanent', value: 'permanent' },
  { label: 'Saisonnier', value: 'seasonal' },
] as const

const DISCIPLINE_TAGS = [
  'Tatouage','Céramique','Gravure','Joaillerie','Bijoux','Illustration',
  'Textile','Maroquinerie','Sculpture','Photographie','Peinture','Poterie',
  'Broderie','Lutherie','Verrerie','Reliure','Cosmétique naturelle','Savonnerie',
  'Coutellerie','Bougies','Macramé','Origami','Calligraphie','Sérigraphie',
]

interface StandType { count: string; dimensions: string; price_min: string; price_max: string }
interface FormData {
  title: string; description: string; event_type: string; location: string; city: string; region: string
  start_date: string; end_date: string; start_time: string; end_time: string
  stand_types: StandType[]; discipline_tags: string[]; rules: string; stripe_enabled: boolean
  faq: { q: string; a: string }[]; recurrence_type: string; recurrence_end_date: string
  cover_image: string; media: string[]; lat: number | null; lng: number | null; theme: string[]
  application_deadline: string; status: string
}

const EMPTY_FORM: FormData = {
  title:'', description:'', event_type:'popup', location:'', city:'', region:'',
  start_date:'', end_date:'', start_time:'', end_time:'',
  stand_types:[{ count:'', dimensions:'', price_min:'', price_max:'' }],
  discipline_tags:[], rules:'', stripe_enabled:false, faq:[], recurrence_type:'none',
  recurrence_end_date:'', cover_image:'', media:[], lat:null, lng:null, theme:[],
  application_deadline:'', status:'draft',
}

const STEPS = [
  { label: 'Informations générales', icon: Info,         isComplete: (f: FormData) => !!f.title.trim() },
  { label: 'Localisation',           icon: MapPin,        isComplete: (f: FormData) => !!f.city.trim() },
  { label: 'Dates & horaires',       icon: CalendarDays,  isComplete: (f: FormData) => !!f.start_date && !!f.end_date },
  { label: 'Stands & tarification',  icon: Store,         isComplete: (f: FormData) => f.stand_types.some(t => !!t.count) },
  { label: 'Disciplines',            icon: Tags,          isComplete: (f: FormData) => f.discipline_tags.length > 0 },
  { label: 'Visuels',                icon: ImageIcon,     isComplete: (f: FormData) => !!f.cover_image },
]

export default function EditEventClient({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [form, setForm]         = useState<FormData>({ ...EMPTY_FORM })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [token, setToken]       = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingMedia, setUploadingMedia]   = useState(false)
  const [themeInput, setThemeInput]           = useState('')
  const [userId, setUserId]     = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setToken(session.access_token)
      setUserId(session.user.id)

      const res = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) { router.push('/dashboard'); return }
      const { event: ev } = await res.json()

      if (ev.organizer_id !== session.user.id) { router.push('/dashboard'); return }

      // Priorité : stand_types_data (JSONB complet) > stand_dimensions (legacy)
      let stand_types: StandType[] = [{ count: '', dimensions: '', price_min: '', price_max: '' }]
      if (Array.isArray(ev.stand_types_data) && ev.stand_types_data.length > 0) {
        stand_types = ev.stand_types_data.map((t: StandType) => ({
          count:      String(t.count ?? ''),
          dimensions: t.dimensions ?? '',
          price_min:  t.price_min !== undefined ? String(t.price_min) : '',
          price_max:  t.price_max !== undefined ? String(t.price_max) : '',
        }))
      } else if (ev.stand_dimensions) {
        // Legacy: "30 x 3m x 4m, 4 x 1m x 2m" → split sur `,`, puis premier token = count, le reste = dimensions
        stand_types = String(ev.stand_dimensions).split(',').map((s: string) => {
          const trimmed = s.trim()
          const spaceIdx = trimmed.indexOf(' x ')
          const count = spaceIdx >= 0 ? trimmed.slice(0, spaceIdx) : trimmed
          const dimensions = spaceIdx >= 0 ? trimmed.slice(spaceIdx + 3) : ''
          return { count: count.trim(), dimensions: dimensions.trim(), price_min: '', price_max: '' }
        })
        if (ev.stand_price) stand_types[0].price_min = String(ev.stand_price)
      }
      if (stand_types.length === 1 && !stand_types[0].count && ev.stand_count) {
        stand_types[0].count = String(ev.stand_count)
      }

      setForm({
        title:               ev.title ?? '',
        description:         ev.description ?? '',
        event_type:          ev.event_type ?? 'popup',
        location:            ev.location ?? '',
        city:                ev.city ?? '',
        region:              ev.region ?? '',
        start_date:          ev.start_date ? ev.start_date.slice(0, 10) : '',
        end_date:            ev.end_date ? ev.end_date.slice(0, 10) : '',
        start_time:          ev.start_time ?? '',
        end_time:            ev.end_time ?? '',
        stand_types,
        discipline_tags:     ev.discipline_tags ?? [],
        rules:               ev.rules ?? '',
        stripe_enabled:      ev.stripe_enabled ?? false,
        faq:                 Array.isArray(ev.faq) ? ev.faq : [],
        recurrence_type:     ev.recurrence_type ?? 'none',
        recurrence_end_date: ev.recurrence_end_date ? ev.recurrence_end_date.slice(0, 10) : '',
        cover_image:         ev.cover_image ?? '',
        media:               ev.media ?? [],
        lat:                 ev.lat ?? null,
        lng:                 ev.lng ?? null,
        theme:               ev.theme ?? [],
        application_deadline: ev.application_deadline ? ev.application_deadline.slice(0, 10) : '',
        status:              ev.status ?? 'draft',
      })
      setLoading(false)
    })
  }, [eventId, router])

  const set = (key: keyof FormData) => (value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleDiscipline = (tag: string) =>
    setForm(f => ({ ...f, discipline_tags: f.discipline_tags.includes(tag) ? f.discipline_tags.filter(t => t !== tag) : [...f.discipline_tags, tag] }))

  const updateStandType = (i: number, key: keyof StandType) => (value: string) =>
    setForm(f => { const st = [...f.stand_types]; st[i] = { ...st[i], [key]: value }; return { ...f, stand_types: st } })

  const handleCityInput = (value: string) => {
    setForm(f => ({ ...f, city: value, lat: null, lng: null }))
    clearTimeout(cityDebounce.current)
    if (value.length < 2) { setCitySuggestions([]); setShowCitySuggestions(false); return }
    cityDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(value)}&fields=nom,region,departement,centre&limit=6`)
        const data = await res.json()
        setCitySuggestions((data as any[]).map((d: any) => ({ nom: d.nom, region: d.region?.nom ?? '', departement: d.departement?.nom ?? '', lat: d.centre?.coordinates?.[1] ?? null, lng: d.centre?.coordinates?.[0] ?? null })))
        setShowCitySuggestions(true)
      } catch { /* ignore */ }
    }, 300)
  }

  const selectCity = (s: CitySuggestion) => {
    setForm(f => ({ ...f, city: s.nom, region: s.region, lat: s.lat, lng: s.lng }))
    setCitySuggestions([]); setShowCitySuggestions(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingCover(true)
    const path = `${userId}/cover_${Date.now()}.${file.name.split('.').pop()}`
    const { error: upErr } = await supabase.storage.from('event-media').upload(path, file, { upsert: true })
    if (!upErr) { const { data: { publicUrl } } = supabase.storage.from('event-media').getPublicUrl(path); setForm(f => ({ ...f, cover_image: publicUrl })) }
    setUploadingCover(false)
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length) return
    setUploadingMedia(true)
    const urls: string[] = []
    for (const file of files) {
      const path = `${userId}/media_${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('event-media').upload(path, file, { upsert: true })
      if (!upErr) { const { data: { publicUrl } } = supabase.storage.from('event-media').getPublicUrl(path); urls.push(publicUrl) }
    }
    setForm(f => ({ ...f, media: [...f.media, ...urls] }))
    setUploadingMedia(false)
  }

  const addTheme = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); const val = themeInput.trim(); if (val && !form.theme.includes(val)) setForm(f => ({ ...f, theme: [...f.theme, val] })); setThemeInput('') }
  }

  const completedCount = useMemo(() => STEPS.filter(s => s.isComplete(form)).length, [form])
  const progressPct = Math.round((completedCount / STEPS.length) * 100)

  const totalStandCount = () => form.stand_types.reduce((sum, t) => sum + (Number(t.count) || 0), 0)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.title.trim())      errs.title = 'Requis'
    if (!form.city.trim())       errs.city = 'Requis'
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      errs.end_date = 'Doit être après la date de début'
    if (form.application_deadline && form.start_date && form.application_deadline > form.start_date)
      errs.application_deadline = 'Doit être avant la date de début'
    form.stand_types.forEach((t, i) => {
      if (t.count && (!/^\d+$/.test(t.count.trim()) || Number(t.count) < 1))
        errs[`stand_count_${i}`] = 'Nombre entier requis (ex: 2)'
      if (t.price_min && t.price_max && Number(t.price_max) < Number(t.price_min))
        errs[`stand_price_${i}`] = 'Prix max < prix min'
    })
    return errs
  }

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const handleSave = async (publish?: boolean) => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setError('Corrigez les champs en rouge avant de sauvegarder')
      return
    }
    setFieldErrors({})
    setSaving(true); setError(null)

    const standDimensions = form.stand_types.filter(t => t.count).map(t => t.dimensions.trim() ? `${t.count} x ${t.dimensions.trim()}` : `${t.count} stand${Number(t.count) > 1 ? 's' : ''}`).join(', ')
    const payload = {
      title:             form.title.trim(),
      description:       form.description.trim() || null,
      event_type:        form.event_type,
      city:              form.city.trim(),
      region:            form.region.trim() || null,
      location:          form.location.trim() || null,
      start_date:        form.start_date || undefined,
      end_date:          form.end_date || undefined,
      start_time:        form.start_time || null,
      end_time:          form.end_time || null,
      stand_count:       totalStandCount() || 0,
      stand_price:       (() => { const mins = form.stand_types.map(t => t.price_min !== '' ? Number(t.price_min) : null).filter(v => v !== null) as number[]; return mins.length ? Math.min(...mins) : null })(),
      stand_dimensions:  standDimensions || null,
      stand_types_data:  form.stand_types.filter(t => t.count),
      discipline_tags:   form.discipline_tags ?? [],
      rules:             form.rules.trim() || null,
      faq:               form.faq.filter(f => f.q.trim() && f.a.trim()),
      stripe_enabled:    form.stripe_enabled,
      cover_image:       form.cover_image || null,
      media:             form.media ?? [],
      lat:               form.lat, lng: form.lng,
      theme:             form.theme ?? [],
      application_deadline: form.application_deadline || null,
      recurrence_type:   form.recurrence_type,
      ...(publish !== undefined ? { status: publish ? 'published' : 'draft' } : {}),
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur mise à jour'); return }
      router.push(`/events/${eventId}/dashboard`)
    } catch { setError('Erreur réseau') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', borderRadius: radius.pill, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: 'calc(100vh - 80px)', padding: '40px 16px 80px' }}>
      <style>{`
        .form-input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border-color); border-radius: ${radius.sm}; font-size: 15px; font-family: ${typography.fontFamily}; color: var(--text-primary); background: var(--bg-primary); outline: none; box-sizing: border-box; transition: ${transitions.fast}; }
        .form-input:focus { border-color: ${colors.violet.primary}; box-shadow: ${shadows.focus}; }
        .form-input-error { border-color: ${colors.feedback.danger.solid} !important; background: rgba(224,90,90,0.05) !important; }
        .form-input-error:focus { box-shadow: 0 0 0 3px rgba(224,90,90,0.15) !important; }
        .chip { padding: 7px 15px; border-radius: ${radius.pill}; border: 1.5px solid var(--border-color); background: var(--bg-primary); font-size: 14px; font-weight: 500; font-family: ${typography.fontFamily}; cursor: pointer; transition: ${transitions.fast}; white-space: nowrap; color: var(--text-primary); }
        .chip:hover { border-color: ${colors.violet.primary}; color: ${colors.violet.primary}; }
        .chip-active { background: ${colors.violet.primary} !important; border-color: ${colors.violet.primary} !important; color: #fff !important; }
      `}</style>

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: '32px' }}>
          <button onClick={() => router.push(`/events/${eventId}/dashboard`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontFamily: typography.fontFamily, cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            <ArrowLeft size={15} /> Retour au dashboard
          </button>
          <h1 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Modifier le marché</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>Modifiez les informations de votre événement</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: '28px', alignItems: 'start' }}>

          {/* Formulaire */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '14px 18px', borderRadius: radius.sm, backgroundColor: colors.feedback.danger.bg, border: `1px solid ${colors.feedback.danger.border}`, color: colors.feedback.danger.text, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Infos générales ── */}
            <Section title="Informations générales" icon={Info}>
              <Field label="Nom du marché" error={fieldErrors.title}>
                <input className={`form-input${fieldErrors.title ? ' form-input-error' : ''}`} value={form.title} onChange={e => { set('title')(e.target.value); clearFieldError('title') }} placeholder="Ex : Marché de Noël de Lyon" />
              </Field>
              <Field label="Type de marché">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EVENT_TYPES.map(t => (
                    <button key={t.value} className={`chip ${form.event_type === t.value ? 'chip-active' : ''}`} onClick={() => set('event_type')(t.value)}>{t.label}</button>
                  ))}
                </div>
              </Field>
              <Field label="Description" hint="(optionnel)">
                <textarea className="form-input" value={form.description} onChange={e => set('description')(e.target.value)} placeholder="Décrivez votre marché…" rows={4} style={{ resize: 'vertical' }} />
              </Field>
              <Field label="Statut">
                <select className="form-input" value={form.status} onChange={e => set('status')(e.target.value)}>
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="closed">Fermé</option>
                </select>
              </Field>
            </Section>

            {/* ── Localisation ── */}
            <Section title="Localisation" icon={MapPin}>
              <Field label="Adresse / lieu" hint="(optionnel)">
                <input className="form-input" value={form.location} onChange={e => set('location')(e.target.value)} placeholder="Ex : Parc de la Tête d'Or" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: '16px' }}>
                <Field label="Ville" error={fieldErrors.city}>
                  <div style={{ position: 'relative' }}>
                    <input className={`form-input${fieldErrors.city ? ' form-input-error' : ''}`} value={form.city} onChange={e => { handleCityInput(e.target.value); clearFieldError('city') }} onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)} placeholder="Ex : Lyon" autoComplete="off" />
                    {showCitySuggestions && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, borderRadius: radius.sm, boxShadow: shadows.md, marginTop: '2px', overflow: 'hidden' }}>
                        {citySuggestions.map((s, i) => (
                          <button key={i} onMouseDown={() => selectCity(s)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', fontFamily: typography.fontFamily }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span style={{ fontWeight: 600 }}>{s.nom}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>{s.departement}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="Région" hint="(optionnel)">
                  <input className="form-input" value={form.region} onChange={e => set('region')(e.target.value)} placeholder="Ex : Auvergne-Rhône-Alpes" />
                </Field>
              </div>
            </Section>

            {/* ── Dates ── */}
            <Section title="Dates & horaires" icon={CalendarDays}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%),1fr))', gap: '16px' }}>
                <Field label="Date de début"><input className="form-input" type="date" value={form.start_date} onChange={e => { set('start_date')(e.target.value); clearFieldError('end_date') }} /></Field>
                <Field label="Date de fin" error={fieldErrors.end_date}><input className={`form-input${fieldErrors.end_date ? ' form-input-error' : ''}`} type="date" value={form.end_date} onChange={e => { set('end_date')(e.target.value); clearFieldError('end_date') }} /></Field>
                <Field label="Heure ouverture" hint="(opt.)"><input className="form-input" type="time" value={form.start_time} onChange={e => set('start_time')(e.target.value)} /></Field>
                <Field label="Heure fermeture" hint="(opt.)"><input className="form-input" type="time" value={form.end_time} onChange={e => set('end_time')(e.target.value)} /></Field>
                <Field label="Date limite candidature" hint="(opt.)" error={fieldErrors.application_deadline}><input className={`form-input${fieldErrors.application_deadline ? ' form-input-error' : ''}`} type="date" value={form.application_deadline} onChange={e => { set('application_deadline')(e.target.value); clearFieldError('application_deadline') }} max={form.start_date || undefined} /></Field>
              </div>
            </Section>

            {/* ── Stands ── */}
            <Section title="Stands & tarification" icon={Store}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.stand_types.map((t, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}><Field label="Nombre" error={fieldErrors[`stand_count_${i}`]}><input className={`form-input${fieldErrors[`stand_count_${i}`] ? ' form-input-error' : ''}`} type="number" min="1" value={t.count} onChange={e => { updateStandType(i, 'count')(e.target.value); clearFieldError(`stand_count_${i}`) }} placeholder="Ex : 40" /></Field></div>
                      <div style={{ flex: 1 }}><Field label="Dimensions"><input className="form-input" value={t.dimensions} onChange={e => updateStandType(i, 'dimensions')(e.target.value)} placeholder="Ex : 3m × 2m" /></Field></div>
                      {form.stand_types.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, stand_types: f.stand_types.filter((_, j) => j !== i) }))}
                          style={{ marginBottom: '1px', width: '42px', height: '42px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.solid, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Field label="Prix min (€)" hint="0=gratuit"><input className="form-input" type="number" min="0" value={t.price_min} onChange={e => { updateStandType(i, 'price_min')(e.target.value); clearFieldError(`stand_price_${i}`) }} placeholder="60" /></Field>
                      <Field label="Prix max (€)" error={fieldErrors[`stand_price_${i}`]}><input className={`form-input${fieldErrors[`stand_price_${i}`] ? ' form-input-error' : ''}`} type="number" min="0" value={t.price_max} onChange={e => { updateStandType(i, 'price_max')(e.target.value); clearFieldError(`stand_price_${i}`) }} placeholder="120" /></Field>
                    </div>
                  </div>
                ))}
                <button onClick={() => setForm(f => ({ ...f, stand_types: [...f.stand_types, { count:'', dimensions:'', price_min:'', price_max:'' }] }))}
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: radius.sm, border: `1px dashed var(--border-color)`, backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={14} /> Ajouter un type de stand
                </button>
              </div>
            </Section>

            {/* ── Disciplines ── */}
            <Section title="Disciplines recherchées" icon={Tags}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DISCIPLINE_TAGS.map(tag => (
                  <button key={tag} className={`chip ${form.discipline_tags.includes(tag) ? 'chip-active' : ''}`} onClick={() => toggleDiscipline(tag)}>{tag}</button>
                ))}
              </div>
            </Section>

            {/* ── Thème ── */}
            <Section title="Thème / mots-clés" hint="(optionnel)" icon={Hash}>
              <Field label="Mots-clés" hint="— Entrée pour ajouter">
                <input className="form-input" value={themeInput} onChange={e => setThemeInput(e.target.value)} onKeyDown={addTheme} placeholder="Ex : nature, bien-être…" />
              </Field>
              {form.theme.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.theme.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: radius.pill, backgroundColor: colors.violet.bg, color: colors.violet.primary, fontSize: '13px', fontWeight: 600 }}>
                      #{t}
                      <button onClick={() => setForm(f => ({ ...f, theme: f.theme.filter(x => x !== t) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: colors.violet.primary, lineHeight: 1 }}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Médias ── */}
            <Section title="Visuels" hint="(optionnel)" icon={Images}>
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
              <Field label="Galerie de photos">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {form.media.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                      <img src={url} alt={`m${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: radius.sm, display: 'block' }} />
                      <button onClick={() => setForm(f => ({ ...f, media: f.media.filter((_, j) => j !== i) }))}
                        style={{ position: 'absolute', top: '3px', right: '3px', width: '20px', height: '20px', borderRadius: radius.pill, border: 'none', backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label style={{ width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: radius.sm, border: `1.5px dashed var(--border-color)`, cursor: uploadingMedia ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600 }}>
                    {uploadingMedia ? '…' : <><Plus size={18} /><span>Ajouter</span></>}
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleMediaUpload} disabled={uploadingMedia} />
                  </label>
                </div>
              </Field>
            </Section>

            {/* ── Règlement ── */}
            <Section title="Règlement" hint="(optionnel)" icon={ScrollText}>
              <textarea className="form-input" value={form.rules} onChange={e => set('rules')(e.target.value)} placeholder="Commission, assurance, horaires de setup…" rows={4} style={{ resize: 'vertical' }} />
            </Section>

            {/* ── FAQ ── */}
            <Section title="FAQ" hint="(optionnel)" icon={HelpCircle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.faq.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input className="form-input" value={item.q} onChange={e => setForm(f => { const faq = [...f.faq]; faq[i] = { ...faq[i], q: e.target.value }; return { ...f, faq } })} placeholder="Question…" />
                      <textarea className="form-input" value={item.a} onChange={e => setForm(f => { const faq = [...f.faq]; faq[i] = { ...faq[i], a: e.target.value }; return { ...f, faq } })} placeholder="Réponse…" rows={2} style={{ resize: 'vertical' }} />
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

            {/* ── Stripe ── */}
            <Section title="Paiement en ligne" icon={CreditCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: radius.md, border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Activer le paiement Stripe</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Le créateur paie son stand en ligne</p>
                </div>
                <button onClick={() => set('stripe_enabled')(!form.stripe_enabled)}
                  style={{ width: '48px', height: '28px', borderRadius: radius.pill, border: 'none', cursor: 'pointer', backgroundColor: form.stripe_enabled ? colors.violet.primary : 'var(--border-color)', position: 'relative', transition: transitions.base, flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: '3px', width: '22px', height: '22px', borderRadius: radius.pill, backgroundColor: 'var(--bg-primary)', boxShadow: shadows.sm, transition: 'left 200ms', left: form.stripe_enabled ? '23px' : '3px' }} />
                </button>
              </div>
            </Section>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
              <button onClick={() => handleSave()} disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: radius.sm, border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, fontFamily: typography.fontFamily, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                Enregistrer
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                style={{ flex: 2, padding: '14px', borderRadius: radius.sm, border: 'none', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '15px', fontWeight: 700, fontFamily: typography.fontFamily, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {saving ? <><span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: radius.pill, display: 'inline-block', animation: 'spin 1s linear infinite' }} /> Enregistrement…</> : 'Enregistrer et publier'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '96px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: radius.md, border: `1px solid var(--border-color)`, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>Progression</h3>
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.violet.primary }}>{progressPct}%</span>
              </div>
              <div style={{ height: '6px', borderRadius: radius.pill, backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '18px' }}>
                <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', backgroundColor: colors.violet.primary, borderRadius: radius.pill }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {STEPS.map(step => {
                  const done = step.isComplete(form); const Icon = step.icon
                  return (
                    <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {done ? <CheckCircle2 size={16} color={colors.feedback.success.solid} style={{ flexShrink: 0 }} /> : <Circle size={16} color="var(--border-color)" style={{ flexShrink: 0 }} />}
                      <Icon size={14} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: done ? 600 : 400 }}>{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, hint, icon: Icon, children }: { title: string; hint?: string; icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4 }}
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

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: error ? '#E05A5A' : 'var(--text-secondary)' }}>
        {label} {hint && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{hint}</span>}
        {error && <span style={{ fontSize: '11px', fontWeight: 500, marginLeft: '6px' }}>— {error}</span>}
      </label>
      {children}
    </div>
  )
}
