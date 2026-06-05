'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Conversation, Message } from '@/lib/types'

interface ConvWithDetails extends Conversation {
  other_name?: string
  event_title?: string
  last_message?: string
  unread?: number
}

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const [conversations, setConversations] = useState<ConvWithDetails[]>([])
  const [selectedConv, setSelectedConv] = useState<ConvWithDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      if (!user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (profile) setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
      }
    })
  }, [router, user, setUser])

  useEffect(() => {
    if (!user) return

    const fetchConvs = async () => {
      const field = user.role === 'creator' ? 'creator_id' : 'organizer_id'
      const otherField = user.role === 'creator' ? 'organizer_id' : 'creator_id'

      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .eq(field, user.id)

      if (!convs || convs.length === 0) { setLoading(false); return }

      const enriched: ConvWithDetails[] = await Promise.all(
        convs.map(async (conv) => {
          const [{ data: other }, { data: event }, { data: lastMsg }] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', conv[otherField]).single(),
            supabase.from('events').select('title').eq('id', conv.event_id).single(),
            supabase.from('messages').select('content').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).single(),
          ])
          return {
            ...conv,
            other_name: other?.full_name || 'Inconnu',
            event_title: event?.title || '',
            last_message: lastMsg?.content || '',
          }
        })
      )
      setConversations(enriched)
      setLoading(false)
    }

    fetchConvs()
  }, [user])

  useEffect(() => {
    if (!selectedConv) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])
    }

    fetchMessages()

    const subscription = supabase
      .channel(`conversation-${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [selectedConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConv.id,
      sender_id: user.id,
      content: newMessage.trim(),
    })
    if (!error) setNewMessage('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            <ArrowLeft size={16} />
            Tableau de bord
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A' }}>Messages</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '0', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', height: '600px' }}>
          {/* Conversations list */}
          <div style={{ borderRight: '1px solid #E5E7EB', overflowY: 'auto', backgroundColor: '#FAFAFA' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#888888', margin: 0 }}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888888' }}>Chargement...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <MessageSquare size={40} color="#E5E7EB" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: '#888888' }}>Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: selectedConv?.id === conv.id ? '#F0F0FF' : '#FFFFFF',
                    transition: 'background-color 150ms ease',
                  }}
                  whileHover={{ backgroundColor: selectedConv?.id === conv.id ? '#F0F0FF' : '#F9F9F9' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                      {conv.other_name}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6366F1', marginBottom: '4px' }}>{conv.event_title}</p>
                  {conv.last_message && (
                    <p style={{ fontSize: '13px', color: '#888888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {conv.last_message}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
            {!selectedConv ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888888' }}>
                <MessageSquare size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px' }}>Sélectionnez une conversation</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>{selectedConv.other_name}</p>
                  <p style={{ fontSize: '12px', color: '#888888', margin: 0 }}>{selectedConv.event_title}</p>
                </div>

                {/* Messages list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          backgroundColor: isMe ? '#6366F1' : '#F5F5F7',
                          color: isMe ? '#FFFFFF' : '#1A1A1A',
                          fontSize: '14px',
                          lineHeight: '1.5',
                        }}>
                          {msg.content}
                          <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Votre message... (Entrée pour envoyer)"
                    rows={2}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none', transition: 'border-color 300ms ease' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: sending || !newMessage.trim() ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', border: 'none', cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer', transition: 'all 300ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
