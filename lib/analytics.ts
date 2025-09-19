'use client'

export interface WebVitalsMetric {
  name: string
  value: number
  delta: number
  id: string
  navigationType: string
}

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  // Track custom events
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    }

    if (this.isDevelopment) {
      console.log('Analytics Event:', analyticsEvent)
    }

    if (this.isProduction) {
      // Send to analytics service (Plausible, PostHog, etc.)
      this.sendToAnalytics(analyticsEvent)
    }
  }

  // Track Web Vitals
  trackWebVitals(metric: WebVitalsMetric) {
    if (this.isDevelopment) {
      console.log('Web Vital:', metric)
    }

    if (this.isProduction) {
      // Send to analytics service
      this.sendToAnalytics({
        event: 'web_vital',
        properties: {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_delta: metric.delta,
          metric_id: metric.id,
          navigation_type: metric.navigationType
        }
      })
    }
  }

  // Track user actions
  trackSearch(query: string, filters?: Record<string, any>) {
    this.track('search', {
      query,
      filters,
      timestamp: Date.now()
    })
  }

  trackAddSale(saleId: string, title: string) {
    this.track('add_sale', {
      sale_id: saleId,
      title,
      timestamp: Date.now()
    })
  }

  trackFavorite(saleId: string, action: 'add' | 'remove') {
    this.track('favorite', {
      sale_id: saleId,
      action,
      timestamp: Date.now()
    })
  }

  trackImport(source: string, count: number) {
    this.track('import', {
      source,
      count,
      timestamp: Date.now()
    })
  }

  trackReview(saleId: string, rating: number) {
    this.track('review', {
      sale_id: saleId,
      rating,
      timestamp: Date.now()
    })
  }

  trackShare(saleId: string, method: string) {
    this.track('share', {
      sale_id: saleId,
      method,
      timestamp: Date.now()
    })
  }

  trackPushNotification(action: 'subscribe' | 'unsubscribe' | 'test') {
    this.track('push_notification', {
      action,
      timestamp: Date.now()
    })
  }

  // Private method to send to analytics service
  private sendToAnalytics(event: AnalyticsEvent) {
    // In production, this would send to your analytics service
    // For now, we'll just log it
    console.log('Sending to analytics:', event)
    
    // Example for Plausible:
    // if (window.plausible) {
    //   window.plausible(event.event, { props: event.properties })
    // }
    
    // Example for PostHog:
    // if (window.posthog) {
    //   window.posthog.capture(event.event, event.properties)
    // }
  }
}

export const analytics = new Analytics()
