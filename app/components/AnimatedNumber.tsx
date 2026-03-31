'use client'

import { useEffect, useState } from 'react'

export default function AnimatedNumber({ value, duration = 800, decimals = 1, suffix = '' }: {
  value: number | null
  duration?: number
  decimals?: number
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === null) return
    const start = performance.now()
    const from = 0
    const to = value

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  if (value === null) return <span className="text-slate-600">N/A</span>
  return <span>{display.toFixed(decimals)}{suffix}</span>
}
