'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'

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
      <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7', textAlign: 'center' }}>
        <p style={{ color: '#4CAF50', fontWeight: '600', margin: 0 }}>Avis soumis ✓ Merci !</p>
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
                fill={(hovered || rating) >= star ? '#FF9800' : 'none'}
                color={(hovered || rating) >= star ? '#FF9800' : '#E5E7EB'}
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
                style={{ padding: '6px 12px', borderRadius: '9999px', border: `1px solid ${sel ? '#6366F1' : '#E5E7EB'}`, backgroundColor: sel ? '#6366F1' : '#FFFFFF', color: sel ? '#FFFFFF' : '#888888', fontSize: '13px', cursor: 'pointer', transition: 'all 200ms ease', fontFamily: 'inherit' }}
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
          onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
        />
        <p style={{ fontSize: '12px', color: '#AAAAAA', textAlign: 'right', margin: '4px 0 0' }}>{comment.length}/100</p>
      </div>

      {error && (
        <p style={{ color: '#E05A5A', fontSize: '13px', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: submitting ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 300ms ease' }}
        onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#5B5BD6' }}
        onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#6366F1' }}
      >
        {submitting ? 'Envoi...' : 'Soumettre mon avis'}
      </button>
    </div>
  )
}
