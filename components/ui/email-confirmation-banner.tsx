'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MailWarning, X } from 'lucide-react'

export function EmailConfirmationBanner() {
  const [show, setShow] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !user.email_confirmed_at) setShow(true)
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user && !session.user.email_confirmed_at) setShow(true)
      else setShow(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const resend = async () => {
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      await supabase.auth.resend({ type: 'signup', email: user.email })
      setSent(true)
    }
    setSending(false)
  }

  if (!show) return null

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-sm z-40">
      <div className="flex items-center gap-2 text-amber-800">
        <MailWarning size={16} className="shrink-0" />
        <span>
          Confirmez votre adresse email pour accéder à toutes les fonctionnalités.{' '}
          {sent ? (
            <span className="font-semibold text-green-700">Email envoyé ✓</span>
          ) : (
            <button
              onClick={resend}
              disabled={sending}
              className="font-semibold underline underline-offset-2 hover:text-amber-900 disabled:opacity-50"
            >
              {sending ? 'Envoi…' : 'Renvoyer l\'email'}
            </button>
          )}
        </span>
      </div>
      <button onClick={() => setShow(false)} className="text-amber-600 hover:text-amber-800 shrink-0">
        <X size={15} />
      </button>
    </div>
  )
}
