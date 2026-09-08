'use client'

import { useEvent, useApplication, useFavorites } from '@/lib/hooks'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Calendar, MapPin, Users, Euro, Tag, Clock, ChevronRight, Heart, AlertTriangle, FileText, Send, Download } from 'lucide-react'
import { trackApplicationSubmit } from '@/lib/analytics'
import { useToast } from '@/components/ui/toast-provider'
import { ShareButtons } from '@/components/ui/share-buttons'
import { ReportButton } from '@/components/ui/report-button'
import StandPlanViewer from '@/components/ui/stand-plan-viewer'
import { NexModal } from '@/components/ui/nex-modal'
import { colors } from '@/lib/design-tokens'

interface Props {
  id: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  seasonal: 'Saisonnier',
  popup: 'Pop-up',
  salon: 'Salon',
  fair: 'Foire',
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: colors.feedback.warning.solid, bg: colors.feedback.warning.bg },
  accepted: { label: 'Acceptée ✓', color: colors.feedback.success.solid, bg: colors.feedback.success.bg },
  refused: { label: 'Refusée', color: colors.feedback.danger.solid, bg: colors.red.bg },
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
                {s.creator_id && <span style={{ fontSize: '11px', color: colors.violet.primary, fontWeight: '600' }}>Assigné</span>}
                <button onClick={() => deleteStand(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.feedback.danger.solid, fontSize: '16px' }}>×</button>
              </div>
            ))}
            {stands.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>Aucun stand créé</p>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={newNum} onChange={e => setNewNum(e.target.value)} placeholder="N°" style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }} />
            <input value={newDim} onChange={e => setNewDim(e.target.value)} placeholder="Dimensions (ex: 3m×2m)" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }} />
            <button onClick={addStand} disabled={saving || !newNum.trim()} style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
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
              <span style={{ fontSize: '20px', color: colors.violet.primary, flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 150ms' }}>+</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 20px 16px', fontSize: '14px', color: colors.gray.mid, lineHeight: '1.7' }}>
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
  const searchParams = useSearchParams()
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
  const [payingStand, setPayingStand] = useState(false)
  const [onWaitlist, setOnWaitlist] = useState(false)
  const [joiningWaitlist, setJoiningWaitlist] = useState(false)
  const [selectedPortfolioUrls, setSelectedPortfolioUrls] = useState<string[]>([])
  const [creatorPortfolioImages, setCreatorPortfolioImages] = useState<string[]>([])
  const [weeklyApplicants, setWeeklyApplicants] = useState<number | null>(null)

  const REQUIRED_FIELDS_TOTAL = 6

  // Toast post-paiement stand (retour depuis Stripe Checkout)
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      toastSuccess('✅ Paiement confirmé — votre stand est réservé !')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (payment === 'cancelled') {
      toastError('Paiement annulé — vous pouvez réessayer à tout moment.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Weekly applicants for social proof
  useEffect(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .gte('created_at', weekAgo)
      .then(({ count }) => setWeeklyApplicants(count ?? 0))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Charger le contrat existant si le créateur est accepté
  useEffect(() => {
    if (!user || !(user.role === 'creator' || user.is_creator) || !application || application.status !== 'accepted') return
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
    if (!user || !(user.role === 'organizer' || user.is_organizer) || !event || event.organizer_id !== user.id) return
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
            eventId: id,
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

  const handlePayStand = async () => {
    if (!user || !application) return
    setPayingStand(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toastError('Session expirée, reconnectez-vous'); return }
      const res = await fetch('/api/stripe/stand-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ application_id: application.id }),
      })
      const data = await res.json()
      if (!res.ok) { toastError(data.error ?? 'Erreur paiement'); return }
      window.location.href = data.url
    } catch {
      toastError('Erreur lors du paiement')
    } finally {
      setPayingStand(false)
    }
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
    if (!user || !(user.role === 'creator' || user.is_creator)) {
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
        <p style={{ color: colors.feedback.danger.solid, fontSize: '16px' }}>Événement introuvable</p>
        <Link href="/events" style={{ color: colors.violet.primary, textDecoration: 'none', marginTop: '16px', display: 'block' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  const handleApply = async () => {
    await apply(message, selectedPortfolioUrls)
    trackApplicationSubmit(id, user?.id)
    setSelectedPortfolioUrls([])
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 60px)' }}>
      <style>{`
        .ev-hero { height: 440px; }
        .ev-grid { display: grid; grid-template-columns: 1fr 340px; gap: 40px; align-items: start; }
        .ev-sidebar-wrap { position: sticky; top: 80px; height: fit-content; min-width: 0; }
        .ev-grid > * { min-width: 0; }
        @media (max-width: 768px) {
          .ev-hero { height: 260px; }
          .ev-grid { grid-template-columns: 1fr; gap: 0; overflow: hidden; }
          .ev-sidebar-wrap { position: static; order: -1; width: 100%; min-width: 0; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
          .ev-sidebar-wrap > div { border-radius: 0 !important; border-left: none !important; border-right: none !important; border-top: none !important; max-width: 100%; box-sizing: border-box; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="ev-hero" style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        {event.cover_image
          ? <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} priority />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.violet.primary} 0%, ${colors.violet.hover} 100%)` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 50%, transparent 100%)' }} />

        {/* top actions */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.92)', textDecoration: 'none', fontSize: 13, fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '7px 13px', border: '1px solid rgba(255,255,255,0.18)' }}>
            <ArrowLeft size={14} /> Retour
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            {user && event?.organizer_id !== user.id && (
              <ReportButton targetId={id} targetType="event" reporterId={user.id} />
            )}
            {user && (
              <button onClick={() => toggleEventFav(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: favEventIds.has(id) ? 'rgba(239,68,68,0.75)' : 'rgba(0,0,0,0.38)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Heart size={13} fill={favEventIds.has(id) ? 'white' : 'none'} color="white" />
                {favEventIds.has(id) ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            )}
          </div>
        </div>

        {/* bottom: type badge + title + meta chips */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 24px' }}>
          {event.event_type && (
            <span style={{ display: 'inline-block', marginBottom: 10, padding: '3px 10px', borderRadius: 4, backgroundColor: colors.violet.primary, color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
          )}
          <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(22px, 4.5vw, 38px)', fontWeight: 800, color: '#ffffff', lineHeight: 1.12, letterSpacing: -0.5, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
            {event.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {event.start_date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.16)' }}>
                <Calendar size={12} />
                {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                {event.end_date && event.end_date !== event.start_date && <> → {new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</>}
              </span>
            )}
            {(event.start_time || event.end_time) && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.16)' }}>
                <Clock size={12} />
                {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
              </span>
            )}
            {event.location && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.16)' }}>
                <MapPin size={12} />
                {event.location}
              </span>
            )}
            {(event.stand_count ?? 0) > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, border: '1px solid rgba(255,255,255,0.16)' }}>
                <Users size={12} />
                {event.stand_count} stands{event.stand_dimensions ? ` · ${event.stand_dimensions}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 80px' }}>
        <div className="ev-grid">

          {/* ── MAIN CONTENT ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

            {/* Recurrence note */}
            {(event as unknown as { recurrence_type?: string }).recurrence_type && (event as unknown as { recurrence_type: string }).recurrence_type !== 'none' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '7px 14px', borderRadius: 6, backgroundColor: `${colors.purple.bgF0}`, border: `1px solid ${colors.purple.bgLight}` }}>
                <Calendar size={14} color={colors.violet.primary} />
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.violet.primary }}>
                  {({ weekly: 'Hebdomadaire', biweekly: 'Bimensuel', monthly: 'Mensuel' } as Record<string, string>)[(event as unknown as { recurrence_type: string }).recurrence_type] || ''}
                  {' · '}{(event as unknown as { recurrence_dates?: string[] }).recurrence_dates?.length ?? 0} dates au total
                </span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <section style={{ marginBottom: 36 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</p>
                <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.85, whiteSpace: 'pre-line', margin: 0 }}>
                  {event.description}
                </p>
              </section>
            )}

            {/* Disciplines */}
            {(event.discipline_tags ?? []).length > 0 && (
              <section style={{ marginBottom: 36 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Disciplines recherchées</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(event.discipline_tags ?? []).map((tag: string) => (
                    <span key={tag} style={{ padding: '5px 12px', borderRadius: 4, backgroundColor: `${colors.purple.bgF0}`, color: colors.violet.primary, fontSize: 13, fontWeight: 600, border: `1px solid ${colors.purple.bgLight}` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Rules */}
            {event.rules && (
              <section style={{ marginBottom: 36 }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Règlement</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
                  {event.rules}
                </p>
              </section>
            )}

            {/* Gallery */}
            {(event as unknown as { gallery_images?: string[] }).gallery_images?.length ? (
              <section style={{ marginBottom: 36 }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Galerie photos</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
                  {(event as unknown as { gallery_images: string[] }).gallery_images.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', borderRadius: 6, overflow: 'hidden', aspectRatio: '1', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                      <Image src={url} alt={`Photo ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* FAQ */}
            {(event as unknown as { faq?: { q: string; a: string }[] }).faq?.length ? (
              <FaqSection items={(event as unknown as { faq: { q: string; a: string }[] }).faq} />
            ) : null}

            {/* Share + Calendar */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={handleAddToCalendar} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 6, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Download size={14} /> Agenda (.ics)
              </button>
              <ShareButtons url={`/events/${id}`} title={event.title} description={event.description?.substring(0, 120)} />
            </div>
          </motion.div>

          {/* ── SIDEBAR ── */}
          <div className="ev-sidebar-wrap">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              style={{ border: '1px solid var(--border-color)', borderRadius: 8, backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}
            >
              {/* Stand price header */}
              {(event.stand_price ?? 0) > 0 && (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prix du stand</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: colors.violet.primary, letterSpacing: -0.5 }}>{event.stand_price}€</span>
                </div>
              )}

              {/* Occupancy bar */}
              {(event.stand_count ?? 0) > 0 && acceptedCount !== null && (() => {
                const remaining = (event.stand_count ?? 0) - acceptedCount
                const pct = Math.min(100, Math.round((acceptedCount / (event.stand_count ?? 1)) * 100))
                const full = remaining <= 0
                return (
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: full ? colors.feedback.danger.solid : 'var(--text-secondary)' }}>
                        {full ? 'Complet' : `${remaining} place${remaining > 1 ? 's' : ''} disponible${remaining > 1 ? 's' : ''}`}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{acceptedCount}/{event.stand_count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, backgroundColor: pct >= 90 ? colors.feedback.danger.solid : pct >= 60 ? colors.status.pending.dot : colors.green.primary, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Social proof */}
              {((weeklyApplicants !== null && weeklyApplicants >= 5) || (acceptedCount !== null && (event.stand_count ?? 0) > 0 && (event.stand_count ?? 0) - acceptedCount <= 5 && (event.stand_count ?? 0) - acceptedCount > 0)) && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {weeklyApplicants !== null && weeklyApplicants >= 5 && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.violet.primary }}>
                      {weeklyApplicants} créateur{weeklyApplicants > 1 ? 's' : ''} {weeklyApplicants > 1 ? 'ont' : 'a'} postulé cette semaine
                    </span>
                  )}
                  {acceptedCount !== null && (event.stand_count ?? 0) > 0 && (() => {
                    const remaining = (event.stand_count ?? 0) - acceptedCount
                    if (remaining > 0 && remaining <= 5) return (
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.feedback.danger.solid }}>
                        Plus que {remaining} place{remaining > 1 ? 's' : ''} disponible{remaining > 1 ? 's' : ''}
                      </span>
                    )
                    return null
                  })()}
                </div>
              )}

              {/* Stand plan */}
              <div style={{ padding: '0 20px' }}>
                <StandPlanViewer eventId={id} />
              </div>

              {/* CTA zone */}
              <div style={{ padding: 20 }}>

                {/* ── application / CTA states ── */}
                {application && !cancelled ? (
                  <div style={{ padding: '14px', borderRadius: 8, backgroundColor: STATUS_STYLES[application.status]?.bg || 'var(--bg-secondary)', border: `1px solid ${STATUS_STYLES[application.status]?.color || 'var(--border-color)'}` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: STATUS_STYLES[application.status]?.color || 'var(--text-secondary)', margin: '0 0 12px', textAlign: 'center' }}>
                      {STATUS_STYLES[application.status]?.label || application.status}
                    </p>
                    {application.status === 'pending' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 12 }}>
                        {[{ label: 'Envoyée', done: true }, { label: 'En révision', done: false }, { label: 'Décision', done: false }].map((step, i, arr) => (
                          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? 1 : undefined }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: step.done ? colors.feedback.warning.solid : 'var(--bg-primary)', border: `2px solid ${step.done ? colors.feedback.warning.solid : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step.done && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.bg.primary }} />}
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 600, color: step.done ? colors.feedback.warning.solid : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{step.label}</span>
                            </div>
                            {i < arr.length - 1 && <div style={{ flex: 1, height: 2, backgroundColor: 'var(--border-color)', margin: '0 4px', marginBottom: 16 }} />}
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      Candidature envoyée le {new Date(application.created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {application.status === 'pending' && (
                      <button onClick={handleCancelApplication} disabled={cancelling} style={{ marginTop: 10, padding: '8px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: cancelling ? 'wait' : 'pointer', opacity: cancelling ? 0.6 : 1, width: '100%' }}>
                        {cancelling ? 'Retrait…' : 'Retirer ma candidature'}
                      </button>
                    )}
                  {application.status === 'paid' && (
                    <div style={{ marginTop: 10, padding: '10px', borderRadius: 6, backgroundColor: colors.green.bg, border: `1px solid ${colors.green.primary}`, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: colors.green.primary, margin: 0 }}>Stand payé — réservation confirmée</p>
                    </div>
                  )}
                  {application.status === 'accepted' && user && event && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {event.stand_price && (
                        <button onClick={handlePayStand} disabled={payingStand} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 6, border: 'none', backgroundColor: colors.green.primary, color: colors.bg.primary, fontSize: 14, fontWeight: 700, cursor: payingStand ? 'wait' : 'pointer', opacity: payingStand ? 0.7 : 1, width: '100%' }}>
                          {payingStand ? 'Redirection…' : `Payer mon stand — ${event.stand_price}€`}
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {existingContract ? (
                          <>
                            <a href={existingContract.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 6, border: `1px solid ${colors.border.accent}`, backgroundColor: 'var(--bg-primary)', color: colors.violet.primary, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                              <FileText size={13} /> Voir le contrat
                            </a>
                            {existingContract.status !== 'signed' ? (
                              <button onClick={handleSignContract} disabled={contractSigning} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 6, border: 'none', backgroundColor: colors.green.primary, color: colors.bg.primary, fontSize: 12, fontWeight: 700, cursor: contractSigning ? 'wait' : 'pointer', opacity: contractSigning ? 0.7 : 1 }}>
                                {contractSigning ? 'Signature…' : 'Signer'}
                              </button>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 6, backgroundColor: colors.green.bg, color: colors.green.primary, fontSize: 12, fontWeight: 700 }}>
                                Signé le {new Date(existingContract.signed_at!).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </>
                        ) : (
                          <button onClick={() => handleGenerateContract(user.id, application.id)} disabled={contractLoading === application.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: 12, fontWeight: 700, cursor: contractLoading === application.id ? 'wait' : 'pointer', opacity: contractLoading === application.id ? 0.7 : 1 }}>
                            <FileText size={13} />
                            {contractLoading === application.id ? 'Génération…' : 'Générer le contrat PDF'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : success ? (
                <div style={{ padding: '14px', borderRadius: 8, backgroundColor: colors.feedback.success.bg, border: `1px solid ${colors.green.success}`, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: colors.feedback.success.solid, margin: 0 }}>Candidature envoyée</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>L'organisateur vous répondra bientôt</p>
                </div>
              ) : !user ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Connectez-vous pour postuler à cet événement</p>
                  <Link href="/login" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 6, backgroundColor: colors.violet.primary, color: colors.bg.primary, textDecoration: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}>
                    Se connecter
                  </Link>
                  <Link href="/register" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 6, border: `1px solid ${colors.border.accent}`, color: colors.violet.primary, textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', boxSizing: 'border-box', marginTop: 10 }}>
                    Créer un compte
                  </Link>
                </div>
              ) : (user.role === 'organizer' || user.is_organizer) && event?.organizer_id === user.id ? (
                <div>
                  <Link href={`/events/${id}/dashboard`} style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 6, backgroundColor: colors.violet.primary, color: colors.bg.primary, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box', marginBottom: 18 }}>
                    Tableau de bord
                  </Link>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Candidatures ({applications.length})</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {applications.some(a => a.status === 'accepted' || a.status === 'pending') && (
                        <button onClick={() => { setShowBulkModal(true); setBulkTemplate('custom'); setBulkMsgText(''); setBulkSubject('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 6, border: `1px solid ${colors.border.accent}`, backgroundColor: 'var(--bg-primary)', color: colors.violet.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <Send size={12} /> Message groupé
                        </button>
                      )}
                      <button onClick={() => { const link = `${window.location.origin}/events/${id}?invite=1`; navigator.clipboard.writeText(link).then(() => toastSuccess('Lien copié !')) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Inviter
                      </button>
                    </div>
                  </div>
                  <NexModal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Message groupé" subtitle={selectedCreatorIds.length > 0 ? `${selectedCreatorIds.length} créateur${selectedCreatorIds.length > 1 ? 's' : ''} sélectionné${selectedCreatorIds.length > 1 ? 's' : ''}` : `Tous les acceptés (${applications.filter(a => a.status === 'accepted').length})`} size="md"
                    footer={
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                        <button onClick={handleBulkMessage} disabled={bulkMsgSending || !bulkMsgText.trim()} style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 6, border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: 13, fontWeight: 700, cursor: bulkMsgSending || !bulkMsgText.trim() ? 'not-allowed' : 'pointer', opacity: bulkMsgSending || !bulkMsgText.trim() ? 0.6 : 1 }}>
                          <Send size={13} /> {bulkMsgSending ? 'Envoi…' : 'Envoyer'}
                        </button>
                      </div>
                    }
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Modèle</label>
                        <select value={bulkTemplate} onChange={e => handleTemplateChange(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', outline: 'none' }}>
                          {BULK_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Sujet</label>
                        <input type="text" value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} placeholder={`Message — ${event?.title || ''}`} style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Message</label>
                        <textarea value={bulkMsgText} onChange={e => setBulkMsgText(e.target.value)} placeholder="Votre message…" rows={5} style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} />
                      </div>
                    </div>
                  </NexModal>
                  {appsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: 13 }}>Chargement...</div>
                  ) : applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '18px', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Aucune candidature reçue</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {applications.map(app => (
                          <div key={app.id} style={{ borderRadius: 8, border: selectedCreatorIds.includes(app.creator_id) ? `2px solid ${colors.violet.primary}` : '1px solid var(--border-color)', padding: '12px', backgroundColor: selectedCreatorIds.includes(app.creator_id) ? `${colors.purple.bgEef}` : 'var(--bg-primary)', transition: 'border-color 0.15s, background-color 0.15s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              {(app.status === 'accepted' || app.status === 'pending') && (
                                <input type="checkbox" checked={selectedCreatorIds.includes(app.creator_id)} onChange={() => toggleCreatorSelection(app.creator_id)} style={{ width: 15, height: 15, accentColor: colors.violet.primary, cursor: 'pointer', flexShrink: 0 }} />
                              )}
                              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {app.profiles?.avatar_url ? <Image src={app.profiles.avatar_url} alt="" width={32} height={32} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : (app.profiles?.full_name?.[0] || '?')}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Link href={`/creators/${app.creator_id}`} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>{app.profiles?.full_name || 'Créateur'}</Link>
                                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>{new Date(app.created_at).toLocaleDateString('fr-FR')}</p>
                              </div>
                              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, backgroundColor: app.status === 'accepted' ? colors.green.bg : app.status === 'refused' ? colors.red.bg : colors.red.bgFbeb, color: app.status === 'accepted' ? colors.green.primary : app.status === 'refused' ? colors.feedback.danger.solid : colors.status.pending.dot }}>
                                {app.status === 'accepted' ? 'Acceptée' : app.status === 'refused' ? 'Refusée' : 'En attente'}
                              </span>
                            </div>
                            {app.message && <p style={{ fontSize: 12, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: 6, padding: '7px 10px', margin: '0 0 8px', fontStyle: 'italic' }}>"{app.message}"</p>}
                            {(app as unknown as { portfolio_images?: string[] }).portfolio_images?.length ? (
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                {(app as unknown as { portfolio_images: string[] }).portfolio_images.map((url: string, i: number) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: 46, height: 46, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                    <Image src={url} alt="" width={46} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                  </a>
                                ))}
                              </div>
                            ) : null}
                            {app.status === 'pending' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => handleUpdateStatus(app.id, 'accepted')} disabled={updatingId === app.id} style={{ flex: 1, padding: '7px', borderRadius: 5, border: 'none', backgroundColor: colors.green.primary, color: colors.bg.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updatingId === app.id ? 0.6 : 1 }}>Accepter</button>
                                <button onClick={() => handleUpdateStatus(app.id, 'refused')} disabled={updatingId === app.id} style={{ flex: 1, padding: '7px', borderRadius: 5, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: colors.feedback.danger.solid, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: updatingId === app.id ? 0.6 : 1 }}>Refuser</button>
                              </div>
                            )}
                            {app.status === 'accepted' && (
                              <button onClick={() => handleGenerateContract(app.creator_id, app.id)} disabled={contractLoading === app.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 5, border: '1px solid var(--border-color)', backgroundColor: `${colors.purple.bgEef}`, color: colors.violet.primary, fontSize: 11, fontWeight: 700, cursor: contractLoading === app.id ? 'wait' : 'pointer', opacity: contractLoading === app.id ? 0.7 : 1 }}>
                                <FileText size={11} />{contractLoading === app.id ? 'Génération…' : 'Contrat PDF'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {selectedCreatorIds.length > 0 && (
                        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCreatorIds.length} créateur{selectedCreatorIds.length > 1 ? 's' : ''} sélectionné{selectedCreatorIds.length > 1 ? 's' : ''}</span>
                            <button onClick={() => setSelectedCreatorIds([])} style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Désélectionner</button>
                          </div>
                          <button onClick={() => { setShowBulkModal(true); setBulkTemplate('custom'); setBulkMsgText(''); setBulkSubject('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 6, border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <Send size={14} /> Message groupé
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <StandsManager eventId={id} />
                </div>
              ) : (user.role === 'organizer' && !user.is_creator) || user.role === 'visitor' ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {user.role === 'visitor' ? 'Créez un compte créateur pour postuler aux événements' : 'Seuls les créateurs peuvent postuler aux événements'}
                </p>
              ) : (user.role === 'creator' || user.is_creator) && profileChecked && missingFields.length > 0 ? (
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Profil complété</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.violet.primary }}>{REQUIRED_FIELDS_TOTAL - missingFields.length}/{REQUIRED_FIELDS_TOTAL}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${((REQUIRED_FIELDS_TOTAL - missingFields.length) / REQUIRED_FIELDS_TOTAL) * 100}%`, background: `linear-gradient(90deg, ${colors.violet.primary}, ${colors.violet.hover})`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: 8, backgroundColor: colors.red.bgFbeb, border: `1px solid ${colors.yellow.bgE8}`, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <AlertTriangle size={14} color={colors.status.pending.dot} style={{ flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: colors.red.amber, margin: 0 }}>Complétez votre profil avant de postuler</p>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {missingFields.map(f => <li key={f} style={{ fontSize: 11, color: colors.red.amber, marginBottom: 2 }}>{f}</li>)}
                    </ul>
                  </div>
                  <Link href="/profile" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 6, backgroundColor: colors.violet.primary, color: colors.bg.primary, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }}>
                    Compléter mon profil
                  </Link>
                </div>
              ) : showForm ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>Message à l'organisateur (optionnel)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Présentez-vous et votre activité..." rows={4} style={{ width: '100%', padding: '11px 12px', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10, color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }} />
                  {creatorPortfolioImages.length === 0 && user && (
                    <div style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 6, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Votre portfolio est vide. <a href="/settings/profile" style={{ color: colors.violet.primary, fontWeight: 600 }}>Ajouter des photos</a></p>
                    </div>
                  )}
                  {creatorPortfolioImages.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Photos de vos créations (max 4)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                        {creatorPortfolioImages.map((url, i) => {
                          const selected = selectedPortfolioUrls.includes(url)
                          return (
                            <div key={i} onClick={() => { if (selected) setSelectedPortfolioUrls(prev => prev.filter(u => u !== url)); else if (selectedPortfolioUrls.length < 4) setSelectedPortfolioUrls(prev => [...prev, url]) }} style={{ position: 'relative', aspectRatio: '1', borderRadius: 5, overflow: 'hidden', cursor: 'pointer', border: selected ? `2px solid ${colors.violet.primary}` : '2px solid transparent', opacity: !selected && selectedPortfolioUrls.length >= 4 ? 0.4 : 1, transition: 'border-color 0.15s, opacity 0.15s' }}>
                              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              {selected && (
                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {selectedPortfolioUrls.length > 0 && <p style={{ margin: '5px 0 0', fontSize: 11, color: colors.violet.primary, fontWeight: 600 }}>{selectedPortfolioUrls.length} photo{selectedPortfolioUrls.length > 1 ? 's' : ''} sélectionnée{selectedPortfolioUrls.length > 1 ? 's' : ''}</p>}
                    </div>
                  )}
                  {applyError && <p style={{ color: colors.feedback.danger.solid, fontSize: 12, marginBottom: 10 }}>{applyError}</p>}
                  <button onClick={handleApply} disabled={applying} style={{ width: '100%', padding: '13px', borderRadius: 6, backgroundColor: applying ? colors.purple.ringAlt : colors.violet.primary, color: colors.bg.primary, fontSize: 15, fontWeight: 700, border: 'none', cursor: applying ? 'not-allowed' : 'pointer', marginBottom: 8 }}>
                    {applying ? 'Envoi...' : 'Envoyer ma candidature'}
                  </button>
                  <button onClick={() => setShowForm(false)} style={{ width: '100%', padding: '11px', borderRadius: 6, backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              ) : (() => {
                const full = (event.stand_count ?? 0) > 0 && acceptedCount !== null && acceptedCount >= (event.stand_count ?? 0)
                if (full) {
                  return onWaitlist ? (
                    <div style={{ padding: '14px', borderRadius: 8, backgroundColor: `${colors.yellow.bgFff7}`, border: `1px solid ${colors.yellow.primary}`, textAlign: 'center' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: colors.feedback.warning.text, margin: '0 0 4px' }}>Vous êtes en liste d'attente</p>
                      <p style={{ fontSize: 12, color: colors.red.amber, margin: '0 0 12px' }}>Vous serez notifié si une place se libère</p>
                      <button onClick={handleLeaveWaitlist} disabled={joiningWaitlist} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${colors.yellow.primary}`, backgroundColor: 'var(--bg-primary)', color: colors.feedback.warning.text, fontSize: 12, fontWeight: 600, cursor: joiningWaitlist ? 'wait' : 'pointer', opacity: joiningWaitlist ? 0.6 : 1 }}>
                        {joiningWaitlist ? 'Traitement…' : 'Se retirer de la liste'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '14px', borderRadius: 8, backgroundColor: colors.red.bg, border: `1px solid ${colors.red.medium}`, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: colors.red.text, margin: '0 0 4px' }}>Événement complet</p>
                      <p style={{ fontSize: 12, color: colors.gray["950"], margin: '0 0 12px' }}>Rejoignez la liste d'attente pour être prévenu si une place se libère</p>
                      <button onClick={handleJoinWaitlist} disabled={joiningWaitlist} style={{ padding: '10px 18px', borderRadius: 6, border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: 13, fontWeight: 700, cursor: joiningWaitlist ? 'wait' : 'pointer', opacity: joiningWaitlist ? 0.6 : 1 }}>
                        {joiningWaitlist ? 'Traitement…' : "Rejoindre la liste d'attente"}
                      </button>
                    </div>
                  )
                }
                return (
                  <button
                    onClick={async () => { setShowForm(true); if (user) { const { data } = await supabase.from('creator_profiles').select('portfolio_images').eq('user_id', user.id).maybeSingle(); setCreatorPortfolioImages(Array.isArray(data?.portfolio_images) ? data.portfolio_images : []) } }}
                    style={{ width: '100%', padding: '14px', borderRadius: 6, backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 200ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.violet.dark; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.violet.primary; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    Je m'inscris
                  </button>
                )
              })()}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
