'use client'
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('web-vitals').then((mod: any) => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = mod as any
      if (typeof onCLS === 'function') onCLS(analytics.trackWebVitals)
      if (typeof onFID === 'function') onFID(analytics.trackWebVitals)
      if (typeof onFCP === 'function') onFCP(analytics.trackWebVitals)
      if (typeof onLCP === 'function') onLCP(analytics.trackWebVitals)
      if (typeof onTTFB === 'function') onTTFB(analytics.trackWebVitals)
      if (typeof onINP === 'function') onINP(analytics.trackWebVitals)
    }).catch((error) => {
      console.error('Error loading web-vitals:', error)
    })
  }, [])

  return null
}
