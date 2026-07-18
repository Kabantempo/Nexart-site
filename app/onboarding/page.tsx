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

  const [done, setDone] = useState(false)
  const totalSteps = role === 'creator' ? 3 : role === 'organizer' ? 4 : 2

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
      if (existing) {
        await supabase.from('organizer_profiles').update({ organization_name: orgName.trim() } as any).eq('user_id', user.id)
      } else {
        await supabase.from('organizer_profiles').insert({ user_id: user.id, organization_name: orgName.trim() } as any)
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
    return true
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
    return (
      <div className="min-h-screen bg-[#06060f] flex flex-col items-center justify-center px-4 py-16">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-lg text-center"
        >
          {/* Check animé */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-indigo-500/15 border-2 border-indigo-500/40 flex items-center justify-center mx-auto mb-6"
          >
            <Check size={36} className="text-indigo-400" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h1 className="text-3xl font-black text-white mb-3">C'est parti ! 🎉</h1>
            <p className="text-white/40 text-sm mb-10 leading-relaxed">
              Votre profil Nexart est créé. Voici vos prochaines étapes pour en profiter au maximum.
            </p>
          </motion.div>

          <div className="flex flex-col gap-3 mb-8">
            {NEXT_STEPS.map((s, i) => (
              <motion.a
                key={s.href}
                href={s.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-indigo-500/30 transition-all duration-150 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{s.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-indigo-400 transition-colors shrink-0" />
              </motion.a>
            ))}
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            onClick={() => router.push('/dashboard')}
            className="text-xs text-white/20 hover:text-white/40 transition-colors"
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
              <h1 className="text-2xl font-bold text-white mb-2 text-center">Types d'événements</h1>
              <p className="text-white/40 text-sm text-center mb-8">Quels types de marchés organisez-vous ?</p>
              <div className="flex flex-wrap gap-2">
                {(['Pop-up', 'Salon', 'Foire', 'Saisonnier', 'Permanent', 'Marché de Noël', 'Marché fermier', 'Brocante', 'Autre'] as const).map(t => {
                  const active = orgEventTypes.includes(t)
                  return (
                    <button key={t} onClick={() => toggleOrgEventType(t)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                        active ? 'bg-indigo-500 text-white' : 'bg-white/8 text-white/50 hover:bg-white/12 hover:text-white/70'
                      }`}>
                      {t}
                    </button>
                  )
                })}
              </div>
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
