/**
 * Analytics events for location and user interactions
 * Minimal, anonymous tracking with no PII
 */

export interface CenterSourceEvent {
  source: 'url' | 'cookie' | 'account' | 'ip' | 'fallback'
}

export interface CenterCorrectionEvent {
  from: string
  to: 'zip' | 'device' | 'url' | 'cookie'
}

/**
 * Track center source on first paint
 */
export function trackCenterSource(event: CenterSourceEvent) {
  if (typeof window === 'undefined') return
  
  // Use gtag if available (Google Analytics)
  if ((window as any).gtag) {
    (window as any).gtag('event', 'center_source', {
      source: event.source
    })
  }
  
  // Fallback to console for debugging
  console.log('Analytics: center_source', event)
}

/**
 * Track center correction when user changes location
 */
export function trackCenterCorrection(event: CenterCorrectionEvent) {
  if (typeof window === 'undefined') return
  
  // Use gtag if available (Google Analytics)
  if ((window as any).gtag) {
    (window as any).gtag('event', 'center_correction', {
      from: event.from,
      to: event.to
    })
  }
  
  // Fallback to console for debugging
  console.log('Analytics: center_correction', event)
}
