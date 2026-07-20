'use client'

import { useEvent, useApplication, useFavorites } from '@/lib/hooks'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Euro, Tag, Clock, ChevronRight, Heart, AlertTriangle, Star, FileText, Send, Download } from 'lucide-react'
import { trackApplicationSubmit } from '@/lib/analytics'
import { useToast } from '@/components/ui/toast-provider'
import { ShareButtons } from '@/components/ui/share-buttons'
import { ReportButton } from '@/components/ui/report-button'
import StandPlanViewer from '@/components/ui/stand-plan-viewer'

interface Props {
  id: string
}

// ── Section avis / reviews ────────────────────────────────────────────────────
interface ReviewData {
  id: string
  reviewer_id: string
  reviewed_id: string
  reviewer_role: string
  rating: number
  comment?: string
  tags: string[]
  created_at: string
  reviewer?: { full_name: string; avatar_url?: string }
  reviewed?: { full_name: string; avatar_url?: string }
}

const CREATOR_TAGS = ['Ponctuel', 'Professionnel', 'Créations originales', 'Bon stand', 'Recommandé']
const ORGANIZER_TAGS = ['Bien organisé', 'Affluence réelle', 'Bonne communication', 'Stand conforme', 'Recommandé']

function EventReviews({ eventId, userId, userRole }: { eventId: string; userId?: string; userRole?: string | null }) {
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [reviewedId, setReviewedId] = useState('')
  const [reviewedName, setReviewedName] = useState('')
  const [candidates, setCandidates] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/reviews?event_id=${eventId}`)
      const data = await res.json()
      setReviews(data.reviews || [])

      if (userId) {
        setAlreadyReviewed(data.reviews?.some((r: ReviewData) => r.reviewer_id === userId) || false)
      }

      // Si organisateur, charger les créateurs acceptés
      if (userRole === 'organizer' && userId) {
        const { data: apps } = await supabase.from('applications')
          .select('creator_id, profiles!creator_id(full_name)')
          .eq('event_id', eventId)
          .eq('status', 'accepted')
        const list = (apps || []).map((a: Record<string, unknown>) => ({
          id: a.creator_id as string,
          full_name: (a.profiles as { full_name?: string } | null)?.full_name || 'Créateur',
        }))
        setCandidates(list)
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, userId])

  const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    if (!userId || rating === 0) return
    setSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        reviewer_id: userId,
        reviewed_id: reviewedId || (reviews.find(r => r.reviewer_role !== userRole)?.reviewer_id),
        reviewer_role: userRole,
        rating, comment, tags: selectedTags,
      }),
    })
    if (res.ok) {
      const { review } = await res.json()
      setReviews(prev => [{ ...review }, ...prev])
      setShowForm(false)
      setAlreadyReviewed(true)
    }
    setSubmitting(false)
  }

  const tagOptions = userRole === 'organizer' ? CREATOR_TAGS : ORGANIZER_TAGS

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Avis ({reviews.length})
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '3px 8px' }}>
              <Star size={13} color="#F59E0B" fill="#F59E0B" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400E' }}>{avgRating}</span>
            </div>
          )}
        </div>
        {userId && (userRole === 'creator' || userRole === 'organizer') && !alreadyReviewed && !showForm && (
          <button onClick={() => setShowForm(true)}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
            + Laisser un avis
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
            {userRole === 'organizer' ? 'Notez un créateur' : 'Notez l\'organisateur'}
          </p>

          {userRole === 'organizer' && candidates.length > 0 && (
            <select value={reviewedId} onChange={e => {
              setReviewedId(e.target.value)
              setReviewedName(candidates.find(c => c.id === e.target.value)?.full_name || '')
            }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '12px', backgroundColor: 'var(--bg-primary)' }}>
              <option value="">Sélectionner un créateur...</option>
              {candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          )}

          {/* Stars */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                <Star size={24} color="#F59E0B" fill={s <= rating ? '#F59E0B' : 'none'} />
              </button>
            ))}
            {rating > 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px', marginTop: '4px' }}>{rating}/5</span>}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {tagOptions.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid', borderColor: selectedTags.includes(tag) ? 'var(--text-primary)' : 'var(--border-color)', backgroundColor: selectedTags.includes(tag) ? 'var(--text-primary)' : 'var(--bg-primary)', color: selectedTags.includes(tag) ? 'var(--bg-primary)' : 'var(--text-secondary)' }}>
                {tag}
              </button>
            ))}
          </div>

          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Commentaire (optionnel)..."
            rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} disabled={submitting || rating === 0 || (userRole === 'organizer' && !reviewedId)}
              style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: (submitting || rating === 0) ? 'var(--border-color)' : 'var(--text-primary)', color: 'var(--bg-primary)', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
              {submitting ? 'Envoi...' : 'Publier l\'avis'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Chargement des avis...</p>
      ) : reviews.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 2px' }}>
                    {r.reviewer?.full_name || 'Anonyme'}
                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                      {r.reviewer_role === 'creator' ? 'Créateur' : 'Organisateur'}
                    </span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    Note à {r.reviewed?.full_name || 'la contrepartie'} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} color="#F59E0B" fill={s <= r.rating ? '#F59E0B' : 'none'} />
                  ))}
                </div>
              </div>
              {r.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {r.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '99px' }}>{tag}</span>
                  ))}
                </div>
              )}
              {r.comment && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  seasonal: 'Saisonnier',
  popup: 'Pop-up',
  salon: 'Salon',
  fair: 'Foire',
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#FF9800', bg: '#FFF8E1' },
  accepted: { label: 'Acceptée ✓', color: '#4CAF50', bg: '#E8F5E9' },
  refused: { label: 'Refusée', color: '#E05A5A', bg: '#FEF2F2' },
}

type Stand = { id: string; stand_number: string; dimensions: string | null; notes: string | null; creator_id: string | null }

function StandsManager({ eventId }: { eventId: string }) {
  const [stands, setStands] = useState<Stand[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [newNum, setNewNum] = useState('')
  const [newDim, setNewDim] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase.from('event_stands').select('*').eq('event_id', eventId).order('stand_number').then(({ data }) => {
      setStands((data as Stand[]) ?? [])
      setLoading(false)
    })
  }, [open, eventId])

  const addStand = async () => {
    if (!newNum.trim()) return
    setSaving(true)
    const { data } = await supabase.from('event_stands')
      .insert({ event_id: eventId, stand_number: newNum.trim(), dimensions: newDim.trim() || null })
      .select().single()
    if (data) setStands(prev => [...prev, data as Stand])
    setNewNum('')
    setNewDim('')
    setSaving(false)
  }

  const deleteStand = async (id: string) => {
    await supabase.from('event_stands').delete().eq('id', id)
    setStands(prev => prev.filter(s => s.id !== id))
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
        Gérer les stands ({stands.length})
      </button>
    )
  }

  return (
    <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Gestion des stands</p>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px' }}>×</button>
      </div>
      {loading ? <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Chargement…</p> : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {stands.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', minWidth: '40px' }}>#{s.stand_number}</span>
                {s.dimensions && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.dimensions}</span>}
                <span style={{ flex: 1 }} />
                {s.creator_id && <span style={{ fontSize: '11px', color: '#6366F1', fontWeight: '600' }}>Assigné</span>}
                <button onClick={() => deleteStand(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E05A5A', fontSize: '16px' }}>×</button>
              </div>
            ))}
            {stands.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>Aucun stand créé</p>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={newNum} onChange={e => setNewNum(e.target.value)} placeholder="N°" style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }} />
            <input value={newDim} onChange={e => setNewDim(e.target.value)} placeholder="Dimensions (ex: 3m×2m)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }} />
            <button onClick={addStand} disabled={saving || !newNum.trim()} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              Ajouter
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>FAQ</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: open === i ? 'var(--bg-secondary)' : 'var(--bg-primary)', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.q}</span>
              <span style={{ fontSize: '20px', color: '#6366F1', flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 150ms' }}>+</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 20px 16px', fontSize: '14px', color: '#555555', lineHeight: '1.7' }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EventDetailClient({ id }: Props) {
  const { event, loading, error } = useEvent(id)
  const user = useAuthStore((s) => s.user)
  const { application, applying, error: applyError, success, apply, acceptedCount } = useApplication(id, user?.id)
  const { favEventIds, toggleEventFav } = useFavorites(user?.id)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [profileChecked, setProfileChecked] = useState(false)
  const [applications, setApplications] = useState<{ id: string; creator_id: string; status: string; message: string | null; created_at: string; profiles: { full_name: string | null; avatar_url: string | null } | null }[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [contractLoading, setContractLoading] = useState<string | null>(null)
  const [contractSigning, setContractSigning] = useState(false)
  const [existingContract, setExistingContract] = useState<{ id: string; status: string; pdf_url: string; signed_at?: string } | null>(null)
  const [bulkMsgText, setBulkMsgText] = useState('')
  const [bulkMsgSending, setBulkMsgSending] = useState(false)
  const [bulkMsgDone, setBulkMsgDone] = useState(false)
  const [showBulkMsg, setShowBulkMsg] = useState(false)
  // Bulk message enhanced
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkTemplate, setBulkTemplate] = useState('custom')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [onWaitlist, setOnWaitlist] = useState(false)
  const [joiningWaitlist, setJoiningWaitlist] = useState(false)
  const [appPortfolioFiles, setAppPortfolioFiles] = useState<File[]>([])
  const [appPortfolioUploading, setAppPortfolioUploading] = useState(false)
  const appPortfolioRef = useRef<HTMLInputElement>(null)

  const REQUIRED_FIELDS_TOTAL = 6

  // Charger le contrat existant si le créateur est accepté
  useEffect(() => {
    if (!user || user.role !== 'creator' || !application || application.status !== 'accepted') return
    supabase.from('contracts')
      .select('id, status, pdf_url, signed_at')
      .eq('event_id', id)
      .eq('creator_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setExistingContract(data as any) })
  }, [user, application, id])

  useEffect(() => {
    if (success) toastSuccess('Candidature envoyée ! L\'organisateur vous répondra bientôt.')
  }, [success]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (applyError) toastError(applyError)
  }, [applyError]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || user.role !== 'organizer' || !event || event.organizer_id !== user.id) return
    const fetchApps = async () => {
      setAppsLoading(true)
      const { data } = await supabase
        .from('applications')
        .select('id, creator_id, status, message, created_at, profiles(full_name, avatar_url)')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
      setApplications((data as unknown as typeof applications) || [])
      setAppsLoading(false)
    }
    fetchApps()
  }, [user, event, id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdateStatus = async (appId: string, status: 'accepted' | 'refused') => {
    setUpdatingId(appId)
    const { error } = await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
    if (!error) {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
      toastSuccess(status === 'accepted' ? 'Candidature acceptée ✓' : 'Candidature refusée')

      const app = applications.find(a => a.id === appId)
      if (app && event) {
        // Notif in-app pour le créateur
        await supabase.from('notifications').insert({
          user_id: app.creator_id,
          type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
          title: status === 'accepted' ? 'Candidature acceptée ✅' : 'Candidature non retenue',
          body: status === 'accepted'
            ? `Votre candidature pour "${event.title}" a été acceptée !`
            : `Votre candidature pour "${event.title}" n'a pas été retenue.`,
          link: `/events/${id}`,
        })

        // Email au créateur
        const { data: creatorAuth } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', app.creator_id)
          .maybeSingle()
        fetch('/api/application-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: app.creator_id,
            creatorName: app.profiles?.full_name || creatorAuth?.full_name || 'Créateur',
            eventTitle: event.title,
            status,
          }),
        }).catch(() => {})
      }
    } else {
      toastError('Erreur lors de la mise à jour')
    }
    setUpdatingId(null)
  }

  const handleSignContract = async () => {
    if (!user || !existingContract) return
    setContractSigning(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ contract_id: existingContract.id, signer_id: user.id }),
      })
      if (res.ok) {
        setExistingContract(c => c ? { ...c, status: 'signed', signed_at: new Date().toISOString() } : c)
        toastSuccess('Contrat signé électroniquement ✓')
      } else {
        toastError('Erreur lors de la signature')
      }
    } finally {
      setContractSigning(false)
    }
  }

  const handleGenerateContract = async (creatorId: string, appId: string) => {
    if (!user || !event) return
    setContractLoading(appId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ event_id: event.id, creator_id: creatorId, organizer_id: event.organizer_id, application_id: appId }),
      })
      if (!res.ok) { toastError('Erreur lors de la génération du contrat'); return }
      const json = await res.json()
      if (json.pdf_url) window.open(json.pdf_url, '_blank')
      else toastError('URL du contrat manquante')
    } finally {
      setContractLoading(null)
    }
  }

  const handleBulkMessage = async () => {
    if (!bulkMsgText.trim() || !user || !event) return
    setBulkMsgSending(true)
    const targetIds = selectedCreatorIds.length > 0 ? selectedCreatorIds : applications.filter(a => a.status === 'accepted').map(a => a.creator_id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/organizer/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          event_id: event.id,
          creator_ids: targetIds,
          subject: bulkSubject || `Message de l\'organisateur — ${event.title}`,
          message: bulkMsgText.trim(),
          template: bulkTemplate,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toastError(data.error || 'Erreur lors de l\'envoi')
        return
      }
      setBulkMsgDone(true)
      setBulkMsgText('')
      setBulkSubject('')
      setBulkTemplate('custom')
      setShowBulkMsg(false)
      setShowBulkModal(false)
      setSelectedCreatorIds([])
      toastSuccess(`Message envoyé à ${data.sent} créateur${data.sent > 1 ? 's' : ''} ✓`)
    } catch {
      toastError('Erreur réseau lors de l\'envoi')
    } finally {
      setBulkMsgSending(false)
    }
  }

  const BULK_TEMPLATES = [
    { id: 'custom', label: 'Personnalisé', text: '' },
    { id: 'reminder', label: 'Rappel', text: `Bonjour, nous vous rappelons que l'événement ${event?.title || '[NOM]'} aura lieu le ${event?.start_date ? new Date(event.start_date).toLocaleDateString('fr-FR') : '[DATE]'}. N'hésitez pas à nous contacter si vous avez des questions.` },
    { id: 'info', label: 'Infos pratiques', text: `Bonjour, voici les informations pratiques pour l'événement ${event?.title || '[NOM]'} : installation à partir de [HEURE], emplacement [STAND].` },
  ]

  const handleTemplateChange = (templateId: string) => {
    setBulkTemplate(templateId)
    const tpl = BULK_TEMPLATES.find(t => t.id === templateId)
    if (tpl && tpl.text) setBulkMsgText(tpl.text)
    else if (templateId === 'custom') setBulkMsgText('')
  }

  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreatorIds(prev =>
      prev.includes(creatorId) ? prev.filter(id => id !== creatorId) : [...prev, creatorId]
    )
  }

  const handleCancelApplication = async () => {
    if (!user || !application) return
    setCancelling(true)
    const wasAccepted = application.status === 'accepted'
    const { error } = await supabase.from('applications').delete().eq('id', application.id).eq('creator_id', user.id)
    if (!error) {
      setCancelled(true)
      toastSuccess('Candidature retirée')
      // Si la candidature était acceptée, notifier le premier en waitlist
      if (wasAccepted) {
        const { data: next } = await supabase
          .from('application_waitlist')
          .select('creator_id')
          .eq('event_id', id)
          .order('position')
          .limit(1)
          .maybeSingle()
        if (next?.creator_id) {
          await supabase.from('notifications').insert({
            user_id: next.creator_id,
            type: 'waitlist_available',
            title: 'Une place s\'est libérée !',
            body: `Une place vient de se libérer pour "${event?.title}". Postulez maintenant !`,
            link: `/events/${id}`,
          })
          // Retirer de la waitlist
          await supabase.from('application_waitlist').delete().eq('event_id', id).eq('creator_id', next.creator_id)
        }
      }
    } else {
      toastError('Erreur lors du retrait de la candidature')
    }
    setCancelling(false)
  }

  // Vérifier si le créateur est déjà en waitlist
  useEffect(() => {
    if (!user || !id) return
    supabase.from('application_waitlist').select('id').eq('event_id', id).eq('creator_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setOnWaitlist(true) })
  }, [user, id])

  const handleJoinWaitlist = async () => {
    if (!user || joiningWaitlist) return
    setJoiningWaitlist(true)
    const { data: lastPos } = await supabase.from('application_waitlist').select('position').eq('event_id', id).order('position', { ascending: false }).limit(1).maybeSingle()
    await supabase.from('application_waitlist').insert({ event_id: id, creator_id: user.id, position: (lastPos?.position ?? 0) + 1 })
    setOnWaitlist(true)
    setJoiningWaitlist(false)
  }

  const handleLeaveWaitlist = async () => {
    if (!user) return
    await supabase.from('application_waitlist').delete().eq('event_id', id).eq('creator_id', user.id)
    setOnWaitlist(false)
  }

  useEffect(() => {
    if (!user || user.role !== 'creator') {
      setProfileChecked(true)
      return
    }
    const checkProfile = async () => {
      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('full_name, bio, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('creator_profiles').select('disciplines, city, travel_radius').eq('user_id', user.id).maybeSingle(),
      ])
      const missing: string[] = []
      if (!p?.full_name) missing.push('Nom complet')
      if (!p?.bio) missing.push('Bio')
      if (!p?.avatar_url) missing.push('Photo de profil')
      if (!cp?.disciplines?.length) missing.push('Disciplines')
      if (!cp?.city) missing.push('Ville')
      if (!cp?.travel_radius) missing.push('Rayon de déplacement')
      setMissingFields(missing)
      setProfileChecked(true)
    }
    checkProfile()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Chargement...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Événement introuvable</p>
        <Link href="/events" style={{ color: '#6366F1', textDecoration: 'none', marginTop: '16px', display: 'block' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  const handleApply = async () => {
    setAppPortfolioUploading(appPortfolioFiles.length > 0)
    let portfolioUrls: string[] = []
    if (appPortfolioFiles.length > 0 && user) {
      const uploads = await Promise.all(appPortfolioFiles.map(async (file, i) => {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `applications/${user.id}/${id}/${Date.now()}_${i}.${ext}`
        const { error, data } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
        if (error) return null
        return supabase.storage.from('avatars').getPublicUrl(data.path).data.publicUrl
      }))
      portfolioUrls = uploads.filter(Boolean) as string[]
    }
    setAppPortfolioUploading(false)
    await apply(message, portfolioUrls)
    trackApplicationSubmit(id, user?.id)
    setAppPortfolioFiles([])
    setShowForm(false)
  }

  const handleAddToCalendar = () => {
    if (!event) return
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const start = event.start_date ? new Date(event.start_date) : new Date()
    const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 8 * 3600000)
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexart//FR',
      'BEGIN:VEVENT',
      `UID:${id}@nexart.fr`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
      event.location ? `LOCATION:${event.location.replace(/,/g, '\\,')}` : '',
      event.description ? `DESCRIPTION:${event.description.substring(0, 255).replace(/\n/g, '\\n').replace(/,/g, '\\,')}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')
    const blob = new Blob([lines], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${event.title.replace(/\s+/g, '-')}.ics`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <style>{`
        @media (max-width: 768px) {
          .event-grid { grid-template-columns: 1fr !important; }
          .event-cover { height: 240px !important; }
          .event-title { font-size: 24px !important; }
          .event-sidebar { order: -1; }
        }
      `}</style>
      {/* Cover Image */}
      <div className="event-cover" style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: 'var(--bg-secondary)' }}>
        {event.cover_image ? (
          <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={80} color="rgba(255,255,255,0.5)" />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
          {event.event_type && (
            <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
          )}
          <h1 className="event-title" style={{ fontSize: '36px', fontWeight: '700', color: '#FFFFFF', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {event.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px 32px' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6366F1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}>
            Accueil
          </Link>
          <ChevronRight size={13} color="var(--border-color)" />
          <Link href="/events" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6366F1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}>
            Événements
          </Link>
          <ChevronRight size={13} color="var(--border-color)" />
          <span style={{ color: 'var(--text-primary)', fontWeight: '600', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </span>
        </nav>

        <Link
          href="/events"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
        >
          <ArrowLeft size={16} />
          Retour aux événements
        </Link>

        <div className="event-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
          {/* Main Content */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Info bars */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                {event.start_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Date</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {event.end_date && event.end_date !== event.start_date && (
                          <> → {new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</>
                        )}
                      </div>
                      {(event as unknown as { recurrence_type?: string; recurrence_dates?: string[] }).recurrence_type && (event as unknown as { recurrence_type?: string }).recurrence_type !== 'none' && (
                        <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: '600', marginTop: '4px' }}>
                          {({ weekly: 'Hebdomadaire', biweekly: 'Bimensuel', monthly: 'Mensuel' } as Record<string, string>)[(event as unknown as { recurrence_type: string }).recurrence_type] || ''}
                          {' · '}{(event as unknown as { recurrence_dates?: string[] }).recurrence_dates?.length ?? 0} dates au total
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {(event.start_time || event.end_time) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Horaires</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {event.start_time}{event.end_time ? ` — ${event.end_time}` : ''}
                      </div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lieu</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {event.location}
                      </div>
                    </div>
                  </div>
                )}
                {(event.stand_count ?? 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#6366F1" />
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stands</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {event.stand_count} stands
                        {event.stand_dimensions ? ` · ${event.stand_dimensions}` : ''}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Share + Favori + Calendar */}
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Partager</p>
                  <ShareButtons url={`/events/${id}`} title={event.title} description={event.description?.substring(0, 120)} />
                </div>
                {user && event?.organizer_id !== user.id && (
                  <div style={{ marginTop: '28px', display: 'flex', alignItems: 'center' }}>
                    <ReportButton targetId={id} targetType="event" reporterId={user.id} />
                  </div>
                )}
                <button
                  onClick={handleAddToCalendar}
                  title="Ajouter à mon agenda"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                    backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                    fontSize: '14px', fontWeight: '600', transition: 'all 200ms ease',
                    border: '1.5px solid var(--border-color)', marginTop: '28px',
                  }}
                >
                  <Download size={16} /> Agenda (.ics)
                </button>
                {user && (
                  <button
                    onClick={() => toggleEventFav(id)}
                    title={favEventIds.has(id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: favEventIds.has(id) ? '#FFF1F2' : '#F8FAFC',
                      color: favEventIds.has(id) ? '#BE123C' : 'var(--text-secondary)',
                      fontSize: '14px', fontWeight: '600', transition: 'all 200ms ease',
                      border: `1.5px solid ${favEventIds.has(id) ? '#FECDD3' : 'var(--border-color)'}`,
                      marginTop: '28px',
                    }}
                  >
                    <Heart size={16} fill={favEventIds.has(id) ? '#E05A5A' : 'none'} color={favEventIds.has(id) ? '#E05A5A' : '#94A3B8'} />
                    {favEventIds.has(id) ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Description</h2>
                  <p style={{ fontSize: '16px', color: '#555555', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {event.description}
                  </p>
                </div>
              )}

              {/* Disciplines */}
              {(event.discipline_tags ?? []).length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    <Tag size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Disciplines recherchées
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(event.discipline_tags ?? []).map((tag: string) => (
                      <span key={tag} style={{ padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#F0F0FF', color: '#6366F1', fontSize: '14px', fontWeight: '500' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {event.rules && (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Règlement</h2>
                  <p style={{ fontSize: '15px', color: '#555555', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                    {event.rules}
                  </p>
                </div>
              )}

              {/* Gallery section */}
              {(event as unknown as { gallery_images?: string[] }).gallery_images?.length ? (
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Galerie photos</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                    {(event as unknown as { gallery_images: string[] }).gallery_images.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image src={url} alt={`Photo ${i + 1}`} fill style={{ objectFit: 'cover', transition: 'transform 200ms ease' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }} />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* FAQ section */}
              {(event as unknown as { faq?: { q: string; a: string }[] }).faq?.length ? (
                <FaqSection items={(event as unknown as { faq: { q: string; a: string }[] }).faq} />
              ) : null}

              {/* Reviews section */}
              <EventReviews eventId={id} userId={user?.id} userRole={user?.role} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="event-sidebar" style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', backgroundColor: 'var(--bg-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                Postuler à cet événement
              </h3>

              {/* Stand price */}
              {(event.stand_price ?? 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                  <Euro size={20} color="#6366F1" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Prix du stand</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#6366F1' }}>{event.stand_price}€</div>
                  </div>
                </div>
              )}

              {/* Stands occupancy */}
              {(event.stand_count ?? 0) > 0 && acceptedCount !== null && (() => {
                const remaining = (event.stand_count ?? 0) - acceptedCount
                const pct = Math.min(100, Math.round((acceptedCount / (event.stand_count ?? 1)) * 100))
                const full = remaining <= 0
                return (
                  <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: full ? '#FEF2F2' : 'var(--bg-secondary)', border: `1px solid ${full ? '#FCA5A5' : 'var(--border-color)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        {full ? 'Complet' : `${remaining} stand${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {acceptedCount}/{event.stand_count}
                      </span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${pct}%`,
                        backgroundColor: pct >= 90 ? '#E05A5A' : pct >= 60 ? '#F59E0B' : '#10B981',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })()}

              {/* Stand plan viewer */}
              <StandPlanViewer eventId={id} />

              {/* Already applied */}
              {application && !cancelled ? (
                <div style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: STATUS_STYLES[application.status]?.bg || 'var(--bg-secondary)',
                  border: `1px solid ${STATUS_STYLES[application.status]?.color || 'var(--border-color)'}`,
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: STATUS_STYLES[application.status]?.color || 'var(--text-secondary)', margin: 0 }}>
                    {STATUS_STYLES[application.status]?.label || application.status}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Candidature envoyée le {new Date(application.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {application.status === 'pending' && (
                    <button
                      onClick={handleCancelApplication}
                      disabled={cancelling}
                      style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: cancelling ? 'wait' : 'pointer', opacity: cancelling ? 0.6 : 1 }}
                    >
                      {cancelling ? 'Retrait…' : 'Retirer ma candidature'}
                    </button>
                  )}
                  {application.status === 'accepted' && user && event && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {existingContract ? (
                        <>
                          <a
                            href={existingContract.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'var(--bg-primary)', color: '#6366F1', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                          >
                            <FileText size={14} /> Voir le contrat
                          </a>
                          {existingContract.status !== 'signed' ? (
                            <button
                              onClick={handleSignContract}
                              disabled={contractSigning}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: contractSigning ? 'wait' : 'pointer', opacity: contractSigning ? 0.7 : 1 }}
                            >
                              ✍️ {contractSigning ? 'Signature…' : 'Signer électroniquement'}
                            </button>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#10B981', fontSize: '13px', fontWeight: '700' }}>
                              ✓ Signé le {new Date(existingContract.signed_at!).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleGenerateContract(user.id, application.id)}
                          disabled={contractLoading === application.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: contractLoading === application.id ? 'wait' : 'pointer', opacity: contractLoading === application.id ? 0.7 : 1 }}
                        >
                          <FileText size={14} />
                          {contractLoading === application.id ? 'Génération…' : 'Générer le contrat PDF'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : success ? (
                <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#E8F5E9', border: '1px solid #4CAF50', textAlign: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#4CAF50', margin: 0 }}>
                    Candidature envoyée ✓
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    L'organisateur vous répondra bientôt
                  </p>
                </div>
              ) : !user ? (
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
                    Connectez-vous pour postuler à cet événement
                  </p>
                  <Link
                    href="/login"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '16px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #6366F1', color: '#6366F1', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box', marginTop: '12px' }}
                  >
                    Créer un compte
                  </Link>
                </div>
              ) : user.role === 'organizer' && event?.organizer_id === user.id ? (
                <div>
                  {/* Outils organisateur */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '8px', marginBottom: '20px' }}>
                    {[
                      { label: 'Exposants', href: `/events/${id}/exhibitors` },
                      { label: "Liste d'attente", href: `/events/${id}/waitlist` },
                      { label: 'Analytics', href: `/events/${id}/analytics` },
                      { label: 'Équipe', href: `/events/${id}/team` },
                      { label: 'Bénévoles', href: `/events/${id}/volunteers` },
                      { label: 'Campagnes', href: `/events/${id}/campaigns` },
                      { label: 'Plan stands', href: `/events/${id}/settings/stands` },
                      { label: 'Paramètres', href: `/events/${id}/settings/faqs` },
                    ].map(tool => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        style={{ display: 'block', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}
                      >
                        {tool.label}
                      </Link>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      Candidatures ({applications.length})
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {applications.some(a => a.status === 'accepted' || a.status === 'pending') && (
                        <button
                          onClick={() => { setShowBulkModal(true); setBulkTemplate('custom'); setBulkMsgText(''); setBulkSubject('') }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: '#FFF', color: '#6366F1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <Send size={13} /> Messagerie groupée
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/events/${id}?invite=1`
                          navigator.clipboard.writeText(link).then(() => toastSuccess('Lien d\'invitation copié !'))
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Inviter un créateur
                      </button>
                    </div>
                  </div>

                  {/* Modal messagerie groupée */}
                  {showBulkModal && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                            Message groupé
                          </h3>
                          <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '20px', lineHeight: 1 }}>×</button>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
                          {selectedCreatorIds.length > 0
                            ? `${selectedCreatorIds.length} créateur${selectedCreatorIds.length > 1 ? 's' : ''} sélectionné${selectedCreatorIds.length > 1 ? 's' : ''}`
                            : `Tous les créateurs acceptés (${applications.filter(a => a.status === 'accepted').length})`}
                        </p>
                        {/* Template dropdown */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Modèle</label>
                          <select
                            value={bulkTemplate}
                            onChange={e => handleTemplateChange(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', outline: 'none', cursor: 'pointer' }}
                          >
                            {BULK_TEMPLATES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        {/* Sujet */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sujet</label>
                          <input
                            type="text"
                            value={bulkSubject}
                            onChange={e => setBulkSubject(e.target.value)}
                            placeholder={`Message de l'organisateur — ${event?.title || ''}`}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        {/* Message */}
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Message</label>
                          <textarea
                            value={bulkMsgText}
                            onChange={e => setBulkMsgText(e.target.value)}
                            placeholder="Votre message…"
                            rows={5}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => setShowBulkModal(false)}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={handleBulkMessage}
                            disabled={bulkMsgSending || !bulkMsgText.trim()}
                            style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: bulkMsgSending || !bulkMsgText.trim() ? 'not-allowed' : 'pointer', opacity: bulkMsgSending || !bulkMsgText.trim() ? 0.6 : 1 }}
                          >
                            <Send size={13} /> {bulkMsgSending ? 'Envoi…' : 'Envoyer'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {appsLoading ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>Chargement...</div>
                  ) : applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucune candidature reçue</p>
                    </div>
                  ) : (
                    <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {applications.map(app => (
                        <div key={app.id} style={{ borderRadius: '10px', border: selectedCreatorIds.includes(app.creator_id) ? '2px solid #6366F1' : '1px solid var(--border-color)', padding: '14px', backgroundColor: selectedCreatorIds.includes(app.creator_id) ? '#F8F9FF' : 'var(--bg-primary)', transition: 'border-color 0.15s, background-color 0.15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            {/* Checkbox sélection */}
                            {(app.status === 'accepted' || app.status === 'pending') && (
                              <input
                                type="checkbox"
                                checked={selectedCreatorIds.includes(app.creator_id)}
                                onChange={() => toggleCreatorSelection(app.creator_id)}
                                style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer', flexShrink: 0 }}
                              />
                            )}
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                              {app.profiles?.avatar_url
                                ? <Image src={app.profiles.avatar_url} alt="" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                : (app.profiles?.full_name?.[0] || '?')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Link href={`/creators/${app.creator_id}`} style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textDecoration: 'none' }}>
                                {app.profiles?.full_name || 'Créateur'}
                              </Link>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                                {new Date(app.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                              backgroundColor: app.status === 'accepted' ? '#ECFDF5' : app.status === 'refused' ? '#FEF2F2' : '#FFFBEB',
                              color: app.status === 'accepted' ? '#10B981' : app.status === 'refused' ? '#E05A5A' : '#F59E0B',
                            }}>
                              {app.status === 'accepted' ? 'Acceptée' : app.status === 'refused' ? 'Refusée' : 'En attente'}
                            </span>
                          </div>
                          {app.message && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '10px 12px', margin: '0 0 10px', fontStyle: 'italic' }}>
                              "{app.message}"
                            </p>
                          )}
                          {/* Portfolio images jointes */}
                          {(app as unknown as { portfolio_images?: string[] }).portfolio_images?.length ? (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              {(app as unknown as { portfolio_images: string[] }).portfolio_images.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'block', width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <Image src={url} alt="" width={56} height={56} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                </a>
                              ))}
                            </div>
                          ) : null}
                          {app.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'accepted')}
                                disabled={updatingId === app.id}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: updatingId === app.id ? 0.6 : 1 }}
                              >
                                Accepter
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'refused')}
                                disabled={updatingId === app.id}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: '#E05A5A', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: updatingId === app.id ? 0.6 : 1 }}
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                          {app.status === 'accepted' && (
                            <button
                              onClick={() => handleGenerateContract(app.creator_id, app.id)}
                              disabled={contractLoading === app.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: '#F8F9FF', color: '#6366F1', fontSize: '12px', fontWeight: '700', cursor: contractLoading === app.id ? 'wait' : 'pointer', opacity: contractLoading === app.id ? 0.7 : 1 }}
                            >
                              <FileText size={12} />
                              {contractLoading === app.id ? 'Génération…' : 'Contrat PDF'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Barre d'action fixe en bas quand ≥ 1 créateur sélectionné */}
                    {selectedCreatorIds.length > 0 && (
                      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {selectedCreatorIds.length} créateur{selectedCreatorIds.length > 1 ? 's' : ''} sélectionné{selectedCreatorIds.length > 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => setSelectedCreatorIds([])}
                            style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Désélectionner
                          </button>
                        </div>
                        <button
                          onClick={() => { setShowBulkModal(true); setBulkTemplate('custom'); setBulkMsgText(''); setBulkSubject('') }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          <Send size={14} /> Envoyer un message groupé
                        </button>
                      </div>
                    )}
                    </>
                  )}
                  {/* Gestion des stands */}
                  <StandsManager eventId={id} />
                </div>
              ) : (user.role === 'organizer' || user.role === 'visitor') ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {user.role === 'visitor' ? 'Créez un compte créateur pour postuler aux événements' : 'Seuls les créateurs peuvent postuler aux événements'}
                </p>
              ) : (user.role === 'creator') && profileChecked && missingFields.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Profil complété</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366F1' }}>
                        {REQUIRED_FIELDS_TOTAL - missingFields.length}/{REQUIRED_FIELDS_TOTAL}
                      </span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '99px', backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        borderRadius: '99px',
                        width: `${((REQUIRED_FIELDS_TOTAL - missingFields.length) / REQUIRED_FIELDS_TOTAL) * 100}%`,
                        background: 'linear-gradient(90deg, #6366F1, #818CF8)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <AlertTriangle size={15} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400E', margin: 0 }}>
                        Complétez votre profil avant de postuler
                      </p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {missingFields.map(f => (
                        <li key={f} style={{ fontSize: '12px', color: '#92400E', marginBottom: '2px' }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href="/profile"
                    style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                  >
                    Compléter mon profil →
                  </Link>
                </div>
              ) : showForm ? (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                    Message à l'organisateur (optionnel)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Présentez-vous et votre activité..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }}
                  />
                  {/* Portfolio joint */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Photos de vos créations (optionnel, max 4)
                    </label>
                    <input ref={appPortfolioRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                      onChange={e => {
                        const files = Array.from(e.target.files ?? []).slice(0, 4)
                        setAppPortfolioFiles(files)
                        e.target.value = ''
                      }} />
                    {appPortfolioFiles.length === 0 ? (
                      <button onClick={() => appPortfolioRef.current?.click()}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        + Ajouter des photos
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {appPortfolioFiles.map((f, i) => (
                          <div key={i} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => setAppPortfolioFiles(prev => prev.filter((_, j) => j !== i))}
                              style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#111', color: '#FFF', border: 'none', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              ×
                            </button>
                          </div>
                        ))}
                        {appPortfolioFiles.length < 4 && (
                          <button onClick={() => appPortfolioRef.current?.click()}
                            style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>
                            +
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {applyError && (
                    <p style={{ color: '#E05A5A', fontSize: '13px', marginBottom: '12px' }}>{applyError}</p>
                  )}
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: applying ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: applying ? 'not-allowed' : 'pointer', marginBottom: '8px' }}
                  >
                    {applying ? 'Envoi...' : 'Envoyer ma candidature'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                </div>
              ) : (() => {
                const full = (event.stand_count ?? 0) > 0 && acceptedCount !== null && acceptedCount >= (event.stand_count ?? 0)
                if (full) {
                  return onWaitlist ? (
                    <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FFF7ED', border: '1px solid #FCD34D', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#B45309', margin: '0 0 4px' }}>
                        Vous êtes en liste d'attente
                      </p>
                      <p style={{ fontSize: '12px', color: '#92400E', margin: '0 0 12px' }}>
                        Vous serez notifié si une place se libère
                      </p>
                      <button
                        onClick={handleLeaveWaitlist}
                        disabled={joiningWaitlist}
                        style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #FCD34D', backgroundColor: 'var(--bg-primary)', color: '#B45309', fontSize: '13px', fontWeight: '600', cursor: joiningWaitlist ? 'wait' : 'pointer', opacity: joiningWaitlist ? 0.6 : 1 }}
                      >
                        {joiningWaitlist ? 'Traitement…' : 'Se retirer de la liste'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B', margin: '0 0 4px' }}>
                        Événement complet
                      </p>
                      <p style={{ fontSize: '12px', color: '#7F1D1D', margin: '0 0 12px' }}>
                        Rejoignez la liste d'attente pour être prévenu si une place se libère
                      </p>
                      <button
                        onClick={handleJoinWaitlist}
                        disabled={joiningWaitlist}
                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: joiningWaitlist ? 'wait' : 'pointer', opacity: joiningWaitlist ? 0.6 : 1 }}
                      >
                        {joiningWaitlist ? 'Traitement…' : "Rejoindre la liste d'attente"}
                      </button>
                    </div>
                  )
                }
                return (
                  <button
                    onClick={() => setShowForm(true)}
                    style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 300ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5B5BD6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    Je m'inscris
                  </button>
                )
              })()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
