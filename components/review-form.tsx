'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

interface Props {
  eventId: string
  reviewerId: string
  reviewedId: string
  reviewerRole: 'creator' | 'organizer'
  onSubmitted?: () => void
}

const CREATOR_TAGS = ['Ponctuel', 'Qualité produit', 'Respect des règles', 'Stand bien tenu', 'Professionnel', 'Communicatif']
const ORGANIZER_TAGS = ['Fiable', 'Stand bien géré', 'Bon flux client', 'Organisation parfaite', 'Accueil chaleureux', 'Communication claire']

export function ReviewForm({ eventId, reviewerId, reviewedId, reviewerRole, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const tags = reviewerRole === 'organizer' ? CREATOR_TAGS : ORGANIZER_TAGS

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('Sélectionnez une note'); return }
    setError('')
    setSubmitting(true)

    const { error: err } = await supabase.from('reviews').insert({
      event_id: eventId,
      reviewer_id: reviewerId,
      reviewed_id: reviewedId,
      reviewer_role: reviewerRole,
      rating,
      comment: comment.slice(0, 100) || null,
      tags: selectedTags,
    })

    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      onSubmitted?.()
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: colors.feedback.success.bg, border: `1px solid ${colors.green.medium}`, textAlign: 'center' }}>
        <p style={{ color: colors.feedback.success.solid, fontWeight: '600', margin: 0 }}>Avis soumis ✓ Merci !</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stars */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Note *</label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
            >
              <Star
                size={28}
                fill={(hovered || rating) >= star ? colors.feedback.warning.solid : 'none'}
                color={(hovered || rating) >= star ? colors.feedback.warning.solid : colors.border.default}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>Tags</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {tags.map((tag) => {
            const sel = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{ padding: '6px 12px', borderRadius: '9999px', border: `1px solid ${sel ? colors.violet.primary : colors.border.default}`, backgroundColor: sel ? colors.violet.primary : colors.bg.primary, color: sel ? colors.bg.primary : colors.text.secondary, fontSize: '13px', cursor: 'pointer', transition: 'all 200ms ease', fontFamily: 'inherit' }}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
          Commentaire (optionnel, 100 caractères max)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 100))}
          placeholder="Votre avis en quelques mots..."
          rows={2}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', transition: 'border-color 300ms ease' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.violet.primary }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.border.default }}
        />
        <p style={{ fontSize: '12px', color: colors.gray.neutral, textAlign: 'right', margin: '4px 0 0' }}>{comment.length}/100</p>
      </div>

      {error && (
        <p style={{ color: colors.feedback.danger.solid, fontSize: '13px', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: submitting ? colors.purple.ringAlt : colors.violet.primary, color: colors.bg.primary, fontSize: '15px', fontWeight: '600', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 300ms ease' }}
        onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = colors.violet.dark }}
        onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = colors.violet.primary }}
      >
        {submitting ? 'Envoi...' : 'Soumettre mon avis'}
      </button>
    </div>
  )
}
