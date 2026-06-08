'use client'

import { ToastProvider } from '@/components/ui/toast-provider'
import { ConfirmProvider } from '@/components/ui/confirm-modal'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ToastProvider>
  )
}
