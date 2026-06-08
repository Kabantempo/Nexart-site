'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileFields {
  full_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  city?: string | null
  disciplines?: string[]
  portfolio_images?: string[]
  website?: string | null
  instagram?: string | null
  siret_verified?: boolean
  insurance_verified?: boolean
}

interface ProfileCompletionProps {
  profile: ProfileFields
  editHref?: string
}

// ─── Steps ────────────────────────────────────────────────────────────────────

interface Step {
  key: string
  label: string
  done: boolean
  points: number
}

function getSteps(p: ProfileFields): Step[] {
  return [
    { key: 'name',      label: 'Nom complet',           done: !!p.full_name,                        points: 10 },
    { key: 'avatar',    label: 'Photo de profil',        done: !!p.avatar_url,                       points: 15 },
    { key: 'bio',       label: 'Biographie',             done: !!(p.bio && p.bio.length >= 20),       points: 20 },
    { key: 'city',      label: 'Ville',                  done: !!p.city,                             points: 10 },
    { key: 'disc',      label: '1 discipline renseignée',done: !!(p.disciplines && p.disciplines.length > 0), points: 15 },
    { key: 'portfolio', label: '3 photos portfolio',     done: !!(p.portfolio_images && p.portfolio_images.length >= 3), points: 15 },
    { key: 'social',    label: 'Lien site ou Instagram', done: !!(p.website || p.instagram),         points: 10 },
    { key: 'siret',     label: 'SIRET vérifié',          done: !!p.siret_verified,                   points: 5  },
  ]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileCompletion({ profile, editHref = '/profile' }: ProfileCompletionProps) {
  const steps = getSteps(profile)
  const total = steps.reduce((acc, s) => acc + s.points, 0)
  const earned = steps.filter(s => s.done).reduce((acc, s) => acc + s.points, 0)
  const pct = Math.round((earned / total) * 100)
  const pending = steps.filter(s => !s.done)

  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#6366F1' : '#F59E0B'

  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      padding: '20px 24px',
      backgroundColor: '#FAFAFA',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            Profil complété
          </p>
          <p style={{ fontSize: '28px', fontWeight: '800', color, lineHeight: 1 }}>
            {pct}%
          </p>
        </div>
        {pct < 100 && (
          <Link
            href={editHref}
            style={{
              fontSize: '13px', fontWeight: '600',
              color: '#6366F1', textDecoration: 'none',
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid #A5B4FC',
              backgroundColor: '#EEF2FF',
            }}
          >
            Compléter →
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E5E7EB', overflow: 'hidden', marginBottom: '16px' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: '4px', backgroundColor: color }}
        />
      </div>

      {/* Pending steps */}
      {pending.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', fontWeight: '600' }}>
            Pour améliorer votre visibilité :
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pending.slice(0, 3).map(s => (
              <div
                key={s.key}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280' }}
              >
                <span style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '1.5px dashed #D1D5DB',
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: '#9CA3AF',
                }}>
                  +
                </span>
                {s.label}
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#A5B4FC', fontWeight: '600' }}>
                  +{s.points}pts
                </span>
              </div>
            ))}
            {pending.length > 3 && (
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                + {pending.length - 3} autre{pending.length - 3 > 1 ? 's' : ''} critère{pending.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {pct === 100 && (
        <p style={{ fontSize: '13px', color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ✓ Profil complet — vous êtes mis en avant dans les recherches
        </p>
      )}
    </div>
  )
}
