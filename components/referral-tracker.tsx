'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralTracker() {
  const params = useSearchParams()
  useEffect(() => {
    const ref = params?.get('ref')
    if (ref && ref.length >= 6) {
      localStorage.setItem('nexart_ref', ref.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
