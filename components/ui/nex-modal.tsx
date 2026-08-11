'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export type NexModalSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_WIDTHS: Record<NexModalSize, string> = {
  sm: 'min(400px, 90vw)',
  md: 'min(520px, 90vw)',
  lg: 'min(680px, 92vw)',
  xl: 'min(860px, 94vw)',
}

interface NexModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Optional subtitle shown below the title */
  subtitle?: string
  /** Modal width preset (default: 'md') */
  size?: NexModalSize
  /** Override scrollable max height of the content area (default: '70vh') */
  maxContentHeight?: string
  /** Disable backdrop click to close (default: false) */
  disableBackdropClose?: boolean
  children: React.ReactNode
  /** Optional footer rendered below the content (action buttons, etc.) */
  footer?: React.ReactNode
  /** aria-labelledby id override (auto-generated if omitted) */
  labelId?: string
}

let _uid = 0

export function NexModal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  maxContentHeight = '70vh',
  disableBackdropClose = false,
  children,
  footer,
  labelId,
}: NexModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = labelId ?? `nex-modal-title-${++_uid}`

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [isOpen])

  // Prevent body scroll while open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="nex-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={disableBackdropClose ? undefined : onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 10000,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Dialog */}
          <motion.div
            key="nex-modal-dialog"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.93, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 14 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '20px',
              width: SIZE_WIDTHS[size],
              maxWidth: 'calc(100vw - 24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '24px 24px 0',
              flexShrink: 0,
            }}>
              <div>
                <h2
                  id={titleId}
                  style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: '2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '6px', flexShrink: 0, marginLeft: '12px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '16px 0 0', flexShrink: 0 }} />

            {/* Scrollable content */}
            <div style={{
              padding: '20px 24px',
              overflowY: 'auto',
              maxHeight: maxContentHeight,
              flex: 1,
            }}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', flexShrink: 0 }} />
                <div style={{ padding: '16px 24px', flexShrink: 0 }}>
                  {footer}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
