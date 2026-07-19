'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmVariant = 'danger' | 'warning' | 'default'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

// ─── Config ───────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ConfirmVariant, {
  iconBg: string; iconColor: string; icon: React.ReactNode
  btnBg: string; btnHover: string; btnColor: string
}> = {
  danger: {
    iconBg: '#FEF2F2', iconColor: '#DC2626',
    icon: <Trash2 size={22} />,
    btnBg: '#DC2626', btnHover: '#B91C1C', btnColor: '#FFFFFF',
  },
  warning: {
    iconBg: '#FFFBEB', iconColor: '#D97706',
    icon: <AlertTriangle size={22} />,
    btnBg: '#D97706', btnHover: '#B45309', btnColor: '#FFFFFF',
  },
  default: {
    iconBg: '#EEF2FF', iconColor: '#6366F1',
    icon: <Info size={22} />,
    btnBg: '#6366F1', btnHover: '#5B5BD6', btnColor: '#FFFFFF',
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)
  const resolveRef = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({ ...options, resolve })
    })
  }, [])

  const handleClose = (value: boolean) => {
    resolveRef.current?.(value)
    resolveRef.current = null
    setState(null)
  }

  const variant = state?.variant ?? 'default'
  const vs = VARIANT_STYLES[variant]
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape closes modal
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap: keep focus inside modal while open
  useEffect(() => {
    if (!state || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus() } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus() } }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [state])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {state && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(false)}
              style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 10000,
                backdropFilter: 'blur(2px)',
              }}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-modal-title"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10001,
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '20px',
                padding: '32px',
                width: 'min(420px, 90vw)',
                maxWidth: 'calc(100vw - 32px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              }}
            >
              {/* Close */}
              <button
                onClick={() => handleClose(false)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: '4px',
                }}
              >
                <X size={18} />
              </button>

              {/* Icon */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                backgroundColor: vs.iconBg, color: vs.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                {vs.icon}
              </div>

              {/* Title */}
              <h3 id="confirm-modal-title" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {state.title}
              </h3>

              {/* Description */}
              {state.description && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '28px' }}>
                  {state.description}
                </p>
              )}
              {!state.description && <div style={{ marginBottom: '28px' }} />}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleClose(false)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
                    fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', transition: 'background-color 200ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}
                >
                  {state.cancelLabel ?? 'Annuler'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  style={{
                    flex: 1, padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: vs.btnBg, color: vs.btnColor,
                    fontSize: '14px', fontWeight: '600',
                    cursor: 'pointer', transition: 'background-color 200ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = vs.btnHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = vs.btnBg }}
                >
                  {state.confirmLabel ?? 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
