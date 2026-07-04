'use client'

import { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/toast-provider'
import { ConfirmProvider } from '@/components/ui/confirm-modal'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ToastProvider>
  )
}
