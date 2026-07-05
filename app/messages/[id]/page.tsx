'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { ArrowLeft, Send, Pencil, Trash2, Check, X, CheckCheck, Paperclip, ImageIcon, FileText, Download, FileSearch } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
  updated_at?: string | null
  attachment_url?: string | null
  attachment_type?: string | null
  attachment_name?: string | null
}

type OtherProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role?: string | null
}

type PendingFile = {
  file: File
  preview: string | null
  type: 'image' | 'file'
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 16px', backgroundColor: '#F3F4F6', borderRadius: '18px 18px 18px 4px', width: 'fit-content' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#9CA3AF',
          animation: 'typingBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`, display: 'block',
        }} />
      ))}
    </div>
  )
}

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="image"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          borderRadius: '12px', objectFit: 'contain',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: '50%', width: '40px', height: '40px',
          color: '#fff', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >×</button>
    </div>
  )
}

function AttachmentPreview({ url, type, name, isMine }: { url: string; type: string | null; name: string | null; isMine: boolean }) {
  const [lightbox, setLightbox] = useState(false)
  const isImage = type === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)
  if (isImage) {
    return (
      <>
        {lightbox && <ImageLightbox url={url} onClose={() => setLightbox(false)} />}
        <div
          onClick={() => setLightbox(true)}
          style={{ display: 'block', marginBottom: '6px', borderRadius: '12px', overflow: 'hidden', maxWidth: '260px', cursor: 'zoom-in' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={name ?? 'image'} style={{ width: '100%', display: 'block', maxHeight: '200px', objectFit: 'cover' }} />
        </div>
      </>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" download={name ?? true}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '12px', marginBottom: '6px',
        backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : '#E5E7EB',
        textDecoration: 'none',
        color: isMine ? '#FFF' : '#374151',
      }}
    >
      <FileText size={20} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '13px', fontWeight: '600', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name ?? 'Fichier'}</span>
      <Download size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
    </a>
  )
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<Message[]>([])
  const [other, setOther] = useState<OtherProfile | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const broadcastRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollBottom = (instant = false) => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' }), 50)
  }

  const loadConversation = useCallback(async (userId: string) => {
    const { data: conv } = await supabase
      .from('conversations')
      .select('creator_id, organizer_id')
      .eq('id', id)
      .maybeSingle()

    if (!conv) { router.push('/messages'); return }

    const otherId = conv.creator_id === userId ? conv.organizer_id : conv.creator_id

    const [{ data: profile }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url, role').eq('id', otherId).maybeSingle(),
      supabase.from('messages')
        .select('id, sender_id, content, created_at, read_at, updated_at, attachment_url, attachment_type, attachment_name')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true }),
    ])

    setOther(profile ?? { id: otherId, full_name: null, avatar_url: null })
    setMessages((msgs ?? []) as Message[])
    setLoading(false)
    scrollBottom(true)

    // Mark messages and notifications as read
    const unreadIds = (msgs ?? []).filter(m => !m.read_at && m.sender_id !== userId).map(m => m.id)
    if (unreadIds.length) {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
    }
    // Mark new_message notifications for this conversation as read
    supabase.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('type', 'new_message')
      .like('link', `/messages/${id}%`)
      .is('read_at', null)
      .then(() => {})
  }, [id, router])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      loadConversation(session.user.id)
    })
  }, [router, loadConversation])

  // Realtime: postgres_changes
  useEffect(() => {
    const uid = userId ?? user?.id
    if (!uid) return
    const channel = supabase
      .channel(`conv:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, async (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id === uid) return
        setMessages(prev => [...prev, msg])
        scrollBottom()
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id
          ? { ...m, content: updated.content, updated_at: updated.updated_at, read_at: updated.read_at }
          : m
        ))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, user, userId])

  // Realtime: typing indicator
  useEffect(() => {
    const uid = userId ?? user?.id
    if (!uid) return
    const channel = supabase
      .channel(`typing:${id}`)
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: { user_id: string } }) => {
        if (payload.user_id !== uid) {
          setOtherTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000)
        }
      })
      .subscribe()
    broadcastRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [id, user, userId])

  const broadcastTyping = () => {
    if (!user || !broadcastRef.current) return
    broadcastRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user.id } })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { alert('Fichier trop volumineux (max 20 Mo)'); return }
    const isImage = file.type.startsWith('image/')
    const preview = isImage ? URL.createObjectURL(file) : null
    setPendingFile({ file, preview, type: isImage ? 'image' : 'file' })
    e.target.value = ''
  }

  const removePendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview)
    setPendingFile(null)
  }

  const send = async () => {
    if ((!text.trim() && !pendingFile) || !user || sending) return
    setSending(true)
    setUploading(!!pendingFile)

    let attachment_url: string | null = null
    let attachment_type: string | null = null
    let attachment_name: string | null = null

    if (pendingFile) {
      const ext = pendingFile.file.name.split('.').pop()
      const path = `${id}/${Date.now()}.${ext}`
      const { data: uploaded, error: uploadErr } = await supabase.storage
        .from('message-attachments')
        .upload(path, pendingFile.file, { upsert: false })

      if (!uploadErr && uploaded) {
        const { data: { publicUrl } } = supabase.storage.from('message-attachments').getPublicUrl(uploaded.path)
        attachment_url = publicUrl
        attachment_type = pendingFile.type
        attachment_name = pendingFile.file.name
      }
      removePendingFile()
    }

    setUploading(false)
    const content = text.trim()
    setText('')

    const { data: newMsg } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, content, attachment_url, attachment_type, attachment_name })
      .select('id, sender_id, content, created_at, read_at, updated_at, attachment_url, attachment_type, attachment_name')
      .single()

    if (newMsg) {
      setMessages(prev => [...prev, newMsg as Message])
      scrollBottom()
      // Notif email au destinataire (fire-and-forget)
      fetch('/api/message-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: id, sender_id: user.id, content }),
      }).catch(() => {})
    }
    setSending(false)
  }

  const startEdit = (m: Message) => {
    setEditingId(m.id)
    setEditText(m.content)
    setTimeout(() => { editRef.current?.focus(); editRef.current?.select() }, 50)
  }

  const cancelEdit = () => { setEditingId(null); setEditText('') }

  const saveEdit = async (msgId: string) => {
    if (!editText.trim()) return
    const content = editText.trim()
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, updated_at: new Date().toISOString() } : m))
    setEditingId(null)
    await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', msgId)
  }

  const deleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
    await supabase.from('messages').delete().eq('id', msgId)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const handleEditKey = (e: React.KeyboardEvent, msgId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(msgId) }
    if (e.key === 'Escape') cancelEdit()
  }

  const grouped: { day: string; msgs: Message[] }[] = []
  for (const m of messages) {
    const day = formatDay(m.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.day === day) last.msgs.push(m)
    else grouped.push({ day, msgs: [m] })
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const canSend = (text.trim() || pendingFile) && !sending && !uploading

  return (
    <div style={{ position: 'fixed', top: '58px', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', backgroundColor: '#FFFFFF', zIndex: 10 }}>
      <style>{`
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
        <Link href="/messages" style={{ display: 'flex', alignItems: 'center', color: '#6366F1', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6366F1', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {other?.avatar_url ? (
            <Image src={other.avatar_url} alt="" fill style={{ objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#FFF', fontSize: '16px', fontWeight: '700' }}>{(other?.full_name ?? '?')[0].toUpperCase()}</span>
          )}
        </div>
        <div>
          <Link
            href={other?.role === 'creator' ? `/creators/${other.id}` : '#'}
            style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: 0, textDecoration: 'none' }}
            onClick={e => { if (other?.role !== 'creator') e.preventDefault() }}
          >
            {other?.full_name ?? 'Utilisateur'}
            {other?.role === 'creator' && <span style={{ fontSize: '11px', color: '#6366F1', marginLeft: '6px', fontWeight: '500' }}>↗ Voir profil</span>}
          </Link>
          {otherTyping && <p style={{ fontSize: '12px', color: '#6366F1', margin: 0, fontStyle: 'italic' }}>En train d'écrire…</p>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '14px', marginTop: '40px' }}>Démarrez la conversation 👋</p>
        )}

        {grouped.map(({ day, msgs: dayMsgs }) => (
          <div key={day}>
            <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
              <span style={{ fontSize: '12px', color: '#9CA3AF', backgroundColor: '#F3F4F6', padding: '4px 12px', borderRadius: '9999px' }}>{day}</span>
            </div>
            {dayMsgs.map((m, i) => {
              const isMine = m.sender_id === user?.id
              const prevSame = i > 0 && dayMsgs[i - 1].sender_id === m.sender_id
              const isHovered = hoveredId === m.id
              const isEditing = editingId === m.id
              const isRead = isMine && m.read_at != null

              return (
                <div
                  key={m.id}
                  style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: prevSame ? '2px' : '10px', position: 'relative' }}
                  onMouseEnter={() => setHoveredId(m.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Edit/Delete buttons */}
                  {isMine && isHovered && !isEditing && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '8px', alignSelf: 'center' }}>
                      <button onClick={() => startEdit(m)} title="Modifier"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E0E0FA'; e.currentTarget.style.color = '#6366F1' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteMessage(m.id)} title="Supprimer"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', backgroundColor: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#E05A5A' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#6B7280' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  <div style={{ maxWidth: 'min(72%, 480px)' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <textarea
                          ref={editRef}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => handleEditKey(e, m.id)}
                          rows={1}
                          style={{ padding: '10px 14px', borderRadius: '18px 18px 4px 18px', border: '2px solid #6366F1', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: '1.5', minWidth: '200px', backgroundColor: '#F0F0FF' }}
                          onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }}
                        />
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button onClick={cancelEdit} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#6B7280', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                            <X size={12} /> Annuler
                          </button>
                          <button onClick={() => saveEdit(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                            <Check size={12} /> Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Attachment */}
                        {m.attachment_url && (
                          <AttachmentPreview url={m.attachment_url} type={m.attachment_type ?? null} name={m.attachment_name ?? null} isMine={isMine} />
                        )}
                        {/* Text bubble (only if there's text content) */}
                        {m.content && (() => {
                          const isDevis = m.content.startsWith('[Demande de devis]')
                          const devisText = isDevis ? m.content.replace('[Demande de devis]\n', '').replace('[Demande de devis]', '').trim() : null
                          if (isDevis) return (
                            <div style={{
                              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              border: '1.5px solid #A5B4FC',
                              backgroundColor: isMine ? '#4338CA' : '#EEF2FF',
                              overflow: 'hidden', wordBreak: 'break-word',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 14px 6px', borderBottom: '1px solid', borderColor: isMine ? 'rgba(165,180,252,0.3)' : '#C7D2FE' }}>
                                <FileSearch size={13} color={isMine ? '#A5B4FC' : '#6366F1'} />
                                <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', color: isMine ? '#A5B4FC' : '#6366F1' }}>Demande de devis</span>
                              </div>
                              {devisText && (
                                <p style={{ margin: 0, padding: '8px 14px 10px', fontSize: '14px', lineHeight: '1.5', color: isMine ? '#E0E7FF' : '#1e1b4b' }}>{devisText}</p>
                              )}
                            </div>
                          )
                          return (
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              backgroundColor: isMine ? '#6366F1' : '#F3F4F6',
                              color: isMine ? '#FFFFFF' : '#1A1A1A',
                              fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word',
                            }}>
                              <p style={{ margin: 0 }}>{m.content}</p>
                            </div>
                          )
                        })()}
                        {/* Meta: time + read receipt */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMine ? 'flex-end' : 'flex-start', gap: '4px', marginTop: '3px', paddingRight: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {formatTime(m.created_at)}
                            {m.updated_at && m.updated_at !== m.created_at && ' · modifié'}
                          </span>
                          {isMine && (
                            isRead
                              ? <CheckCheck size={13} color="#6366F1" />
                              : <Check size={13} color="#9CA3AF" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {otherTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
            <TypingDots />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {pendingFile && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #F3F4F6', backgroundColor: '#F9FAFB', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', maxWidth: '320px' }}>
            {pendingFile.type === 'image' && pendingFile.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pendingFile.preview} alt="" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={22} color="#6366F1" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.file.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>{formatBytes(pendingFile.file.size)}</p>
            </div>
            <button onClick={removePendingFile} style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', backgroundColor: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid #F3F4F6', backgroundColor: '#FFFFFF', flexShrink: 0, display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        {/* File attach button */}
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={handleFileSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Joindre un fichier"
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: 'none', flexShrink: 0,
            backgroundColor: pendingFile ? '#EEF2FF' : '#F3F4F6',
            color: pendingFile ? '#6366F1' : '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 200ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EEF2FF'; e.currentTarget.style.color = '#6366F1' }}
          onMouseLeave={e => { if (!pendingFile) { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#9CA3AF' } }}
        >
          {pendingFile ? <ImageIcon size={16} /> : <Paperclip size={16} />}
        </button>

        <textarea
          value={text}
          onChange={e => { setText(e.target.value); broadcastTyping() }}
          onKeyDown={handleKey}
          placeholder={pendingFile ? 'Ajouter un message… (optionnel)' : 'Écrivez un message…'}
          rows={1}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #E5E7EB',
            fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none',
            backgroundColor: '#F9FAFB', lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto',
          }}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
          }}
        />

        <button
          onClick={send}
          disabled={!canSend}
          style={{
            width: '44px', height: '44px', borderRadius: '50%', border: 'none', flexShrink: 0,
            backgroundColor: canSend ? '#6366F1' : '#E5E7EB',
            color: canSend ? '#FFFFFF' : '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all 200ms ease',
          }}
        >
          {uploading
            ? <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            : <Send size={18} />
          }
        </button>
      </div>
      </div>
    </div>
  )
}
