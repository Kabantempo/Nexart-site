'use client'

import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Calendar, CheckCircle, ChevronRight, Zap, Target, Bell, Shield, BadgeCheck, MapPin, Search } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

function Grain() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
      opacity: 0.035, mixBlendMode: 'overlay' as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat', backgroundSize: '180px 180px',
    }} />
  )
}

function WordReveal({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <span>
      {children.split(' ').map((w, i) => (
        <motion.span key={i}
          style={{ display: 'inline-block', marginRight: '0.22em' }}
          initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: delay + i * 0.075, ease: [0.22, 1, 0.36, 1] }}>
          {w}
        </motion.span>
      ))}
    </span>
  )
}

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

const FAKE_EVENTS = [
  { title: 'Marché de Noël — Paris 12e', date: '14–16 déc.', type: 'Marché', color: '#818CF8' },
  { title: 'Pop-up Créateurs Montmartre', date: '20 jan.',   type: 'Pop-up',  color: '#A78BFA' },
  { title: 'Salon du Fait Main Lyon',     date: '3–5 fév.',  type: 'Salon',   color: '#34D399' },
]

function PhoneMockup() {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative' }}
    >
      <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '-40px', height: '128px', backgroundColor: 'rgba(99,102,241,0.25)', filter: 'blur(50px)', borderRadius: '9999px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: '270px', margin: '0 auto', borderRadius: '48px', border: '1.5px solid rgba(255,255,255,0.12)', backgroundColor: '#0c0c1a', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', overflow: 'hidden', height: '560px' }}>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 4px', position: 'relative' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>9:41</span>
          <div style={{ width: '80px', height: '20px', borderRadius: '9999px', backgroundColor: '#000', position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
              {[3,5,7,9].map((h,i) => <div key={i} style={{ width: '2.5px', borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.5)', height: `${h}px` }}/>)}
            </div>
            <div style={{ width: '16px', height: '10px', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.4)', position: 'relative', marginLeft: '2px' }}>
              <div style={{ position: 'absolute', top: '2px', left: '2px', bottom: '2px', right: '3px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '1px' }} />
              <div style={{ position: 'absolute', right: '-2px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '6px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '0 2px 2px 0' }} />
            </div>
          </div>
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: '2px' }}>Bonjour, Marie</p>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Événements près de toi</h3>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Rechercher…</span>
          </div>
        </div>

        {/* Label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>À proximité</span>
          <span style={{ fontSize: '11px', color: '#818CF8', fontWeight: 600 }}>Voir tout</span>
        </div>

        {/* Cards */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAKE_EVENTS.map((ev, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.12, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={14} color={ev.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: ev.color }}>{ev.type}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>·</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{ev.date}</span>
                </div>
              </div>
              <div style={{ flexShrink: 0, padding: '5px 10px', borderRadius: '10px', backgroundColor: 'rgba(79,70,229,0.8)', fontSize: '10px', fontWeight: 700, color: '#fff' }}>Voir</div>
            </motion.div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '14px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#0c0c1a' }}>
          {[
            { icon: <Search size={18} />, active: false },
            { icon: <MapPin size={18} />, active: true },
            { icon: <Bell size={18} />, active: false },
            { icon: <Users size={18} />, active: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: item.active ? '#818CF8' : 'rgba(255,255,255,0.2)' }}>
              {item.icon}
              {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '9999px', backgroundColor: '#818CF8' }} />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

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
    <div style={{ flexShrink: 0, width: '280px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.035)', margin: '0 8px' }}>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '16px' }}>"{text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9999px', background: 'linear-gradient(to bottom right, #6366F1, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{name}</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{role}</p>
        </div>
      </div>
    </div>
  )
}

function TestimonialsMarquee() {
  return (
    <section style={{ padding: '80px 0', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div style={{ display: 'flex', marginBottom: '16px', animation: 'ticker 45s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW1, ...TESTIMONIALS_ROW1].map((t, i) => <TestimonialCard key={i} {...t} />)}
      </div>
      <div style={{ display: 'flex', animation: 'tickerReverse 40s linear infinite', width: 'max-content' }}>
        {[...TESTIMONIALS_ROW2, ...TESTIMONIALS_ROW2].map((t, i) => <TestimonialCard key={i} {...t} />)}
      </div>
    </section>
  )
}

const DISCIPLINES = [
  'Céramique', 'Illustration', 'Bijouterie', 'Maroquinerie', 'Textile',
  'Photographie', 'Sculpture', 'Peinture', 'Verrerie', 'Broderie',
  'Cosmétique', 'Papeterie', 'Lutherie', 'Gravure', 'Forge artisanale',
]

const FACES = [
  {
    key: 'createurs', label: 'Créateurs',
    accentColor: '#818CF8', borderColor: 'rgba(99,102,241,0.3)', bgColor: 'rgba(99,102,241,0.08)',
    tagline: 'Exposez sans galère.',
    desc: 'Un profil, toutes les opportunités. Candidatez en 2 minutes, suivez vos réponses en temps réel.',
    features: [
      { Icon: Zap,        label: 'Candidature en 2 min', desc: 'Aucun email, aucun formulaire à rallonge.' },
      { Icon: Target,     label: 'Matching intelligent',  desc: 'Les événements qui vous correspondent remontent en priorité.' },
      { Icon: Bell,       label: 'Suivi en temps réel',   desc: 'Notifications et timeline de statut instantanés.' },
      { Icon: BadgeCheck, label: 'Profil vérifiable',     desc: 'SIRET, portfolio, avis — tout en un seul endroit.' },
    ],
    ctaHref: '/register', ctaLabel: 'Créer mon profil',
  },
  {
    key: 'organisateurs', label: 'Organisateurs',
    accentColor: '#A78BFA', borderColor: 'rgba(139,92,246,0.3)', bgColor: 'rgba(139,92,246,0.08)',
    tagline: 'Remplissez vos stands.',
    desc: 'Publiez votre événement, recevez des candidatures qualifiées et gérez tout depuis votre tableau de bord.',
    features: [
      { Icon: Calendar, label: 'Publication en 5 min',  desc: 'Dates, stands, critères — votre événement est en ligne immédiatement.' },
      { Icon: Users,    label: 'Candidatures triées',    desc: 'Filtrez par discipline, ville, profil vérifié.' },
      { Icon: Shield,   label: 'Événement validé',       desc: 'Notre équipe vérifie chaque publication. Zéro arnaque.' },
      { Icon: Zap,      label: 'Gestion centralisée',    desc: 'Acceptez, refusez, communiquez — tout depuis un seul dashboard.' },
    ],
    ctaHref: '/register', ctaLabel: 'Publier un événement',
  },
  {
    key: 'visiteurs', label: 'Visiteurs',
    accentColor: '#34D399', borderColor: 'rgba(16,185,129,0.3)', bgColor: 'rgba(16,185,129,0.08)',
    tagline: 'Découvrez. Réservez. Soutenez.',
    desc: 'Trouvez les marchés et événements artisanaux près de chez vous, réservez votre place et explorez les créateurs.',
    features: [
      { Icon: MapPin,      label: 'Événements près de toi', desc: 'Géolocalisation et filtres par type, date, distance.' },
      { Icon: Users,       label: 'Portfolios créateurs',   desc: 'Parcourez les artisans inscrits avant même le jour J.' },
      { Icon: CheckCircle, label: 'Réservation de place',   desc: 'Réservez votre entrée en quelques secondes.' },
      { Icon: Bell,        label: 'Alertes personnalisées', desc: "Notifié dès qu'un événement correspond à vos intérêts." },
    ],
    ctaHref: '/events', ctaLabel: 'Explorer les événements',
  },
]

function FacesSection() {
  return (
    <section className="hc-faces-section">
      <FadeUp className="hc-faces-header">
        <p style={{ color: '#818CF8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Créateurs · Organisateurs · Visiteurs</p>
        <h2 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95, color: '#fff', maxWidth: '32rem' }}>
          Pour qui est{' '}<span style={{ color: 'rgba(255,255,255,0.3)' }}>Nexart ?</span>
        </h2>
      </FadeUp>
      <div className="hc-faces-grid">
        {FACES.map(({ key, label, accentColor, borderColor, bgColor, tagline, desc, features, ctaHref, ctaLabel }, i) => (
          <motion.div key={key}
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="hc-face-card"
            style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor }}
          >
            <p style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', color: accentColor }}>{label}</p>
            <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: '12px' }}>{tagline}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>{desc}</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {features.map(({ Icon, label: fl, desc: fd }) => (
                <li key={fl} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: bgColor, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Icon size={13} color={accentColor} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{fl}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{fd}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href={ctaHref} className="hc-face-cta" style={{ border: `1px solid ${borderColor}` }}>
              {ctaLabel} <ArrowRight size={13} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function HomeClient() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div style={{ backgroundColor: '#06060f', color: '#fff', overflowX: 'hidden', marginTop: '-58px' }}>
      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes tickerReverse { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        @keyframes gradientShift { 0%,100% { background-position: 0% 50% } 50% { background-position: 100% 50% } }

        .hc-faces-section { max-width: 72rem; margin: 0 auto; padding: 128px 16px }
        @media (min-width: 640px) { .hc-faces-section { padding-left: 24px; padding-right: 24px } }
        .hc-faces-header { margin-bottom: 64px }
        .hc-faces-grid { display: grid; grid-template-columns: 1fr; gap: 20px }
        @media (min-width: 768px) { .hc-faces-grid { grid-template-columns: repeat(3, 1fr) } }
        .hc-face-card { display: flex; flex-direction: column; padding: 28px; border-radius: 24px; transition: filter 0.3s }
        .hc-face-card:hover { filter: brightness(1.1) }
        .hc-face-cta { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 0; border-radius: 12px; font-size: 13px; font-weight: 600; color: #fff; text-decoration: none; margin-top: 32px; transition: opacity 0.15s }
        .hc-face-cta:hover { opacity: 0.8 }

        .hc-hero-content { position: relative; z-index: 10; flex: 1; max-width: 56rem; width: 100%; margin: 0 auto; padding: 80px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center }
        @media (min-width: 640px) { .hc-hero-content { padding: 80px 24px } }
        .hc-hero-btns { display: flex; flex-direction: column; gap: 12px; justify-content: center; margin-bottom: 24px }
        @media (min-width: 640px) { .hc-hero-btns { flex-direction: row } }
        .hc-hero-btn-primary { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 28px; border-radius: 16px; background-color: #4F46E5; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; transition: all 200ms; box-shadow: 0 20px 60px rgba(99,102,241,0.3) }
        .hc-hero-btn-primary:hover { background-color: #4338CA; box-shadow: 0 20px 60px rgba(99,102,241,0.5); transform: scale(1.03) }
        .hc-hero-btn-secondary { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 28px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); font-weight: 600; font-size: 14px; text-decoration: none; transition: all 200ms }
        .hc-hero-btn-secondary:hover { color: #fff; background-color: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18) }

        .hc-inner { max-width: 72rem; margin: 0 auto; padding: 0 16px }
        @media (min-width: 640px) { .hc-inner { padding: 0 24px } }
        .hc-steps-grid { display: grid; grid-template-columns: 1fr; gap: 32px; position: relative }
        @media (min-width: 768px) { .hc-steps-grid { grid-template-columns: repeat(3, 1fr) } }
        .hc-steps-connector { display: none; position: absolute; top: 38px; left: calc(16.67% + 28px); right: calc(16.67% + 28px); height: 1px; background: linear-gradient(to right, transparent, rgba(99,102,241,0.25), transparent) }
        @media (min-width: 768px) { .hc-steps-connector { display: block } }

        .hc-cta-grid { display: grid; grid-template-columns: 1fr; gap: 20px }
        @media (min-width: 768px) { .hc-cta-grid { grid-template-columns: repeat(3, 1fr) } }
        .hc-cta-card { position: relative; padding: 32px; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.22s }
        .hc-cta-card:hover { transform: translateY(-6px) }
        .hc-cta-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 16px; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; transition: all 200ms }
        .hc-cta-btn:hover { transform: scale(1.03) }

        .hc-app-split { display: flex; flex-direction: column; align-items: center; gap: 64px }
        @media (min-width: 1024px) { .hc-app-split { flex-direction: row } }
        .hc-app-text { position: relative; z-index: 10; flex: 1; text-align: center }
        @media (min-width: 1024px) { .hc-app-text { text-align: left } }
        .hc-store-btns { display: flex; flex-direction: column; gap: 12px; justify-content: center }
        @media (min-width: 640px) { .hc-store-btns { flex-direction: row } }
        @media (min-width: 1024px) { .hc-store-btns { justify-content: flex-start } }

        .hc-final-inner { max-width: 48rem; margin: 0 auto; padding: 0 16px; text-align: center }
        @media (min-width: 640px) { .hc-final-inner { padding: 0 24px } }
        .hc-final-btns { display: flex; flex-direction: column; gap: 12px; justify-content: center }
        @media (min-width: 640px) { .hc-final-btns { flex-direction: row } }
        .hc-final-btn-primary { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 36px; border-radius: 16px; background: #4F46E5; color: #fff; font-weight: 700; text-decoration: none; transition: all 200ms; box-shadow: 0 20px 40px rgba(99,102,241,0.3) }
        .hc-final-btn-primary:hover { background: #4338CA; box-shadow: 0 20px 40px rgba(99,102,241,0.5); transform: scale(1.03) }
        .hc-final-btn-secondary { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 36px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-weight: 600; text-decoration: none; transition: all 200ms }
        .hc-final-btn-secondary:hover { color: #fff; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2) }

        .hc-testi-header { text-align: center; margin-bottom: 48px }
        .hc-steps-header { margin-bottom: 80px; text-align: center }
        .hc-cta-header { text-align: center; margin-bottom: 56px }
      `}</style>

      <Grain />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100svh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#08081a' }}>
        <div style={{ height: '58px', flexShrink: 0 }} />

        <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.18, 0.3, 0.18] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-160px', left: '-192px', width: '800px', height: '800px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.2)', filter: 'blur(130px)', pointerEvents: 'none' }} />
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{ position: 'absolute', top: '33%', right: '-128px', width: '500px', height: '500px', borderRadius: '9999px', backgroundColor: 'rgba(139,92,246,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="hc-hero-content">
          <div style={{ width: '100%', textAlign: 'center' }}>

            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.1)', color: '#c7d2fe', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '32px' }}
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
                  style={{ display: 'inline-block', background: 'linear-gradient(to right, #818CF8, #c4b5fd, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                  créations
                </motion.span>
              </span>
              <span style={{ display: 'block', color: 'rgba(255,255,255,0.35)', fontSize: '0.55em', fontWeight: 700, letterSpacing: '-0.01em', overflow: 'hidden', paddingBottom: '4px' }}>
                <WordReveal delay={0.3}>dans les meilleurs événements</WordReveal>
              </span>
            </h1>

            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', lineHeight: 1.75, marginBottom: '36px' }}
            >
              Nexart connecte créateurs et organisateurs d'événements artisanaux —{' '}
              <span style={{ color: '#fff' }}>marchés, pop-ups, salons, festivals</span>.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.62 }}
              className="hc-hero-btns"
            >
              <Link href="/register" className="hc-hero-btn-primary">
                S'inscrire gratuitement <ArrowRight size={15} />
              </Link>
              <Link href="/events" className="hc-hero-btn-secondary">
                Explorer les événements
              </Link>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}
            >
              Gratuit pour les créateurs · Pas de carte bancaire requise
            </motion.p>
          </div>
        </motion.div>

        {/* Ticker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ position: 'relative', zIndex: 10, width: '100%', paddingBottom: '40px', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
        >
          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '12px', animation: 'ticker 40s linear infinite', width: 'max-content' }}>
            {[...DISCIPLINES, ...DISCIPLINES, ...DISCIPLINES].map((d, i) => (
              <span key={i} style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.5)', flexShrink: 0 }} />
                {d}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FACES ────────────────────────────────────────────────── */}
      <FacesSection />

      {/* ── TESTIMONIALS ─────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '80px 16px 16px' }}>
          <FadeUp className="hc-testi-header">
            <p style={{ color: '#818CF8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Ils nous font confiance</p>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>Ce qu'ils en disent</h2>
          </FadeUp>
        </div>
        <TestimonialsMarquee />
      </section>

      {/* ── STEPS ────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '128px 0' }}>
        <div className="hc-inner">
          <FadeUp className="hc-steps-header">
            <p style={{ color: '#818CF8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>En 3 étapes</p>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>Simple comme bonjour</h2>
          </FadeUp>
          <div className="hc-steps-grid">
            <div className="hc-steps-connector" />
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
                  style={{ width: '80px', height: '80px', margin: '0 auto 28px', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)', backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#818CF8', fontFamily: 'monospace' }}>{n}</span>
                </motion.div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: 1.6, maxWidth: '210px', margin: '0 auto' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT CTA ────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.015)', padding: '128px 0' }}>
        <div className="hc-inner">
          <FadeUp className="hc-cta-header">
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>Pour qui est Nexart ?</h2>
          </FadeUp>
          <div className="hc-cta-grid">

            {/* Créateurs */}
            <motion.div
              initial={{ opacity: 0, y: 52, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              className="hc-cta-card"
              style={{ background: 'linear-gradient(to bottom right, rgba(99,102,241,0.18), rgba(30,27,75,0.3))', border: '1px solid rgba(99,102,241,0.18)' }}
            >
              <div style={{ position: 'absolute', top: '-96px', right: '-96px', width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(100px)', transition: 'all 700ms', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(99,102,241,0.22)', backgroundColor: 'rgba(99,102,241,0.12)', color: '#c7d2fe', fontSize: '12px', fontWeight: 600, marginBottom: '28px', width: 'fit-content' }}>
                  <Users size={11} /> Créateurs
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>Trouvez vos prochains événements</h3>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>Candidatez aux marchés, pop-ups et salons qui correspondent à votre univers créatif.</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                  {['Profil créateur en 10 min', 'Candidature en 2 clics', 'Suivi en temps réel'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.52)' }}>
                      <CheckCircle size={14} color="#818CF8" style={{ flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register?role=creator" className="hc-cta-btn" style={{ backgroundColor: '#4F46E5', boxShadow: '0 20px 60px rgba(99,102,241,0.25)' }}>
                  Créer mon profil <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Organisateurs */}
            <motion.div
              initial={{ opacity: 0, y: 52, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="hc-cta-card"
              style={{ background: 'linear-gradient(to bottom right, rgba(139,92,246,0.14), rgba(46,16,101,0.25))', border: '1px solid rgba(139,92,246,0.14)' }}
            >
              <div style={{ position: 'absolute', top: '-96px', right: '-96px', width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(139,92,246,0.12)', filter: 'blur(100px)', transition: 'all 700ms', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(139,92,246,0.18)', backgroundColor: 'rgba(139,92,246,0.10)', color: '#ddd6fe', fontSize: '12px', fontWeight: 600, marginBottom: '28px', width: 'fit-content' }}>
                  <Calendar size={11} /> Organisateurs
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>Remplissez vos événements</h3>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>Publiez votre événement et recevez des candidatures qualifiées en quelques heures.</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                  {['Publication en 5 min', 'Candidatures qualifiées auto', 'Gestion des stands simplifiée'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.52)' }}>
                      <CheckCircle size={14} color="#A78BFA" style={{ flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register?role=organizer" className="hc-cta-btn" style={{ backgroundColor: '#7C3AED', boxShadow: '0 20px 60px rgba(139,92,246,0.25)' }}>
                  Publier un événement <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

            {/* Visiteurs */}
            <motion.div
              initial={{ opacity: 0, y: 52, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hc-cta-card"
              style={{ background: 'linear-gradient(to bottom right, rgba(16,185,129,0.14), rgba(6,78,59,0.25))', border: '1px solid rgba(16,185,129,0.14)' }}
            >
              <div style={{ position: 'absolute', top: '-96px', right: '-96px', width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(16,185,129,0.12)', filter: 'blur(100px)', transition: 'all 700ms', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.18)', backgroundColor: 'rgba(16,185,129,0.10)', color: '#6ee7b7', fontSize: '12px', fontWeight: 600, marginBottom: '28px', width: 'fit-content' }}>
                  <MapPin size={11} /> Visiteurs
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>Découvrez les marchés près de toi</h3>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>Trouvez les événements artisanaux autour de vous, réservez votre place et explorez les créateurs.</p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: 1 }}>
                  {['Événements géolocalisés', 'Portfolios créateurs', 'Réservation en 2 clics'].map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.52)' }}>
                      <CheckCircle size={14} color="#34D399" style={{ flexShrink: 0 }} /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/events" className="hc-cta-btn" style={{ backgroundColor: '#4F46E5', boxShadow: '0 20px 60px rgba(99,102,241,0.25)' }}>
                  Explorer les événements <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── APP DOWNLOAD ─────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '112px 0', overflow: 'hidden' }}>
        <div className="hc-app-inner" style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '400px', backgroundColor: 'rgba(99,102,241,0.1)', filter: 'blur(120px)', borderRadius: '9999px' }} />
          </div>
          <div className="hc-app-split">
            <FadeUp className="hc-app-text">
              <p style={{ color: '#818CF8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Bientôt disponible</p>
              <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.05, marginBottom: '20px' }}>
                Nexart dans<br />votre poche
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '28rem' }}>
                Candidatez, suivez vos marchés et échangez avec les organisateurs — où que vous soyez.
              </p>
              <div className="hc-store-btns">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" opacity="0.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1, marginBottom: '2px' }}>Bientôt sur</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>App Store</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" opacity="0.5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 23.76c.3.17.65.19.97.08l12.49-7.17-2.64-2.64-10.82 9.73zm-1.14-20.3C1.73 3.83 1.5 4.28 1.5 4.85v14.3c0 .57.23 1.02.54 1.39l.07.07 8.01-8.01v-.19L2.11 3.39l-.07.07zM20.37 10.5l-2.61-1.5-2.94 2.94 2.94 2.94 2.64-1.52c.75-.43.75-1.43-.03-1.86zM4.14.24L16.63 7.41l-2.64 2.64L3.17.32C3.49.21 3.84.23 4.14.24z"/>
                  </svg>
                  <div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, lineHeight: 1, marginBottom: '2px' }}>Bientôt sur</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>Google Play</p>
                  </div>
                </div>
              </div>
            </FadeUp>
            <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '128px 0' }}>
        <div className="hc-final-inner">
          <FadeUp>
            <p style={{ color: '#818CF8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '28px' }}>Rejoignez la communauté</p>
            <h2 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', lineHeight: 0.9, marginBottom: '28px' }}>
              Prêt à exposer{' '}
              <span style={{ background: 'linear-gradient(to right, #818CF8, #c4b5fd, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', backgroundSize: '200% 100%', animation: 'gradientShift 4s linear infinite' }}>
                vos créations ?
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '18px', lineHeight: 1.6, marginBottom: '48px', maxWidth: '32rem', margin: '0 auto 48px' }}>
              Rejoignez 2 400 créateurs et 380 événements qui font confiance à Nexart.
            </p>
            <div className="hc-final-btns">
              <Link href="/register" className="hc-final-btn-primary">
                S'inscrire gratuitement <ArrowRight size={16} />
              </Link>
              <Link href="/events" className="hc-final-btn-secondary">
                Explorer <ChevronRight size={15} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  )
}
