'use client'
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function WebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically
    import('web-vitals').then((vitals) => {
      if (vitals.getCLS) vitals.getCLS(analytics.trackWebVitals)
      if (vitals.getFID) vitals.getFID(analytics.trackWebVitals)
      if (vitals.getFCP) vitals.getFCP(analytics.trackWebVitals)
      if (vitals.getLCP) vitals.getLCP(analytics.trackWebVitals)
      if (vitals.getTTFB) vitals.getTTFB(analytics.trackWebVitals)
    }).catch((error) => {
      console.error('Error loading web-vitals:', error)
    })
  }, [])

  return null
}
