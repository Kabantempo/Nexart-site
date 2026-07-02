'use client'

import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Calendar, CheckCircle, ChevronRight, Zap, Target, Bell, Shield, BadgeCheck, MapPin, Search } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

// ── Grain overlay ──────────────────────────────────────────────────────
function Grain() {
  return (
    <div
      className="fixed inset-0 z-[9998] pointer-events-none opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
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
function WordReveal({ children, delay = 0, className = '' }: { children: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {children.split(' ').map((w, i) => (
        <motion.span key={i} className="inline-block mr-[0.22em] last:mr-0"
          initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: delay + i * 0.075, ease: [0.22, 1, 0.36, 1] }}>
          {w}
        </motion.span>
      ))}
    </span>
  )
}

// ── Scroll fade ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

// ── Phone mockup ───────────────────────────────────────────────────────
const FAKE_EVENTS = [
  { title: 'Marché de Noël — Paris 12e', date: '14–16 déc.', stands: 48, type: 'Marché', color: 'text-indigo-400' },
  { title: 'Pop-up Créateurs Montmartre', date: '20 jan.',   stands: 24, type: 'Pop-up',  color: 'text-violet-400' },
  { title: 'Salon du Fait Main Lyon',     date: '3–5 fév.',  stands: 120, type: 'Salon',  color: 'text-emerald-400' },
  { title: 'Foire Artisanale Bordeaux',   date: '15 mar.',   stands: 60,  type: 'Foire',  color: 'text-amber-400' },
]

function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Glow */}
      <div className="absolute inset-x-4 -bottom-10 h-32 bg-indigo-600/25 blur-[50px] rounded-full pointer-events-none" />

      {/* Phone frame */}
      <div className="relative w-[270px] mx-auto rounded-[3rem] border-[1.5px] border-white/12 bg-[#0c0c1a] shadow-2xl shadow-black/70 overflow-hidden" style={{ height: '580px' }}>

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-1">
          <span className="text-[11px] font-semibold text-white/60">9:41</span>
          <div className="w-20 h-5 rounded-full bg-black mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-3">
              {[3,5,7,9].map((h,i) => <div key={i} className="w-[2.5px] rounded-sm bg-white/50" style={{height:`${h}px`}}/>)}
            </div>
            <div className="w-4 h-2.5 rounded-sm border border-white/40 relative ml-0.5">
              <div className="absolute inset-[2px] right-[3px] bg-white/50 rounded-[1px]" />
              <div className="absolute -right-[2px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-white/30 rounded-r-sm" />
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="px-5 pt-3 pb-4">
          <p className="text-[11px] text-white/35 font-medium mb-0.5">Bonjour, Marie</p>
          <h3 className="text-[18px] font-bold text-white leading-tight">Événements près de toi</h3>
        </div>

        {/* Search bar */}
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/7 border border-white/8">
            <Search size={14} className="text-white/30 shrink-0" />
            <span className="text-[12px] text-white/25">Rechercher…</span>
          </div>
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between px-5 mb-3">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">À proximité</span>
          <span className="text-[11px] text-indigo-400 font-semibold">Voir tout</span>
        </div>

        {/* Event cards — only 3 */}
        <div className="px-5 flex flex-col gap-3">
          {FAKE_EVENTS.slice(0, 3).map((ev, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.12, ease: 'easeOut' }}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.05] border border-white/7"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Calendar size={15} className={ev.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white leading-tight truncate">{ev.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold ${ev.color}`}>{ev.type}</span>
                  <span className="text-white/20 text-[10px]">·</span>
                  <span className="text-[10px] text-white/40">{ev.date}</span>
                </div>
              </div>
              <div className="shrink-0 px-2.5 py-1.5 rounded-xl bg-indigo-600/80 text-[10px] font-bold text-white">
                Voir
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tab bar */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-around px-6 pb-6 pt-3.5 border-t border-white/6 bg-[#0c0c1a]">
          {[
            { icon: <Search size={18} />, active: false },
            { icon: <MapPin size={18} />, active: true },
            { icon: <Bell size={18} />, active: false },
            { icon: <Users size={18} />, active: false },
          ].map((item, i) => (
            <div key={i} className={`flex flex-col items-center gap-1 ${item.active ? 'text-indigo-400' : 'text-white/20'}`}>
              {item.icon}
              {item.active && <div className="w-1 h-1 rounded-full bg-indigo-400" />}
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
  { name: 'Emma V.',   role: 'Potière',     text: "Mon stand était complet pour la première fois. Merci Nexart." },
  { name: 'Jules H.',  role: 'Peintre',     text: "Interface impeccable, candidature en 2 minutes chrono." },
  { name: 'Camille T.',role: 'Textilière',  text: "Nexart a changé ma façon de développer mon activité artisanale." },
  { name: 'Hugo M.',   role: 'Graveur',     text: "La transparence sur les stands disponibles est vraiment appréciable." },
  { name: 'Alice R.',  role: 'Broderie',    text: "Je recommande à tous les artisans qui cherchent à se développer." },
  { name: 'Marc D.',   role: 'Luthier',     text: "Le suivi des candidatures est clair et bien fait. Top." },
]

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  return (
    <div className="shrink-0 w-[280px] p-5 rounded-2xl border border-white/6 bg-white/[0.035] mx-2">
      <p className="text-sm text-white/55 leading-relaxed mb-4">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{name}</p>
          <p className="text-xs text-white/35">{role}</p>
        </div>
      </div>
    </div>
  )
}

function TestimonialsMarquee() {
  return (
    <section className="py-20 overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      {/* Row 1 — left */}
      <div className="flex mb-4" style={{ animation: 'ticker 45s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW1, ...TESTIMONIALS_ROW1].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
      {/* Row 2 — right */}
      <div className="flex" style={{ animation: 'tickerReverse 40s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW2, ...TESTIMONIALS_ROW2].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </section>
  )
}

// ── Data ───────────────────────────────────────────────────────────────
const DISCIPLINES = [
  'Céramique', 'Illustration', 'Bijouterie', 'Maroquinerie', 'Textile',
  'Photographie', 'Sculpture', 'Peinture', 'Verrerie', 'Broderie',
  'Cosmétique', 'Papeterie', 'Lutherie', 'Gravure', 'Forge artisanale',
]

const STATS = [
  { value: 2400, suffix: '+',  label: 'Créateurs inscrits' },
  { value: 380,  suffix: '+',  label: 'Événements référencés' },
  { value: 94,   suffix: ' %', label: 'Taux de satisfaction' },
]

// ── Page ───────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div className="bg-[#06060f] text-white overflow-x-hidden">
      <Grain />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col overflow-hidden">

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* Glows */}
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.3, 0.18] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-48 w-[800px] h-[800px] rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none" />

        {/* Split layout */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 py-20 lg:py-0"
        >
          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-8"
            >
              <Sparkles size={11} /> La plateforme des artisans
            </motion.div>

            <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-black leading-[0.9] tracking-[-0.04em] mb-7">
              <span className="block overflow-hidden pb-1">
                <WordReveal delay={0.05}>Exposez vos</WordReveal>
              </span>
              <span className="block overflow-hidden pb-1">
                <motion.span initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent"
                  style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                  créations
                </motion.span>
              </span>
              <span className="block text-white/35 text-[0.55em] font-bold tracking-[-0.01em] overflow-hidden pb-1">
                <WordReveal delay={0.3}>dans les meilleurs événements</WordReveal>
              </span>
            </h1>

            <motion.p initial={{ opacity: 0, filter: 'blur(8px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-white/45 text-base leading-relaxed mb-9"
            >
              Nexart connecte créateurs et organisateurs d'événements artisanaux —{' '}
              <span className="text-white/65">marchés, pop-ups, salons, festivals</span>.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.62 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6"
            >
              <Link href="/register" className="group flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.97]">
                Commencer gratuitement <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/events" className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-white/10 text-white/55 hover:text-white hover:bg-white/6 hover:border-white/18 font-semibold text-sm transition-all duration-200">
                Explorer les événements
              </Link>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              className="text-xs text-white/22 font-medium"
            >
              Gratuit pour les créateurs · Pas de carte bancaire requise
            </motion.p>
          </div>

          {/* Right — phone */}
          <div className="flex-1 flex items-center justify-center lg:justify-end pt-8 lg:pt-0">
            <PhoneMockup />
          </div>
        </motion.div>

        {/* Ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="relative z-10 w-full pb-10 overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
        >
          <div className="flex flex-nowrap gap-3" style={{ animation: 'ticker 40s linear infinite', width: 'max-content' }}>
            {[...DISCIPLINES, ...DISCIPLINES, ...DISCIPLINES].map((d, i) => (
              <span key={i} className="inline-flex shrink-0 items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/8 bg-white/[0.04] text-white/30 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 shrink-0" />
                {d}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ STATS ══════════════════════════════════════════════════════ */}
      <section className="border-y border-white/6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 grid grid-cols-3 divide-x divide-white/6">
          {STATS.map(({ value, suffix, label }, i) => (
            <FadeUp key={i} delay={i * 0.12} className="text-center px-8">
              <p className="text-[clamp(2.4rem,5vw,4rem)] font-black tracking-tight text-white leading-none mb-3 tabular-nums">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-white/35 text-sm font-medium">{label}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══ BENTO FEATURES ═════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-32">
        <FadeUp className="mb-16">
          <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-5">Pourquoi Nexart</p>
          <h2 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-black tracking-tight leading-[0.95] text-white max-w-xl">
            Tout ce qu'il vous faut.{' '}
            <span className="text-white/30">Rien de superflu.</span>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { span: 'md:col-span-2', bg: 'bg-white/[0.03] hover:border-indigo-500/30 hover:bg-white/[0.06]', glow: 'from-indigo-600/8', Icon: Zap,    iconBg: 'bg-indigo-500/12 border-indigo-500/20', iconColor: 'text-indigo-400', title: 'Candidature en 2 min',    desc: "Postulez à n'importe quel événement depuis votre profil — aucun email, aucun formulaire à rallonge.", extra: null },
            { span: '',              bg: 'bg-gradient-to-br from-indigo-900/30 to-transparent hover:border-indigo-500/30', glow: null, Icon: Target, iconBg: 'bg-indigo-500/12 border-indigo-500/20', iconColor: 'text-indigo-400', title: 'Matching intelligent',   desc: 'Les organisateurs voient en priorité les créateurs qui correspondent à leur événement.', extra: null },
            { span: '',              bg: 'bg-white/[0.03] hover:border-violet-500/25 hover:bg-white/[0.06]',              glow: 'from-violet-600/6',  Icon: Bell,   iconBg: 'bg-violet-500/12 border-violet-500/20', iconColor: 'text-violet-400',  title: 'Suivi en temps réel',    desc: 'Timeline de statut et notifications instantanées.', extra: null },
            { span: 'md:col-span-2', bg: 'bg-gradient-to-br from-emerald-900/20 to-transparent hover:border-emerald-500/25', glow: null, Icon: Shield, iconBg: 'bg-emerald-500/10 border-emerald-500/18', iconColor: 'text-emerald-400', title: 'Organisateurs vérifiés', desc: "Chaque événement est validé par notre équipe. Zéro arnaque, zéro surprise.", extra: (
              <div className="shrink-0 hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-xs font-bold whitespace-nowrap">
                <BadgeCheck size={13} /> Événement vérifié
              </div>
            )},
          ].map(({ span, bg, glow, Icon, iconBg, iconColor, title, desc, extra }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 48, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`${span} group relative p-8 rounded-3xl border border-white/6 ${bg} transition-all duration-300 overflow-hidden cursor-default min-h-[200px] flex flex-col ${extra ? 'justify-between' : 'justify-between'}`}
            >
              {glow && <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${glow} via-transparent to-transparent pointer-events-none`} />}
              <div className={`w-12 h-12 rounded-2xl ${iconBg} border flex items-center justify-center mb-6 shrink-0`}>
                <Icon size={22} className={iconColor} />
              </div>
              <div className={`flex items-end ${extra ? 'justify-between gap-4' : ''}`}>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed max-w-sm">{desc}</p>
                </div>
                {extra}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════ */}
      <section className="border-t border-white/6 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-4">
          <FadeUp className="text-center mb-12">
            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">Ils nous font confiance</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,3rem)] font-black tracking-tight text-white">Ce qu'ils en disent</h2>
          </FadeUp>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* ══ STEPS ══════════════════════════════════════════════════════ */}
      <section className="border-t border-white/6 py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp className="mb-20 text-center">
            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">En 3 étapes</p>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black tracking-tight text-white">Simple comme bonjour</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[38px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" />
            {[
              { n: '01', title: 'Créez votre profil',      desc: 'Photos, disciplines, tarifs — en moins de 10 minutes.' },
              { n: '02', title: 'Explorez les événements', desc: 'Filtrez par type, date, ville ou nombre de stands.' },
              { n: '03', title: 'Postulez & exposez',       desc: 'Recevez une réponse et préparez votre stand.' },
            ].map(({ n, title, desc }, i) => (
              <motion.div key={n}
                initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <motion.div whileInView={{ scale: [0.75, 1.06, 1] }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.14 + 0.15 }}
                  className="w-20 h-20 mx-auto mb-7 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 flex items-center justify-center"
                >
                  <span className="text-2xl font-black text-indigo-400 font-mono">{n}</span>
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-white/35 text-sm leading-relaxed max-w-[210px] mx-auto">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SPLIT CTA ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/6 bg-white/[0.015] py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeUp className="text-center mb-14">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-tight text-white">
              Pour qui est Nexart ?
            </h2>
          </FadeUp>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { delay: 0, glow: 'bg-indigo-600/15 group-hover:bg-indigo-600/28', bg: 'from-indigo-600/18 to-indigo-950/30', border: 'border-indigo-500/18',
                badgeBg: 'bg-indigo-500/12 border-indigo-500/22 text-indigo-300', badgeIcon: <Users size={11} />, badgeLabel: 'Pour les créateurs',
                title: 'Trouvez vos prochains événements',
                desc: "Candidatez aux marchés, pop-ups et salons qui correspondent à votre univers créatif.",
                items: ['Profil créateur en 10 min', 'Candidature en 2 clics', 'Suivi en temps réel'],
                checkClass: 'text-indigo-400', ctaHref: '/register?role=creator', ctaLabel: 'Créer mon profil', ctaClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25' },
              { delay: 0.12, glow: 'bg-violet-600/12 group-hover:bg-violet-600/22', bg: 'from-violet-600/14 to-violet-950/25', border: 'border-violet-500/14',
                badgeBg: 'bg-violet-500/10 border-violet-500/18 text-violet-300', badgeIcon: <Calendar size={11} />, badgeLabel: 'Pour les organisateurs',
                title: 'Remplissez vos événements',
                desc: "Publiez votre événement et recevez des candidatures qualifiées en quelques heures.",
                items: ["Publication en 5 min", 'Candidatures qualifiées auto', 'Gestion des stands simplifiée'],
                checkClass: 'text-violet-400', ctaHref: '/register?role=organizer', ctaLabel: 'Publier un événement', ctaClass: 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/25' },
            ].map(({ delay, glow, bg, border, badgeBg, badgeIcon, badgeLabel, title, desc, items, checkClass, ctaHref, ctaLabel, ctaClass }) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 52, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.22 } }}
                className={`group relative p-10 rounded-3xl bg-gradient-to-br ${bg} border ${border} overflow-hidden`}
              >
                <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full ${glow} blur-[100px] transition-all duration-700 pointer-events-none`} />
                <div className="relative z-10">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeBg} text-xs font-semibold mb-7`}>
                    {badgeIcon} {badgeLabel}
                  </div>
                  <h3 className="text-[1.75rem] font-black text-white tracking-tight leading-tight mb-4">{title}</h3>
                  <p className="text-white/42 text-sm leading-relaxed mb-9">{desc}</p>
                  <ul className="space-y-3 mb-9">
                    {items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/52">
                        <CheckCircle size={15} className={`${checkClass} shrink-0`} /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link href={ctaHref} className={`group/btn inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl ${ctaClass} text-white font-bold text-sm transition-all duration-200 shadow-xl hover:scale-[1.03] active:scale-[0.97]`}>
                    {ctaLabel} <ArrowRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════════════ */}
      <section className="border-t border-white/6 py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeUp>
            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-7">Rejoignez la communauté</p>
            <h2 className="text-[clamp(2.8rem,6vw,5rem)] font-black tracking-tight text-white leading-[0.9] mb-7">
              Prêt à exposer{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent"
                style={{ backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                vos créations ?
              </span>
            </h2>
            <p className="text-white/35 text-lg leading-relaxed mb-12 max-w-lg mx-auto">
              Rejoignez 2 400 créateurs et 380 événements qui font confiance à Nexart.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="group flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all duration-200 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.97]">
                Commencer gratuitement <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/events" className="flex items-center justify-center gap-2 px-9 py-4 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 hover:border-white/20 font-semibold transition-all duration-200">
                Explorer <ChevronRight size={15} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  )
}
