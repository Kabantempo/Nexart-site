'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, ExternalLink, ChevronDown, User, MapPin, Globe, Link2, Eye, AlertCircle, CheckCircle, Tag } from 'lucide-react'
import { colors } from '@/lib/design-tokens'
import { useProfileCustomization } from '@/hooks/useProfileCustomization'
import { ColorPresetPicker } from '@/components/profile-customizer/ColorPresetPicker'
import { FontPicker } from '@/components/profile-customizer/FontPicker'
import { SectionsToggle } from '@/components/profile-customizer/SectionsToggle'
import { CoverImageUploader } from '@/components/profile-customizer/CoverImageUploader'
import { LivePreview } from '@/components/profile-customizer/LivePreview'
import { PortfolioBoard } from '@/components/profile-customizer/PortfolioBoard'
import { supabase } from '@/lib/supabase'
import { DEFAULT_PAGE_SETTINGS, type SectionKey } from '@/lib/page-settings'

interface CreatorInfo { full_name: string; avatar_url?: string; bio?: string; creator_id?: string; disciplines?: string[] }

type Panel = 'apparence' | 'identite' | 'disciplines' | 'localisation' | 'sections' | 'portfolio'

const PANELS: { key: Panel; label: string }[] = [
  { key: 'apparence', label: 'Apparence' },
  { key: 'identite', label: 'Identité' },
  { key: 'disciplines', label: 'Disciplines' },
  { key: 'localisation', label: 'Localisation & liens' },
  { key: 'sections', label: 'Sections' },
  { key: 'portfolio', label: 'Portfolio' },
]

const RADIUS_OPTIONS = [
  { value: '10km', label: '10 km' },
  { value: '25km', label: '25 km' },
  { value: '50km', label: '50 km' },
  { value: '100km', label: '100 km' },
  { value: 'region', label: 'Ma région' },
  { value: 'national', label: 'France entière' },
]

export default function PersonnaliserClient() {
  const router = useRouter()
  const { settings, loading, saving, error, save, update } = useProfileCustomization()
  const [creator, setCreator] = useState<CreatorInfo | null>(null)
  const [open, setOpen] = useState<Panel>('apparence')
  const [tagline, setTagline] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [disciplineInput, setDisciplineInput] = useState('')
  const [pendingDisciplines, setPendingDisciplines] = useState<{ id: string; name: string; status: string }[]>([])
  const [disciplineSubmitting, setDisciplineSubmitting] = useState(false)
  const [disciplineError, setDisciplineError] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<{ nom: string; region: string; departement: string; codesPostaux: string[] }[]>([])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityContainerRef = useRef<HTMLDivElement>(null)
  const [travelRadius, setTravelRadius] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [etsy, setEtsy] = useState('')
  const [savingCreator, setSavingCreator] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      setSessionToken(session.access_token)
      setUserId(session.user.id)
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url, bio').eq('id', session.user.id).maybeSingle()
      const { data: cp } = await supabase.from('creator_profiles').select('id, disciplines, city, region, travel_radius, website, instagram, etsy').eq('user_id', session.user.id).maybeSingle()
      if (profile) setCreator({ ...profile, avatar_url: profile.avatar_url ?? undefined, bio: profile.bio ?? undefined, creator_id: session.user.id, disciplines: cp?.disciplines ?? [] })
      setBio(profile?.bio ?? '')
      setDisciplines(cp?.disciplines ?? [])
      setCity(cp?.city ?? '')
      setCityQuery(cp?.city ?? '')
      setRegion(cp?.region ?? '')
      setTravelRadius(cp?.travel_radius ?? '')
      setWebsite(cp?.website ?? '')
      setInstagram(cp?.instagram ?? '')
      setEtsy(cp?.etsy ?? '')

      // Charger les demandes de disciplines personnalisées
      const res = await fetch('/api/profile/custom-discipline', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPendingDisciplines(json.data ?? [])
      }
    }
    loadProfile()
  }, [router])

  const submitCustomDiscipline = async () => {
    const name = disciplineInput.trim()
    if (!name || disciplineSubmitting) return
    setDisciplineError(null)
    setDisciplineSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setDisciplineSubmitting(false); return }
    const res = await fetch('/api/profile/custom-discipline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    if (!res.ok) {
      setDisciplineError(json.error ?? 'Erreur')
    } else {
      setPendingDisciplines(prev => [json.data, ...prev])
      setDisciplineInput('')
    }
    setDisciplineSubmitting(false)
  }

  useEffect(() => {
    if (settings?.tagline !== undefined) setTagline(settings.tagline ?? '')
  }, [settings?.tagline])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid ${colors.violet.primary}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (error && !settings) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: colors.feedback.danger.solid, marginBottom: '16px' }}>{error}</p>
        <button onClick={() => router.push('/profile')} style={{ color: colors.violet.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Retour au profil
        </button>
      </div>
    </div>
  )

  const s = settings ?? DEFAULT_PAGE_SETTINGS

  const handleSave = async (patch = {}) => {
    setSaveError(null)
    const full = { ...s, tagline, ...patch }
    const [result] = await Promise.all([
      save(full),
      // Sauvegarde bio dans profiles
      userId ? supabase.from('profiles').update({ bio: bio || null }).eq('id', userId).then(() => null) : Promise.resolve(null),
      // Sauvegarde disciplines/ville/rayon/liens via API creator_profiles
      sessionToken ? fetch('/api/profile/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ disciplines, city: city || null, region: region || null, travel_radius: travelRadius || null, website: website || null, instagram: instagram || null, etsy: etsy || null }),
      }).catch(() => null) : Promise.resolve(null),
    ])
    if (result?.ok) {
      setSaved(true)
      setCreator(prev => prev ? { ...prev, disciplines } : prev)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const msg = (result as any)?.error ?? error ?? 'Erreur inconnue'
      setSaveError(msg)
      console.error('[personnaliser] save failed:', msg, { full })
    }
  }

  const toggle = (key: Panel) => setOpen(prev => prev === key ? 'apparence' : key)

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .perso-header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .perso-main-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
        .perso-preview-sticky { position: sticky; top: 72px; }
        @media (max-width: 900px) {
          .perso-main-grid { grid-template-columns: 1fr; }
          .perso-preview-sticky { position: static; }
        }
        @media (max-width: 600px) {
          .perso-header-actions .perso-see-page { display: none; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.primary, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text.secondary, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Profil
          </button>
          <span style={{ color: colors.border.default }}>|</span>
          <h1 style={{ fontSize: '15px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>
            Personnaliser ma page
          </h1>
          <div className="perso-header-actions" style={{ marginLeft: 'auto' }}>
            {saveError && (
              <span style={{ fontSize: '12px', color: colors.feedback.danger.solid, maxWidth: '200px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> {saveError}
              </span>
            )}
            {creator?.creator_id && (
              <a href={`/creators/${creator.creator_id}`} target="_blank" rel="noopener" className="perso-see-page" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.primary, color: colors.text.secondary, fontSize: '12px', textDecoration: 'none' }}>
                <ExternalLink size={13} /> Voir ma page
              </a>
            )}
            <button
              onClick={() => handleSave()}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: saveError ? colors.feedback.danger.solid : saved ? colors.feedback.success.solid : colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', transition: 'background 0.3s' }}
            >
              <Save size={14} />
              {saving ? 'Sauvegarde…' : saveError ? 'Réessayer' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="perso-main-grid" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Left: editor panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PANELS.map(panel => (
            <div key={panel.key} style={{ borderRadius: '14px', border: `1px solid ${open === panel.key ? colors.violet.primary + '55' : colors.border.default}`, overflow: 'hidden', transition: 'border-color 0.2s', backgroundColor: colors.bg.primary }}>
              {/* Panel header */}
              <button
                onClick={() => toggle(panel.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', backgroundColor: open === panel.key ? colors.violet.wash : 'transparent' }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: open === panel.key ? colors.violet.text : colors.text.primary }}>
                  {panel.label}
                </span>
                <ChevronDown size={16} color={colors.text.muted} style={{ transform: open === panel.key ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Panel body */}
              {open === panel.key && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px', borderTop: `1px solid ${colors.border.default}` }}>

                    {panel.key === 'apparence' && (
                      <>
                        <ColorPresetPicker value={s.accent_color ?? '#6366F1'} onChange={c => { update({ accent_color: c }); }} />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Couleur fond</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['#0D0D0D', '#1A1A2E', '#0F3460', '#1B2838', '#FFFFFF', '#F5F3EF'].map(c => (
                              <button key={c} onClick={() => update({ bg_color: c })} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, border: `3px solid ${s.bg_color === c ? colors.violet.primary : 'transparent'}`, cursor: 'pointer', outline: s.bg_color === c ? `2px solid ${colors.violet.primary}` : 'none', outlineOffset: '2px' }} />
                            ))}
                            <label style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${colors.border.default}` }}>
                              <div style={{ width: '100%', height: '100%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                              <input type="color" value={s.bg_color ?? '#0D0D0D'} onChange={e => update({ bg_color: e.target.value })} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                            </label>
                          </div>
                        </div>
                        <FontPicker value={s.bio_font ?? 'default'} onChange={f => update({ bio_font: f })} />
                      </>
                    )}

                    {panel.key === 'identite' && (
                      <>
                        <CoverImageUploader value={s.cover_image} positionY={s.cover_position_y ?? 50} onChange={url => update({ cover_image: url })} onPositionChange={y => update({ cover_position_y: y })} accentColor={s.accent_color ?? '#6366F1'} />
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio</p>
                          <textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={500} rows={4} placeholder="Parle de toi, de ton univers créatif…"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
                          <p style={{ fontSize: '11px', color: colors.text.muted, marginTop: '4px', textAlign: 'right' }}>{bio.length}/500</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tagline</p>
                          <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} maxLength={80} placeholder="Ex : Artisan céramiste passionné"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', boxSizing: 'border-box' }} />
                          <p style={{ fontSize: '11px', color: colors.text.muted, marginTop: '4px', textAlign: 'right' }}>{tagline.length}/80</p>
                        </div>
                      </>
                    )}

                    {panel.key === 'disciplines' && (
                      <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {disciplines.map(d => (
                            <span key={d} onClick={() => setDisciplines(prev => prev.filter(x => x !== d))}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', borderRadius: '20px', backgroundColor: `${s.accent_color ?? '#6366F1'}22`, border: `1px solid ${s.accent_color ?? '#6366F1'}55`, fontSize: '12px', color: colors.text.primary, cursor: 'pointer', fontWeight: 500 }}>
                              {d} <span style={{ fontSize: '14px', lineHeight: 1, color: colors.text.muted }}>×</span>
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {['Céramique','Poterie','Peinture','Illustration','Photographie','Sculpture','Bijoux','Joaillerie','Textile','Broderie','Maroquinerie','Gravure','Lutherie','Verrerie','Reliure','Tatouage','Cosmétique naturelle','Savonnerie','Bougies','Macramé','Origami','Calligraphie','Coutellerie','Couture','Tricot/Crochet','Papeterie'].filter(d => !disciplines.includes(d)).map(d => (
                            <button key={d} onClick={() => setDisciplines(prev => [...prev, d])}
                              style={{ padding: '4px 10px', borderRadius: '20px', border: `1px solid ${colors.border.default}`, backgroundColor: colors.bg.secondary, color: colors.text.secondary, fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>
                              {d}
                            </button>
                          ))}
                        </div>
                        {/* Disciplines en attente de validation */}
                        {pendingDisciplines.length > 0 && (
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: colors.text.muted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>En attente de validation</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {pendingDisciplines.map(d => (
                                <span key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '20px', border: `1px dashed ${d.status === 'rejected' ? colors.feedback.danger.solid : d.status === 'approved' ? colors.feedback.success.solid : colors.text.muted}`, fontSize: '12px', color: d.status === 'rejected' ? colors.feedback.danger.solid : d.status === 'approved' ? colors.feedback.success.solid : colors.text.secondary, fontWeight: 500 }}>
                                  {d.name}
                                  <span style={{ fontSize: '10px', opacity: 0.7 }}>
                                    {d.status === 'approved' ? '· validée' : d.status === 'rejected' ? '· refusée' : '· en attente'}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Soumettre une discipline personnalisée */}
                        <div>
                          <p style={{ fontSize: '11px', color: colors.text.muted, marginBottom: '6px' }}>Tu ne trouves pas ta discipline ? Propose-la (1 par jour, validation admin requise)</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input type="text" value={disciplineInput} onChange={e => { setDisciplineInput(e.target.value); setDisciplineError(null) }}
                              onKeyDown={e => { if (e.key === 'Enter') submitCustomDiscipline() }}
                              placeholder="Nom de ta discipline…" maxLength={50}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${disciplineError ? colors.feedback.danger.solid : colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none' }} />
                            <button onClick={submitCustomDiscipline} disabled={disciplineSubmitting || !disciplineInput.trim()}
                              style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: disciplineSubmitting ? colors.text.muted : (s.accent_color ?? '#6366F1'), color: '#fff', fontSize: '12px', fontWeight: 600, cursor: disciplineSubmitting ? 'wait' : 'pointer', opacity: !disciplineInput.trim() ? 0.5 : 1 }}>
                              {disciplineSubmitting ? '…' : 'Proposer'}
                            </button>
                          </div>
                          {disciplineError && <p style={{ fontSize: '11px', color: colors.feedback.danger.solid, marginTop: '5px' }}>{disciplineError}</p>}
                        </div>
                      </>
                    )}

                    {panel.key === 'localisation' && (
                      <>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ville & déplacement</p>
                          <div ref={cityContainerRef} style={{ position: 'relative', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input value={cityQuery}
                                onChange={e => {
                                  const q = e.target.value
                                  setCityQuery(q); setCity(q); setCityDropdownOpen(true)
                                  if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
                                  if (q.length < 2) { setCitySuggestions([]); return }
                                  cityDebounceRef.current = setTimeout(async () => {
                                    try {
                                      const isPostal = /^\d+$/.test(q)
                                      const url = isPostal
                                        ? `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(q)}&fields=nom,region,departement,codesPostaux&boost=population&limit=6`
                                        : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,region,departement,codesPostaux&boost=population&limit=6`
                                      const r = await fetch(url)
                                      const data = await r.json()
                                      setCitySuggestions(data.map((c: { nom: string; region: { nom: string }; departement: { nom: string }; codesPostaux: string[] }) => ({
                                        nom: c.nom, region: c.region?.nom ?? '', departement: c.departement?.nom ?? '', codesPostaux: c.codesPostaux ?? [],
                                      })))
                                    } catch { setCitySuggestions([]) }
                                  }, 250)
                                }}
                                onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                                onFocus={() => citySuggestions.length > 0 && setCityDropdownOpen(true)}
                                placeholder="Ville ou code postal" autoComplete="off"
                                style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none' }} />
                              <input value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                placeholder="CP" maxLength={5}
                                style={{ width: '72px', flexShrink: 0, padding: '10px 10px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', fontFamily: 'monospace' }} />
                            </div>
                            {cityDropdownOpen && citySuggestions.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden' }}>
                                {citySuggestions.map((sg, i) => (
                                  <button key={i} type="button"
                                    onMouseDown={() => { setCity(sg.nom); setRegion(sg.region); setCityQuery(sg.nom); if (sg.codesPostaux?.length === 1) setPostalCode(sg.codesPostaux[0]); setCityDropdownOpen(false); setCitySuggestions([]) }}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', border: 'none', borderBottom: i < citySuggestions.length - 1 ? `1px solid ${colors.border.default}` : 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = colors.bg.secondary)}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                  >
                                    <div>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text.primary }}>{sg.nom}</span>
                                      <span style={{ fontSize: '11px', color: colors.text.muted, marginLeft: '8px' }}>{sg.departement} · {sg.region}</span>
                                    </div>
                                    {sg.codesPostaux?.length > 0 && <span style={{ fontSize: '11px', color: s.accent_color ?? '#6366F1', fontWeight: 600, fontFamily: 'monospace' }}>{sg.codesPostaux[0]}{sg.codesPostaux.length > 1 ? '…' : ''}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {region && <p style={{ fontSize: '11px', color: colors.text.muted, marginBottom: '8px' }}>Région : {region}</p>}
                          <select value={travelRadius} onChange={e => setTravelRadius(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', cursor: 'pointer' }}>
                            <option value="">— Rayon non renseigné</option>
                            {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Liens</p>
                          <div style={{ marginBottom: '10px' }}>
                            <p style={{ fontSize: '11px', color: colors.text.muted, marginBottom: '4px' }}>Site web</p>
                            <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://monsite.fr"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <p style={{ fontSize: '11px', color: colors.text.muted, marginBottom: '4px' }}>Instagram</p>
                            <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@moncompte ou URL"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <p style={{ fontSize: '11px', color: colors.text.muted, marginBottom: '4px' }}>Etsy</p>
                            <input type="text" value={etsy} onChange={e => setEtsy(e.target.value)} placeholder="Nom de ta boutique Etsy"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: colors.bg.secondary, outline: 'none', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                      </>
                    )}

                    {panel.key === 'sections' && s.sections_order && (
                      <SectionsToggle
                        order={(s.sections_order as SectionKey[]).filter(k => k !== 'reviews')}
                        visible={s.sections_visible ?? {}}
                        onChange={patch => update(patch)}
                      />
                    )}

                    {panel.key === 'portfolio' && (
                      <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>
                        Le board s'affiche à droite →
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Error display */}
          {(saveError || error) && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: colors.feedback.danger.bg, border: `1px solid ${colors.feedback.danger.border}`, fontSize: '12px', color: colors.feedback.danger.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} /> {saveError || error}
            </div>
          )}

          {/* Save bottom */}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            style={{ padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: saveError ? colors.feedback.danger.solid : saved ? colors.feedback.success.solid : colors.violet.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', marginTop: '8px', transition: 'background 0.3s' }}
          >
            {saving ? 'Sauvegarde en cours…' : saveError ? 'Réessayer' : saved ? 'Sauvegardé' : 'Sauvegarder les changements'}
          </button>
        </div>

        {/* Right: contextual preview per panel */}
        <div className="perso-preview-sticky">

          {/* APPARENCE → full profile preview */}
          {open === 'apparence' && (
            <LivePreview
              settings={s}
              creatorName={creator?.full_name ?? ''}
              avatarUrl={creator?.avatar_url}
              bio={bio}
            />
          )}

          {/* IDENTITÉ → hero zoom */}
          {open === 'identite' && (() => {
            const bg = s.bg_color ?? '#0D0D0D'
            const accent = s.accent_color ?? '#6366F1'
            const textColor = s.bio_color ?? '#F5F3EF'
            return (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu — Identité</p>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: bg }}>
                  {/* browser chrome */}
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '6px 12px', display: 'flex', gap: '5px', alignItems: 'center', borderBottom: `1px solid ${colors.border.default}` }}>
                    {['#FF5F57','#FFBD2E','#28CA41'].map(c => <span key={c} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />)}
                  </div>
                  {/* hero */}
                  <div style={{ position: 'relative', height: '180px', backgroundColor: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '16px' }}>
                    {s.cover_image
                      ? <img src={s.cover_image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, objectPosition: `center ${s.cover_position_y ?? 50}%` }} />
                      : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}44, ${bg})` }} />}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `2px solid ${accent}`, overflow: 'hidden', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {creator?.avatar_url
                          ? <img src={creator.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{creator?.full_name?.[0]?.toUpperCase() ?? '?'}</span>}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '15px', fontWeight: 800, color: textColor, margin: '0 0 3px' }}>{creator?.full_name || 'Votre nom'}</p>
                        {(s.tagline || tagline) && <p style={{ fontSize: '12px', color: accent, margin: 0, fontWeight: 600 }}>{s.tagline || tagline}</p>}
                      </div>
                    </div>
                  </div>
                  {/* bio */}
                  <div style={{ padding: '14px 16px', backgroundColor: bg }}>
                    <p style={{ fontSize: '12px', color: `${textColor}bb`, lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {bio || 'Votre bio apparaîtra ici…'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* DISCIPLINES → chips preview */}
          {open === 'disciplines' && (() => {
            const accent = s.accent_color ?? '#6366F1'
            const bg = s.bg_color ?? '#0D0D0D'
            const textColor = s.bio_color ?? '#F5F3EF'
            return (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu — Disciplines</p>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: bg, padding: '20px' }}>
                  {disciplines.length === 0 ? (
                    <p style={{ fontSize: '13px', color: `${textColor}55`, fontStyle: 'italic', margin: 0 }}>Aucune discipline sélectionnée</p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {disciplines.map(d => (
                        <span key={d} style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: `${accent}22`, border: `1px solid ${accent}55`, fontSize: '13px', color: textColor, fontWeight: 500 }}>{d}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: '10px', color: `${textColor}40`, marginTop: '14px', marginBottom: 0 }}>Affiché dans ta colonne gauche</p>
                </div>
              </div>
            )
          })()}

          {/* LOCALISATION → location card preview */}
          {open === 'localisation' && (() => {
            const accent = s.accent_color ?? '#6366F1'
            const bg = s.bg_color ?? '#0D0D0D'
            const textColor = s.bio_color ?? '#F5F3EF'
            const radiusLabel = RADIUS_OPTIONS.find(o => o.value === travelRadius)?.label
            return (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu — Localisation</p>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: bg, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* ville */}
                  {city ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color={accent} style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: textColor, margin: 0 }}>{city}{postalCode ? ` (${postalCode})` : ''}</p>
                        {region && <p style={{ fontSize: '11px', color: `${textColor}70`, margin: 0 }}>{region}</p>}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: `${textColor}55`, fontStyle: 'italic', margin: 0 }}>Ville non renseignée</p>
                  )}
                  {/* rayon */}
                  {radiusLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color={`${textColor}99`} style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: '13px', color: `${textColor}cc`, margin: 0 }}>
                        {travelRadius === 'region' ? <>Déplacement dans <strong style={{ color: accent }}>ma région</strong></> : travelRadius === 'national' ? <>Déplacement sur toute la <strong style={{ color: accent }}>France</strong></> : <>Déplacement jusqu'à <strong style={{ color: accent }}>{radiusLabel}</strong></>}
                      </p>
                    </div>
                  )}
                  {/* liens */}
                  <div style={{ borderTop: `1px solid ${textColor}15`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {website && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={13} color={accent} style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: accent, margin: 0, wordBreak: 'break-all' }}>{website}</p>
                      </div>
                    )}
                    {instagram && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link2 size={13} color={`${textColor}cc`} style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: `${textColor}cc`, margin: 0 }}>{instagram}</p>
                      </div>
                    )}
                    {etsy && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={13} color={`${textColor}cc`} style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '12px', color: `${textColor}cc`, margin: 0 }}>{etsy}</p>
                      </div>
                    )}
                    {!website && !instagram && !etsy && (
                      <p style={{ fontSize: '12px', color: `${textColor}40`, fontStyle: 'italic', margin: 0 }}>Aucun lien renseigné</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* SECTIONS → sections visibility preview */}
          {open === 'sections' && (() => {
            const accent = s.accent_color ?? '#6366F1'
            const bg = s.bg_color ?? '#0D0D0D'
            const textColor = s.bio_color ?? '#F5F3EF'
            const SECTION_LABELS: Record<string, string> = {
              portfolio: 'Portfolio',
              reviews: 'Avis',
              itinerary: 'Itinéraire',
              products: 'Boutique',
              social: 'Réseau social',
            }
            const sections = s.sections_visible ?? {}
            return (
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Aperçu — Sections visibles</p>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: bg, padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(SECTION_LABELS).map(([key, label]) => {
                    const isOn = sections[key as keyof typeof sections] !== false
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', backgroundColor: isOn ? `${accent}12` : `${textColor}06`, border: `1px solid ${isOn ? accent + '44' : textColor + '15'}` }}>
                        <span style={{ fontSize: '13px', color: isOn ? textColor : `${textColor}50`, fontWeight: isOn ? 600 : 400 }}>{label}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: isOn ? accent : `${textColor}40` }}>{isOn ? <Eye size={12} /> : <Eye size={12} style={{ opacity: 0.3 }} />}{isOn ? 'Visible' : 'Masqué'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* PORTFOLIO → board éditeur */}
          {open === 'portfolio' && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Portfolio — placer les photos
              </p>
              <PortfolioBoard
                blocks={s.portfolio_blocks ?? []}
                accentColor={s.accent_color ?? '#6366F1'}
                settings={s}
                creatorName={creator?.full_name}
                avatarUrl={creator?.avatar_url}
                bio={creator?.bio}
                disciplines={creator?.disciplines}
                onSave={save}
                onUpdate={update}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
