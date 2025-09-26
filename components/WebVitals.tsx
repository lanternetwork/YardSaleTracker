'use client'
import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export default function WebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically
    import('web-vitals').then((vitals) => {
      // Use the default export which contains all the functions
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = vitals
      if (getCLS) getCLS(analytics.trackWebVitals)
      if (getFID) getFID(analytics.trackWebVitals)
      if (getFCP) getFCP(analytics.trackWebVitals)
      if (getLCP) getLCP(analytics.trackWebVitals)
      if (getTTFB) getTTFB(analytics.trackWebVitals)
    }).catch((error) => {
      console.error('Error loading web-vitals:', error)
    })
  }, [])

  return null
}
