'use client'
import { useState, useEffect } from 'react'
import { getRevealCountdown } from '@/lib/privacy'

interface PrivacyCountdownProps {
  revealTime: string
  className?: string
}

export default function PrivacyCountdown({ revealTime, className = '' }: PrivacyCountdownProps) {
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getRevealCountdown(revealTime))
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [revealTime])

  if (countdown === 'Revealed') {
    return null
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <div className="text-blue-600 mr-2">🔒</div>
        <div>
          <div className="font-medium text-blue-800">Privacy Mode Active</div>
          <div className="text-sm text-blue-600">
            {countdown}
          </div>
        </div>
      </div>
    </div>
  )
}
