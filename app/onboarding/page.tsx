'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Palette, Building2, Eye, ArrowRight, Check, Sparkles, MapPin, Search, User, Calendar } from 'lucide-react'

const DISCIPLINES = [
  'Tatouage','Céramique','Gravure','Joaillerie','Bijoux','Illustration',
  'Textile','Maroquinerie','Sculpture','Photographie','Peinture','Poterie',
  'Broderie','Lutherie','Verrerie','Reliure','Cosmétique naturelle','Savonnerie',
  'Coutellerie','Bougies','Macramé','Origami','Calligraphie','Sérigraphie',
]

type Role = 'creator' | 'organizer' | 'visitor'

const ROLES: { value: Role; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'creator',
    label: 'Créateur',
    desc: 'Artisan, maker, artiste — je veux participer à des marchés et vendre mes créations.',
    icon: <Palette size={28} />,
    color: 'indigo',
  },
  {
    value: 'organizer',
    label: 'Organisateur',
    desc: "J'organise des marchés artisanaux et je recherche des créateurs pour y participer.",
    icon: <Building2 size={28} />,
    color: 'violet',
  },
  {
    value: 'visitor',
    label: 'Visiteur',
    desc: "Je veux découvrir les créateurs et les événements près de chez moi.",
    icon: <Eye size={28} />,
    color: 'gray',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [step, setStep] = useState(0)
  const [role, setRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [orgCity, setOrgCity] = useState('')
  const [orgEventTypes, setOrgEventTypes] = useState<string[]>([])

  const [eventsPerYear, setEventsPerYear] = useState('')
  const [typicalCapacity, setTypicalCapacity] = useState('')
  const [hasUpcomingEvent, setHasUpcomingEvent] = useState<boolean | null>(null)
  const [upcomingEventTitle, setUpcomingEventTitle] = useState('')
  const [upcomingEventDate, setUpcomingEventDate] = useState('')

  const [done, setDone] = useState(false)
  const totalSteps = role === 'creator' ? 3 : role === 'organizer' ? 5 : 2

  const toggleOrgEventType = (t: string) => {
    setOrgEventTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const toggleDisc = (d: string) => {
    setDisciplines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)

    const isCreator = role === 'creator'
    const isOrganizer = role === 'organizer'

    await supabase.from('profiles').update({
      full_name: fullName.trim() || undefined,
      bio: bio.trim() || undefined,
      role: role ?? undefined,
      is_creator: isCreator,
      is_organizer: isOrganizer,
      onboarding_done: true,
    } as any).eq('id', user.id)

    if (isCreator && (disciplines.length || city)) {
      const { data: existing } = await supabase.from('creator_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
      if (existing) {
        await supabase.from('creator_profiles').update({ disciplines, city: city.trim() || null }).eq('user_id', user.id)
      } else {
        await supabase.from('creator_profiles').insert({ user_id: user.id, disciplines, city: city.trim() || null })
      }
    }

    if (isOrganizer && orgName.trim()) {
      const { data: existing } = await supabase.from('organizer_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
      const orgPayload: Record<string, unknown> = {
        organization_name: orgName.trim(),
        event_types: orgEventTypes,
        events_per_year: eventsPerYear || null,
        typical_capacity: typicalCapacity || null,
      }
      if (existing) {
        await supabase.from('organizer_profiles').update(orgPayload as any).eq('user_id', user.id)
      } else {
        await supabase.from('organizer_profiles').insert({ user_id: user.id, ...orgPayload } as any)
      }
    }

    setUser({ ...user, full_name: fullName.trim() || user.full_name, role: role!, is_creator: isCreator, is_organizer: isOrganizer })
    setSaving(false)
    setDone(true)
  }

  const canNext = () => {
    if (step === 0) return role !== null
    if (step === 1) return fullName.trim().length >= 2
    if (step === 2 && role === 'organizer') return orgName.trim().length >= 2
    if (step === 4 && role === 'organizer' && hasUpcomingEvent === true) {
      return upcomingEventTitle.trim().length >= 2
    }
    return true
  }

  const handleCreateNow = async () => {
    await handleFinish()
    router.push('/events/create')
  }

  const next = () => {
    if (step < totalSteps - 1) setStep(s => s + 1)
    else handleFinish()
  }

  const NEXT_STEPS = role === 'creator' ? [
    { icon: <Search size={18} />, label: 'Explorer les événements', href: '/events', desc: 'Trouvez les marchés qui vous correspondent' },
    { icon: <User size={18} />, label: 'Compléter mon profil', href: '/profile', desc: 'Ajoutez vos photos, portfolio et tarifs' },
    { icon: <Calendar size={18} />, label: 'Mon tableau de bord', href: '/dashboard', desc: 'Suivez vos candidatures en temps réel' },
  ] : role === 'organizer' ? [
    { icon: <Calendar size={18} />, label: 'Créer un événement', href: '/events/create', desc: 'Publiez votre marché en 5 minutes' },
    { icon: <Search size={18} />, label: 'Trouver des créateurs', href: '/creators', desc: 'Parcourez les artisans disponibles' },
    { icon: <User size={18} />, label: 'Mon tableau de bord', href: '/dashboard', desc: 'Gérez vos événements et candidatures' },
  ] : [
    { icon: <Search size={18} />, label: 'Explorer les événements', href: '/events', desc: 'Découvrez les marchés près de chez vous' },
    { icon: <User size={18} />, label: 'Découvrir les créateurs', href: '/creators', desc: 'Parcourez les artisans inscrits' },
    { icon: <Calendar size={18} />, label: 'Mon tableau de bord', href: '/dashboard', desc: 'Votre espace personnel Nexart' },
  ]

  if (done) {
    const isOrgWelcome = role === 'organizer'
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#06060f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px' }}>
        <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-128px', left: '-128px', width: '384px', height: '384px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(120px)' }} />
          <div style={{ position: 'absolute', bottom: '-128px', right: '-128px', width: '384px', height: '384px', borderRadius: '50%', background: 'rgba(139,92,246,0.10)', filter: 'blur(120px)' }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '512px', textAlign: 'center' }}
        >
          {/* Check animé */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}
          >
            <Check size={36} style={{ color: '#818cf8' }} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {isOrgWelcome ? (
              <>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>
                  Bienvenue{fullName ? ` ${fullName.split(' ')[0]}` : ''} ! 🎉
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
                  {orgName ? `L'espace organisateur de ${orgName} est prêt.` : 'Votre espace organisateur est prêt.'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '13px', marginBottom: '32px' }}>
                  Voici vos prochaines étapes pour publier votre premier marché.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>C'est parti ! 🎉</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px', lineHeight: '1.6' }}>
                  Votre profil Nexart est créé. Voici vos prochaines étapes pour en profiter au maximum.
                </p>
              </>
            )}
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {NEXT_STEPS.map((s, i) => (
              <motion.a
                key={s.href}
                href={s.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', textDecoration: 'none', textAlign: 'left' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{s.desc}</p>
                </div>
                <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </motion.a>
            ))}
          </div>

          {/* CTA principal pour orga */}
          {isOrgWelcome && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{ marginBottom: '20px' }}>
              <button onClick={() => router.push('/events/create')} style={{
                width: '100%', padding: '16px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <Calendar size={17} />
                Créer mon premier événement
              </button>
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            onClick={() => router.push('/dashboard')}
            style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Accéder directement au dashboard →
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center px-4 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo + progress */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-indigo-400" />
            <span className="text-white font-black text-xl tracking-tight">nexart</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500 w-8' : 'bg-white/10 w-4'}`} />
            ))}
          </div>
          <p className="text-white/30 text-xs mt-3">Étape {step + 1} sur {totalSteps}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Bienvenue sur Nexart</h1>
              <p className="text-white/40 text-sm text-center mb-8">Pour commencer, qui êtes-vous ?</p>
              <div className="flex flex-col gap-3">
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setRole(r.value)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-150 ${
                      role === r.value
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                    }`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                      role === r.value ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-base ${role === r.value ? 'text-white' : 'text-white/70'}`}>{r.label}</p>
                      <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    {role === r.value && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                        <Check size={13} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Votre identité</h1>
              <p className="text-white/40 text-sm text-center mb-8">Ces informations seront visibles sur votre profil public.</p>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ex: Marie Dupont"
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2">Bio <span className="font-normal opacity-60">(optionnel)</span></label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Quelques mots pour vous présenter…"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && role === 'organizer' && (
            <motion.div key="step-org2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Votre organisation</h1>
              <p className="text-white/40 text-sm text-center mb-8">Ces informations seront visibles sur votre profil public.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2">Nom de l'organisation ou de l'événement *</label>
                  <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Ex: Marché des Créateurs de Lyon"
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2"><MapPin size={12} className="inline mr-1 opacity-60" />Ville principale (optionnel)</label>
                  <input type="text" value={orgCity} onChange={e => setOrgCity(e.target.value)} placeholder="Ex: Paris, Lyon, Bordeaux…"
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && role === 'organizer' && (
            <motion.div key="step-org3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '8px' }}>Vos événements</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>Dites-nous en plus sur les marchés que vous organisez.</p>

              {/* Types d'events */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Type d'événement <span style={{ fontWeight: 400, opacity: 0.6 }}>(plusieurs choix possibles)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(['Marché artisanal', 'Pop-up', 'Salon', 'Festival', 'Autre']).map(t => {
                    const active = orgEventTypes.includes(t)
                    return (
                      <button key={t} onClick={() => toggleOrgEventType(t)} style={{
                        padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                        border: active ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                        background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {active && <Check size={11} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />}
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Fréquence */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Combien d'éditions par an ?
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['1', '2-3', '4+']).map(v => (
                    <button key={v} onClick={() => setEventsPerYear(v)} style={{
                      flex: 1, padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                      border: eventsPerYear === v ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                      background: eventsPerYear === v ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      color: eventsPerYear === v ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              {/* Capacité */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Combien d'exposants en général ?
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {([{ label: '< 20', value: '< 20' }, { label: '20 – 50', value: '20-50' }, { label: '50 – 100', value: '50-100' }, { label: '100+', value: '100+' }]).map(({ label, value }) => (
                    <button key={value} onClick={() => setTypicalCapacity(value)} style={{
                      flex: 1, minWidth: '80px', padding: '10px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                      border: typicalCapacity === value ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
                      background: typicalCapacity === value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      color: typicalCapacity === value ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && role === 'organizer' && (
            <motion.div key="step-org4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: '8px' }}>Prochaine édition</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', marginBottom: '28px' }}>Avez-vous un événement en cours ou à venir ?</p>

              {/* Toggle Oui/Non */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {([{ label: 'Oui', value: true }, { label: 'Non, pas encore', value: false }]).map(({ label, value }) => (
                  <button key={label} onClick={() => setHasUpcomingEvent(value)} style={{
                    flex: 1, padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: 700,
                    border: hasUpcomingEvent === value ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)',
                    background: hasUpcomingEvent === value ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                    color: hasUpcomingEvent === value ? '#c7d2fe' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}>{label}</button>
                ))}
              </div>

              {/* Champs si Oui */}
              <AnimatePresence>
                {hasUpcomingEvent === true && (
                  <motion.div key="upcoming-fields" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Titre de l'événement *</label>
                        <input type="text" value={upcomingEventTitle} onChange={e => setUpcomingEventTitle(e.target.value)}
                          placeholder="Ex: Marché de la Bastille — Édition Printemps"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Date <span style={{ fontWeight: 400, opacity: 0.6 }}>(optionnel)</span></label>
                        <input type="date" value={upcomingEventDate} onChange={e => setUpcomingEventDate(e.target.value)}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: '13px', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <button onClick={handleCreateNow} disabled={upcomingEventTitle.trim().length < 2 || saving} style={{
                      width: '100%', padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                      color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: upcomingEventTitle.trim().length < 2 ? 'not-allowed' : 'pointer',
                      opacity: upcomingEventTitle.trim().length < 2 ? 0.45 : 1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}>
                      <Calendar size={16} />
                      Je le crée maintenant
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {step === 2 && role === 'creator' && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Vos disciplines</h1>
              <p className="text-white/40 text-sm text-center mb-8">Sélectionnez vos spécialités pour être mis en relation avec les bons événements.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {DISCIPLINES.map(d => {
                  const active = disciplines.includes(d)
                  return (
                    <button key={d} onClick={() => toggleDisc(d)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                        active ? 'bg-indigo-500 text-white' : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'
                      }`}>
                      {d}
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2">
                  <MapPin size={12} className="inline mr-1 opacity-60" />
                  Votre ville <span className="font-normal opacity-60">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ex: Paris, Lyon, Bordeaux…"
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-sm font-semibold text-white/30 hover:text-white/60 transition-colors">
              ← Retour
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={next}
            disabled={!canNext() || saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : step === totalSteps - 1 ? (
              <>Terminer <Sparkles size={15} /></>
            ) : (
              <>Suivant <ArrowRight size={15} /></>
            )}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center mt-5">
          <button onClick={() => router.push('/dashboard')} className="text-xs text-white/20 hover:text-white/40 transition-colors">
            Passer pour l'instant
          </button>
        </div>
      </div>
    </div>
  )
}
