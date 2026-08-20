'use client'

import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Calendar, CheckCircle, ChevronRight, Zap, Target, Bell, Shield, BadgeCheck, MapPin, Search } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { colors } from '@/lib/design-tokens'

// ── Dark theme constants (home page seule — pas de dark mode tokens dans le design system) ──
const D = {
  bg:        colors.dark.navyAlt,
  phoneBg:   colors.dark.navyDeep,
  indigo400: colors.violet.hover,
  violet400: colors.purple.light,
  emerald400:colors.green.light,
  amber400:  colors.yellow.primary,
  i10:  'rgba(99,102,241,0.10)',
  i15:  'rgba(99,102,241,0.15)',
  i20:  'rgba(99,102,241,0.20)',
  i25:  'rgba(99,102,241,0.25)',
  i30:  'rgba(99,102,241,0.30)',
  i40:  'rgba(99,102,241,0.40)',
  i50:  'rgba(99,102,241,0.50)',
  i80:  'rgba(99,102,241,0.80)',
  v8:   'rgba(139,92,246,0.08)',
  v15:  'rgba(139,92,246,0.15)',
  v30:  'rgba(139,92,246,0.30)',
  em8:  'rgba(16,185,129,0.08)',
  em15: 'rgba(16,185,129,0.15)',
  em30: 'rgba(16,185,129,0.30)',
  w80:  'rgba(255,255,255,0.80)',
  w60:  'rgba(255,255,255,0.60)',
  w55:  'rgba(255,255,255,0.55)',
  w50:  'rgba(255,255,255,0.50)',
  w40:  'rgba(255,255,255,0.40)',
  w35:  'rgba(255,255,255,0.35)',
  w30:  'rgba(255,255,255,0.30)',
  w25:  'rgba(255,255,255,0.25)',
  w22:  'rgba(255,255,255,0.22)',
  w20:  'rgba(255,255,255,0.20)',
  w12:  'rgba(255,255,255,0.12)',
  w8:   'rgba(255,255,255,0.08)',
  w7:   'rgba(255,255,255,0.07)',
  w6:   'rgba(255,255,255,0.06)',
  w5:   'rgba(255,255,255,0.05)',
  w4:   'rgba(255,255,255,0.04)',
  w035: 'rgba(255,255,255,0.035)',
}

// ── Grain overlay ──────────────────────────────────────────────────────
function Grain() {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0, pointerEvents: 'none', opacity: 0.035, mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '180px 180px',
      }}
    />
  )
}

// ── Counter ────────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!inView) return
    const ctrl = animate(0, to, { duration: 1.8, ease: 'easeOut', onUpdate: (v) => setDisplay(Math.round(v)) })
    return ctrl.stop
  }, [inView, to])
  return <span ref={ref}>{display.toLocaleString('fr-FR')}{suffix}</span>
}

// ── Word reveal ────────────────────────────────────────────────────────
function WordReveal({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <span>
      {children.split(' ').map((w, i) => (
        <span key={i} className="hero-word" style={{ animationDelay: `${delay + i * 0.075}s` }}>
          {w}
        </span>
      ))}
    </span>
  )
}

// ── Scroll fade ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} style={style}>
      {children}
    </motion.div>
  )
}

// ── Phone mockup ───────────────────────────────────────────────────────
const FAKE_EVENTS = [
  { title: 'Marché de Noël — Paris 12e', date: '14–16 déc.', stands: 48,  type: 'Marché', color: D.indigo400 },
  { title: 'Pop-up Créateurs Montmartre', date: '20 jan.',   stands: 24,  type: 'Pop-up',  color: D.violet400 },
  { title: 'Salon du Fait Main Lyon',     date: '3–5 fév.',  stands: 120, type: 'Salon',   color: D.emerald400 },
  { title: 'Foire Artisanale Bordeaux',   date: '15 mar.',   stands: 60,  type: 'Foire',   color: D.amber400 },
]

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="home-phone-wrap"
      style={{ position: 'relative' }}
    >
      {/* Glow */}
      <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '-40px', height: '128px', background: 'rgba(79,70,229,0.25)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Phone frame */}
      <div style={{ position: 'relative', width: '270px', margin: '0 auto', borderRadius: '48px', border: `1.5px solid ${D.w12}`, backgroundColor: D.phoneBg, boxShadow: '0 25px 50px rgba(0,0,0,0.70)', overflow: 'hidden', height: '580px' }}>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: D.w60 }}>9:41</span>
          <div style={{ width: '80px', height: '20px', borderRadius: '9999px', backgroundColor: `${colors.text.black}`, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2.5px', alignItems: 'flex-end', height: '12px' }}>
              {[3,5,7,9].map((h,i) => <div key={i} style={{ width: '2.5px', borderRadius: '2px', backgroundColor: D.w50, height: `${h}px` }} />)}
            </div>
            <div style={{ width: '16px', height: '10px', borderRadius: '2px', border: `1px solid ${D.w40}`, position: 'relative', marginLeft: '2px' }}>
              <div style={{ position: 'absolute', inset: '2px', right: '3px', backgroundColor: D.w50, borderRadius: '1px' }} />
              <div style={{ position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '6px', backgroundColor: D.w30, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* App header */}
        <div style={{ padding: '12px 20px 16px' }}>
          <p style={{ fontSize: '11px', color: D.w35, fontWeight: 500, marginBottom: '2px' }}>Bonjour, Marie</p>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.bg.primary, lineHeight: 1.2 }}>Événements près de toi</h3>
        </div>

        {/* Search bar */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '16px', backgroundColor: D.w8, border: `1px solid ${D.w8}` }}>
            <Search size={14} style={{ color: D.w30, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: D.w25 }}>Rechercher…</span>
          </div>
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: D.w40, textTransform: 'uppercase', letterSpacing: '0.1em' }}>À proximité</span>
          <span style={{ fontSize: '11px', color: D.indigo400, fontWeight: 600 }}>Voir tout</span>
        </div>

        {/* Event cards */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAKE_EVENTS.slice(0, 3).map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.12, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '16px', backgroundColor: D.w5, border: `1px solid ${D.w7}` }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: D.i15, border: `1px solid ${D.i20}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={15} style={{ color: ev.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.bg.primary, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: ev.color }}>{ev.type}</span>
                  <span style={{ color: D.w20, fontSize: '10px' }}>·</span>
                  <span style={{ fontSize: '10px', color: D.w40 }}>{ev.date}</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, padding: '6px 10px', borderRadius: '12px', backgroundColor: D.i80, fontSize: '10px', fontWeight: 700, color: colors.bg.primary }}>
                Voir
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tab bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '14px 24px 24px', borderTop: `1px solid ${D.w6}`, backgroundColor: D.phoneBg }}>
          {[
            { icon: <Search size={18} />, active: false },
            { icon: <MapPin size={18} />, active: true },
            { icon: <Bell size={18} />, active: false },
            { icon: <Users size={18} />, active: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: item.active ? D.indigo400 : D.w20 }}>
              {item.icon}
              {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: D.indigo400 }} />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ── Testimonials marquee ───────────────────────────────────────────────
const TESTIMONIALS_ROW1 = [
  { name: 'Marie L.',    role: 'Céramiste',    text: "Nexart m'a permis de remplir mon calendrier pour 6 mois. Incroyable." },
  { name: 'Théo R.',    role: 'Illustrateur',  text: "J'ai candidaté à 12 événements en une soirée. L'interface est parfaite." },
  { name: 'Claire M.',  role: 'Bijoutière',    text: "Enfin un outil pensé par des artisans, pour des artisans." },
  { name: 'Antoine B.', role: 'Photographe',   text: "J'ai trouvé des événements que je n'aurais jamais découverts autrement." },
  { name: 'Sophie D.',  role: 'Maroquinière',  text: "Les organisateurs via Nexart sont sérieux. Zéro mauvaise surprise." },
  { name: 'Lucas P.',   role: 'Sculpteur',     text: "Candidature envoyée, réponse en 24h. Exactement ce qu'il me fallait." },
]
const TESTIMONIALS_ROW2 = [
  { name: 'Emma V.',    role: 'Potière',    text: "Mon stand était complet pour la première fois. Merci Nexart." },
  { name: 'Jules H.',   role: 'Peintre',    text: "Interface impeccable, candidature en 2 minutes chrono." },
  { name: 'Camille T.', role: 'Textilière', text: "Nexart a changé ma façon de développer mon activité artisanale." },
  { name: 'Hugo M.',    role: 'Graveur',    text: "La transparence sur les stands disponibles est vraiment appréciable." },
  { name: 'Alice R.',   role: 'Broderie',   text: "Je recommande à tous les artisans qui cherchent à se développer." },
  { name: 'Marc D.',    role: 'Luthier',    text: "Le suivi des candidatures est clair et bien fait. Top." },
]

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  return (
    <div style={{ flexShrink: 0, width: '280px', padding: '20px', borderRadius: '16px', border: `1px solid ${D.w6}`, backgroundColor: D.w035, margin: '0 8px' }}>
      <p style={{ fontSize: '14px', color: D.w55, lineHeight: 1.6, marginBottom: '16px' }}>&ldquo;{text}&rdquo;</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.primary})', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.bg.primary, fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: colors.bg.primary, lineHeight: 1.2 }}>{name}</p>
          <p style={{ fontSize: '12px', color: D.w35 }}>{role}</p>
        </div>
      </div>
    </div>
  )
}

function TestimonialsMarquee() {
  return (
    <section aria-label="Témoignages illustratifs" className="home-section-md" style={{ overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div aria-hidden="true" style={{ display: 'flex', marginBottom: '16px', animation: 'ticker 45s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW1, ...TESTIMONIALS_ROW1].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
      <div aria-hidden="true" style={{ display: 'flex', animation: 'tickerReverse 40s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW2, ...TESTIMONIALS_ROW2].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
      <ul className="sr-only">
        {TESTIMONIALS_ROW1.map(t => (
          <li key={t.name}><q>{t.text}</q> — {t.name}, {t.role}</li>
        ))}
      </ul>
    </section>
  )
}

// ── Data ───────────────────────────────────────────────────────────────
const DISCIPLINES = [
  'Céramique', 'Illustration', 'Bijouterie', 'Maroquinerie', 'Textile',
  'Photographie', 'Sculpture', 'Peinture', 'Verrerie', 'Broderie',
  'Cosmétique', 'Papeterie', 'Lutherie', 'Gravure', 'Forge artisanale',
]

// ── 3 Faces section ────────────────────────────────────────────────────
const FACES = [
  {
    key: 'createurs',
    label: 'Créateurs',
    accentColor: D.indigo400,
    borderColor: D.i30,
    bgColor: D.i10,
    tagline: 'Exposez sans galère.',
    desc: 'Un profil, toutes les opportunités. Candidatez en 2 minutes, suivez vos réponses en temps réel.',
    href: '/register',
    cta: 'Créer mon profil',
    features: [
      { Icon: Zap,        label: 'Candidature en 2 min', desc: 'Aucun email, aucun formulaire à rallonge.' },
      { Icon: Target,     label: 'Matching intelligent',  desc: 'Les événements qui vous correspondent remontent en priorité.' },
      { Icon: Bell,       label: 'Suivi en temps réel',   desc: 'Notifications et timeline de statut instantanés.' },
      { Icon: BadgeCheck, label: 'Profil vérifiable',     desc: 'SIRET, portfolio, avis — tout en un seul endroit.' },
    ],
  },
  {
    key: 'organisateurs',
    label: 'Organisateurs',
    accentColor: D.violet400,
    borderColor: D.v30,
    bgColor: D.v8,
    tagline: 'Remplissez vos stands.',
    desc: 'Publiez votre événement, recevez des candidatures qualifiées et gérez tout depuis votre tableau de bord.',
    href: '/register',
    cta: 'Publier un événement',
    features: [
      { Icon: Calendar, label: 'Publication en 5 min',  desc: 'Dates, stands, critères — votre événement est en ligne immédiatement.' },
      { Icon: Users,    label: 'Candidatures triées',    desc: 'Filtrez par discipline, ville, profil vérifié.' },
      { Icon: Shield,   label: 'Événement validé',       desc: "Notre équipe vérifie chaque publication. Zéro arnaque." },
      { Icon: Zap,      label: 'Gestion centralisée',    desc: 'Acceptez, refusez, communiquez — tout depuis un seul dashboard.' },
    ],
  },
  {
    key: 'visiteurs',
    label: 'Visiteurs',
    accentColor: D.emerald400,
    borderColor: D.em30,
    bgColor: D.em8,
    tagline: 'Découvrez. Réservez. Soutenez.',
    desc: 'Trouvez les marchés et événements artisanaux près de chez vous, réservez votre place et explorez les créateurs.',
    href: '/events',
    cta: 'Explorer les événements',
    features: [
      { Icon: MapPin,      label: 'Événements près de toi', desc: 'Géolocalisation et filtres par type, date, distance.' },
      { Icon: Users,       label: 'Portfolios créateurs',   desc: 'Parcourez les artisans inscrits avant même le jour J.' },
      { Icon: CheckCircle, label: 'Réservation de place',   desc: 'Réservez votre entrée en quelques secondes.' },
      { Icon: Bell,        label: 'Alertes personnalisées', desc: "Notifié dès qu'un événement correspond à vos intérêts." },
    ],
  },
]

function FacesSection() {
  return (
    <section className="home-faces-pad" style={{ maxWidth: '1152px', margin: '0 auto' }}>
      <FadeUp style={{ marginBottom: '64px' }}>
        <p style={{ color: D.indigo400, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Créateurs · Organisateurs · Visiteurs</p>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 0.95, color: colors.bg.primary, maxWidth: '600px' }}>
          Pour qui est{' '}
          <span style={{ color: D.w30 }}>Nexart ?</span>
        </h2>
      </FadeUp>

      <div className="home-faces-grid">
        {FACES.map((face, i) => (
          <motion.div key={face.key}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', padding: '28px', borderRadius: '24px', border: `1px solid ${face.borderColor}`, backgroundColor: face.bgColor, transition: 'filter 0.3s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1)' }}
          >
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', color: face.accentColor }}>{face.label}</p>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: colors.bg.primary, lineHeight: 1.2, marginBottom: '12px' }}>{face.tagline}</h3>
            <p style={{ color: D.w40, fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>{face.desc}</p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, listStyle: 'none', padding: 0, margin: 0 }}>
              {face.features.map(({ Icon, label: fl, desc: fd }) => (
                <li key={fl} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: face.bgColor, border: `1px solid ${face.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Icon size={13} style={{ color: face.accentColor }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: colors.bg.primary, lineHeight: 1.2 }}>{fl}</p>
                    <p style={{ fontSize: '11px', color: D.w30, lineHeight: 1.5 }}>{fd}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href={face.href}
              style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: colors.bg.primary, border: `1px solid ${face.borderColor}`, textDecoration: 'none', transition: 'opacity 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              {face.cta} <ArrowRight size={13} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Email Capture ──────────────────────────────────────────────────────
function EmailCaptureSection() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('error')
      setSuccess(true)
      setEmail('')
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FadeUp>
      <div style={{ background: D.i10, borderRadius: '12px', padding: '24px', border: `1px solid ${D.i15}`, maxWidth: '480px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: D.w60, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Application mobile
        </p>
        <p style={{ fontSize: '15px', color: colors.bg.primary, marginBottom: '16px', lineHeight: 1.5 }}>
          Soyez prévenu dès que l&apos;app est disponible sur iOS et Android.
        </p>
        {success ? (
          <p style={{ color: colors.feedback.success.solid, fontWeight: 600, fontSize: '14px' }}>
            Super ! On vous préviendra dès le lancement.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${D.w12}`, background: D.w6, color: colors.bg.primary, fontSize: '14px', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: '8px', background: colors.violet.primary, color: colors.bg.primary, fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }}
            >
              {loading ? '...' : 'Être notifié'}
            </button>
          </form>
        )}
        {error && (
          <p style={{ color: colors.feedback.danger.solid, fontSize: '13px', marginTop: '8px' }}>
            Une erreur est survenue.
          </p>
        )}
      </div>
    </FadeUp>
  )
}

// ── Page ───────────────────────────────────────────────────────────────
// Injectée via dangerouslySetInnerHTML (pas en enfant JSX) : <style> est un
// élément "raw text" en HTML — un enfant texte normal serait échappé
// différemment par le SSR (entités &quot;/&#x27;) et par le client au montage,
// ce qui casse l'hydratation dès que le CSS contient des guillemets/apostrophes.
const HOME_STYLE_CSS = `
        .home-faces-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 768px) { .home-faces-grid { grid-template-columns: repeat(3, 1fr); } }
        .home-steps-grid { display: grid; grid-template-columns: 1fr; gap: 32px; position: relative; }
        @media (min-width: 768px) { .home-steps-grid { grid-template-columns: repeat(3, 1fr); } }
        .home-steps-connector { display: none; }
        @media (min-width: 768px) { .home-steps-connector { display: block; } }
        .home-app-layout { position: relative; display: flex; flex-direction: column; align-items: center; gap: 64px; }
        @media (min-width: 1024px) { .home-app-layout { flex-direction: row; } }
        .home-app-text { text-align: center; }
        @media (min-width: 1024px) { .home-app-text { text-align: left; } }
        .home-store-buttons { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        @media (min-width: 640px) { .home-store-buttons { flex-direction: row; } }
        @media (min-width: 1024px) { .home-store-buttons { justify-content: flex-start; } }
        .home-hero-buttons { display: flex; flex-direction: column; gap: 12px; justify-content: center; margin-bottom: 24px; }
        @media (min-width: 640px) { .home-hero-buttons { flex-direction: row; } }
        .home-cta-buttons { display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        @media (min-width: 640px) { .home-cta-buttons { flex-direction: row; } }

        /* Force le thème sombre sur la home, quel que soit le thème choisi */
        [data-theme=light] .home-page { background-color: #08081a !important; color: #FFFFFF !important; }
        [data-theme=light] .home-page section { background-color: transparent !important; }
        [data-theme=light] .home-page [style*="color: rgba(255, 255, 255"] { color: unset !important; }
        [data-theme=light] .home-page [style*="background-color: rgb("] { background-color: unset !important; }

        /* ── Responsive section paddings ── */
        .home-section-xl  { padding-top: 128px; padding-bottom: 128px; }
        .home-section-lg  { padding-top: 112px; padding-bottom: 112px; }
        .home-section-md  { padding-top: 80px;  padding-bottom: 80px;  }
        .home-faces-pad   { padding: 128px 16px; }
        .home-hero-content-pad { padding: 80px 16px; }
        @media (max-width: 767px) {
          .home-section-xl  { padding-top: 56px;  padding-bottom: 56px;  }
          .home-section-lg  { padding-top: 48px;  padding-bottom: 48px;  }
          .home-section-md  { padding-top: 40px;  padding-bottom: 40px;  }
          .home-faces-pad   { padding: 56px 16px; }
          .home-hero-content-pad { padding: 48px 16px; }
          .home-phone-wrap  { transform: scale(0.88); transform-origin: top center; }
        }
        @media (max-width: 374px) {
          .home-section-xl  { padding-top: 40px;  padding-bottom: 40px;  }
          .home-phone-wrap  { transform: scale(0.75); transform-origin: top center; }
        }
      `

export default function HomeClient() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div className="home-page" style={{ overflowX: 'hidden', marginTop: 'calc(-1 * var(--nav-height))', backgroundColor: D.bg, color: '#FFFFFF' }}>
      <style dangerouslySetInnerHTML={{ __html: HOME_STYLE_CSS }} />

      <Grain />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: D.bg }}>

        <div style={{ height: '58px', flexShrink: 0 }} />

        {/* Grid pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Glows */}
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.3, 0.18] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-160px', left: '-192px', width: '800px', height: '800px', borderRadius: '50%', backgroundColor: 'rgba(79,70,229,0.20)', filter: 'blur(130px)', pointerEvents: 'none' }} />
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ position: 'absolute', top: '33%', right: '-128px', width: '500px', height: '500px', borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        {/* Hero content */}
        <motion.div className="home-hero-content-pad" style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 10, flex: 1, maxWidth: '896px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', border: `1px solid ${D.i30}`, backgroundColor: D.i10, color: colors.purple.bgLight, fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}
            >
              <Sparkles size={11} /> La plateforme des artisans
            </motion.div>

            <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.04em', marginBottom: '28px' }}>
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '4px' }}>
                <WordReveal delay={0.05}>Exposez vos</WordReveal>
              </span>
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '4px' }}>
                <motion.span initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'inline-block', background: `linear-gradient(90deg, ${colors.violet.hover}, ${colors.purple.pale}, ${colors.violet.hover})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                  créations
                </motion.span>
              </span>
              <span style={{ display: 'block', color: D.w35, fontSize: '0.55em', fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', paddingBottom: '4px' }}>
                <WordReveal delay={0.3}>dans les meilleurs événements</WordReveal>
              </span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ color: D.w80, fontSize: '16px', lineHeight: 1.6, marginBottom: '36px' }}
            >
              Nexart connecte créateurs et organisateurs d&apos;événements artisanaux —{' '}
              <span style={{ color: colors.bg.primary }}>marchés, pop-ups, salons, festivals</span>.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.62 }}>
              <div className="home-hero-buttons">
                <Link href="/register"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 28px', borderRadius: '16px', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontWeight: 700, fontSize: '14px', textDecoration: 'none', boxShadow: '0 20px 25px rgba(99,102,241,0.30)', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.hover; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.primary; (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                >
                  S&apos;inscrire gratuitement <ArrowRight size={15} />
                </Link>
                <Link href="/events"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 28px', borderRadius: '16px', border: `1px solid ${D.w8}`, color: D.w55, fontWeight: 600, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = colors.bg.primary; (e.currentTarget as HTMLElement).style.backgroundColor = D.w5 }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = D.w55; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  Explorer les événements
                </Link>
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              style={{ fontSize: '12px', color: D.w22, fontWeight: 500 }}
            >
              Gratuit pour les créateurs · Pas de carte bancaire requise
            </motion.p>
          </div>
        </motion.div>

        {/* Ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ position: 'relative', zIndex: 10, width: '100%', paddingBottom: '40px', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px', animation: 'ticker 40s linear infinite', width: 'max-content' }}>
            {[...DISCIPLINES, ...DISCIPLINES, ...DISCIPLINES].map((d, i) => (
              <span key={i} style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '9999px', border: `1px solid ${D.w8}`, backgroundColor: D.w4, color: D.w30, fontSize: '12px', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: D.i50, flexShrink: 0 }} />
                {d}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 3 FACES ════════════════════════════════════════════════════ */}
      <FacesSection />

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════ */}
      <TestimonialsMarquee />

      {/* ══ STEPS ══════════════════════════════════════════════════════ */}
      <section className="home-section-xl" style={{ borderTop: `1px solid ${D.w6}` }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px' }}>
          <FadeUp style={{ marginBottom: '80px', textAlign: 'center' }}>
            <p style={{ color: D.indigo400, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>En 3 étapes</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: colors.bg.primary }}>Simple comme bonjour</h2>
          </FadeUp>
          <div className="home-steps-grid">
            <div className="home-steps-connector" style={{ position: 'absolute', top: '38px', left: 'calc(16.67% + 28px)', right: 'calc(16.67% + 28px)', height: '1px', background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.25), transparent)' }} />
            {[
              { n: '01', title: 'Créez votre profil',      desc: 'Photos, disciplines, tarifs — en moins de 10 minutes.' },
              { n: '02', title: 'Explorez les événements', desc: 'Filtrez par type, date, ville ou nombre de stands.' },
              { n: '03', title: 'Postulez & exposez',       desc: 'Recevez une réponse et préparez votre stand.' },
            ].map(({ n, title, desc }, i) => (
              <motion.div key={n}
                initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: 'center' }}
              >
                <motion.div whileInView={{ scale: [0.75, 1.06, 1] }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.14 + 0.15 }}
                  style={{ width: '80px', height: '80px', margin: '0 auto 28px', borderRadius: '16px', border: `1px solid ${D.i20}`, backgroundColor: D.i10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 900, color: D.indigo400, fontFamily: 'monospace' }}>{n}</span>
                </motion.div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: colors.bg.primary, marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: D.w35, fontSize: '14px', lineHeight: 1.6, maxWidth: '210px', margin: '0 auto' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ APP DOWNLOAD ═══════════════════════════════════════════════ */}
      <section className="home-section-lg" style={{ borderTop: `1px solid ${D.w6}`, overflow: 'hidden' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px' }}>
          <div className="home-app-layout">

            {/* Glow bg */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '400px', backgroundColor: 'rgba(79,70,229,0.10)', filter: 'blur(120px)', borderRadius: '50%' }} />
            </div>

            {/* Left — text */}
            <FadeUp style={{ position: 'relative', zIndex: 10, flex: 1 }}>
              <div className="home-app-text">
                <p style={{ color: D.indigo400, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Bientôt disponible</p>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: colors.bg.primary, lineHeight: 1.05, marginBottom: '20px' }}>
                  Nexart dans<br />votre poche
                </h2>
                <p style={{ color: D.w35, fontSize: '16px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '400px' }}>
                  Candidatez, suivez vos marchés et échangez avec les organisateurs — où que vous soyez.
                </p>

                <div style={{ marginBottom: '32px' }}>
                  <EmailCaptureSection />
                </div>

                <div className="home-store-buttons">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px', borderRadius: '16px', border: `1px solid ${D.w12}`, backgroundColor: D.w4, textAlign: 'left', userSelect: 'none' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" opacity="0.5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div>
                      <p style={{ fontSize: '10px', color: D.w30, fontWeight: 500, lineHeight: 1, marginBottom: '2px' }}>Bientôt sur</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: D.w50, lineHeight: 1 }}>App Store</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px', borderRadius: '16px', border: `1px solid ${D.w12}`, backgroundColor: D.w4, textAlign: 'left', userSelect: 'none' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" opacity="0.5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.18 23.76c.3.17.65.19.97.08l12.49-7.17-2.64-2.64-10.82 9.73zm-1.14-20.3C1.73 3.83 1.5 4.28 1.5 4.85v14.3c0 .57.23 1.02.54 1.39l.07.07 8.01-8.01v-.19L2.11 3.39l-.07.07zM20.37 10.5l-2.61-1.5-2.94 2.94 2.94 2.94 2.64-1.52c.75-.43.75-1.43-.03-1.86zM4.14.24L16.63 7.41l-2.64 2.64L3.17.32C3.49.21 3.84.23 4.14.24z"/>
                    </svg>
                    <div>
                      <p style={{ fontSize: '10px', color: D.w30, fontWeight: 500, lineHeight: 1, marginBottom: '2px' }}>Bientôt sur</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: D.w50, lineHeight: 1 }}>Google Play</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Right — phone */}
            <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════ */}
      <section className="home-section-xl" style={{ borderTop: `1px solid ${D.w6}` }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <FadeUp>
            <p style={{ color: D.indigo400, fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '28px' }}>Rejoignez la communauté</p>
            <h2 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: colors.bg.primary, lineHeight: 0.9, marginBottom: '28px' }}>
              Prêt à exposer{' '}
              <span style={{ background: `linear-gradient(90deg, ${colors.violet.hover}, ${colors.purple.pale}, ${colors.violet.hover})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                vos créations ?
              </span>
            </h2>
            <div className="home-cta-buttons">
              <Link href="/register"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px 36px', borderRadius: '16px', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontWeight: 700, textDecoration: 'none', boxShadow: '0 25px 50px rgba(99,102,241,0.30)', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.hover; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.primary; (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
              >
                S&apos;inscrire gratuitement <ArrowRight size={16} />
              </Link>
              <Link href="/events"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px 36px', borderRadius: '16px', border: `1px solid ${D.w8}`, color: D.w50, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = colors.bg.primary; (e.currentTarget as HTMLElement).style.backgroundColor = D.w5 }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = D.w50; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                Explorer <ChevronRight size={15} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  )
}
