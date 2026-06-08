'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  success: {
    bg: '#F0FDF4',
    border: '#86EFAC',
    color: '#15803D',
    icon: <CheckCircle size={18} />,
  },
  error: {
    bg: '#FEF2F2',
    border: '#FCA5A5',
    color: '#DC2626',
    icon: <XCircle size={18} />,
  },
  info: {
    bg: '#EEF2FF',
    border: '#A5B4FC',
    color: '#4338CA',
    icon: <Info size={18} />,
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FCD34D',
    color: '#D97706',
    icon: <AlertTriangle size={18} />,
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const remove = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => {
      const next = [...prev, { id, type, message, duration }]
      return next.length > 5 ? next.slice(next.length - 5) : next
    })
    timers.current[id] = setTimeout(() => remove(id), duration)
  }, [remove])

  const success = useCallback((message: string) => toast(message, 'success'), [toast])
  const error   = useCallback((message: string) => toast(message, 'error'), [toast])
  const info    = useCallback((message: string) => toast(message, 'info'), [toast])
  const warning = useCallback((message: string) => toast(message, 'warning'), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = TOAST_STYLES[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: s.bg,
                  border: `1px solid ${s.border}`,
                  color: s.color,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  pointerEvents: 'all',
                  cursor: 'default',
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '1.5',
                }}
              >
                <span style={{ flexShrink: 0, marginTop: '1px' }}>{s.icon}</span>
                <span style={{ flex: 1 }}>{t.message}</span>
                <button
                  onClick={() => remove(t.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    color: s.color,
                    opacity: 0.6,
                    flexShrink: 0,
                    marginTop: '1px',
                  }}
                >
                  <X size={15} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
