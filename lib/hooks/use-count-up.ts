'use client'
import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 800, startOnMount = true) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!startOnMount || startedRef.current || target === 0) {
      if (target === 0) setValue(0)
      return
    }
    startedRef.current = true
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration, startOnMount])

  return value
}
