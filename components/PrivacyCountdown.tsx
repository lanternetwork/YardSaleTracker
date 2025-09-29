'use client'

import { useState, useEffect } from 'react'
import { formatRevealTimeRemaining, shouldMask, type PrivacySale } from '@/lib/sales/privacy'

interface PrivacyCountdownProps {
  sale: PrivacySale
  className?: string
}

export default function PrivacyCountdown({ sale, className = '' }: PrivacyCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (sale.privacy_mode !== 'block_until_24h') {
      setIsRevealed(true)
      return
    }

    const updateCountdown = () => {
      const remaining = formatRevealTimeRemaining(sale)
      const masked = shouldMask(sale)
      
      setTimeRemaining(remaining)
      setIsRevealed(!masked)
    }

    // Update immediately
    updateCountdown()

    // Update every minute
    const interval = setInterval(updateCountdown, 60000)

    return () => clearInterval(interval)
  }, [sale])

  if (sale.privacy_mode !== 'block_until_24h') {
    return null
  }

  if (isRevealed) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        Exact location
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ${className}`}>
      <span className="w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
      Reveals in {timeRemaining}
    </div>
  )
}