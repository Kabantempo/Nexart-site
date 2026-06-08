'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { X, CheckCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'creator' | 'organizer'

interface Step {
  id: string
  label: string
  description: string
  href: string
  cta: string
}

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS: Record<Role, Step[]> = {
  creator: [
    {
      id: 'complete-profile',
      label: 'Complétez votre profil',
      description: 'Ajoutez une photo, votre bio et vos disciplines pour être trouvé par les organisateurs.',
      href: '/profile',
      cta: 'Compléter mon profil',
    },
    {
      id: 'add-portfolio',
      label: 'Ajoutez des photos portfolio',
      description: 'Les organisateurs regardent vos créations avant de vous accepter. 3 photos minimum.',
      href: '/profile',
      cta: 'Ajouter des photos',
    },
    {
      id: 'explore-events',
      label: 'Explorez les événements',
      description: 'Parcourez les marchés et salons disponibles et postulez en quelques clics.',
      href: '/events',
      cta: 'Voir les événements',
    },
  ],
  organizer: [
    {
      id: 'create-event',
      label: 'Créez votre 1er événement',
      description: 'Publiez votre marché ou salon pour recevoir des candidatures de créateurs.',
      href: '/dashboard',
      cta: 'Créer un événement',
    },
    {
      id: 'explore-creators',
      label: 'Explorez les créateurs',
      description: 'Parcourez les profils et découvrez les artisans disponibles dans votre région.',
      href: '/creators',
      cta: 'Voir les créateurs',
    },
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingStepsProps {
  role: Role
  storageKey?: string
}

export function OnboardingSteps({ role, storageKey }: OnboardingStepsProps) {
  const key = storageKey ?? `nexart_onboarding_dismissed_${role}`
  const [visible, setVisible] = useState(false)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const dismissed = localStorage.getItem(key)
    if (!dismissed) setVisible(true)

    const done = localStorage.getItem(`${key}_done`)
    if (done) {
      try { setDoneIds(new Set(JSON.parse(done))) } catch { /* ignore */ }
    }
  }, [key])

  const dismiss = () => {
    localStorage.setItem(key, '1')
    setVisible(false)
  }

  const markDone = (id: string) => {
    setDoneIds(prev => {
      const next = new Set(prev).add(id)
      localStorage.setItem(`${key}_done`, JSON.stringify([...next]))
      return next
    })
  }

  const steps = STEPS[role]
  const allDone = steps.every(s => doneIds.has(s.id))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            borderRadius: '16px',
            border: '1px solid #A5B4FC',
            backgroundColor: '#EEF2FF',
            padding: '20px 24px',
            position: 'relative',
          }}
        >
          {/* Dismiss */}
          <button
            onClick={dismiss}
            style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9CA3AF', padding: '2px',
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>

          {/* Header */}
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
            Démarrer sur Nexart
          </p>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
            {role === 'creator' ? 'Bienvenue ! Voici vos premières étapes' : 'Prêt à trouver des créateurs ?'}
          </h3>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((step, idx) => {
              const done = doneIds.has(step.id) || allDone
              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: done ? '#F0FDF4' : '#FFFFFF',
                    border: `1px solid ${done ? '#86EFAC' : '#E5E7EB'}`,
                    transition: 'background-color 300ms',
                  }}
                >
                  {/* Step number / check */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: done ? '#10B981' : '#6366F1',
                    color: '#FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '13px', fontWeight: '700',
                  }}>
                    {done ? <CheckCircle size={16} /> : idx + 1}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: done ? '#6B7280' : '#1A1A1A', marginBottom: '2px', textDecoration: done ? 'line-through' : 'none' }}>
                      {step.label}
                    </p>
                    {!done && (
                      <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5', marginBottom: '8px' }}>
                        {step.description}
                      </p>
                    )}
                    {!done && (
                      <Link
                        href={step.href}
                        onClick={() => markDone(step.id)}
                        style={{
                          fontSize: '12px', fontWeight: '700',
                          color: '#6366F1', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        {step.cta} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {allDone && (
            <p style={{ fontSize: '13px', color: '#10B981', fontWeight: '600', marginTop: '14px', textAlign: 'center' }}>
              ✓ Toutes les étapes complètes — vous êtes prêt !
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
