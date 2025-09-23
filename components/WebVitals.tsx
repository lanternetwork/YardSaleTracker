'use client'
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function WebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically
    import('web-vitals').then((mod: any) => {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = mod as any
      getCLS(analytics.trackWebVitals)
      getFID(analytics.trackWebVitals)
      getFCP(analytics.trackWebVitals)
      getLCP(analytics.trackWebVitals)
      getTTFB(analytics.trackWebVitals)
    }).catch((error) => {
      console.error('Error loading web-vitals:', error)
    })
  }, [])

  return null
}
