'use client'

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private registration: ServiceWorkerRegistration | null = null

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers')
    }

    if (!('PushManager' in window)) {
      throw new Error('This browser does not support push messages')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    try {
      const permission = await this.requestPermission()
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      this.registration = await navigator.serviceWorker.ready
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      return {
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      throw error
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready
      }

      const subscription = await this.registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.ready
      }

      const subscription = await this.registration.pushManager.getSubscription()
      return !!subscription
    } catch (error) {
      console.error('Error checking subscription status:', error)
      return false
    }
  }

  async saveSubscription(subscriptionData: PushSubscriptionData): Promise<void> {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save subscription')
    }
  }

  async removeSubscription(endpoint: string): Promise<void> {
    const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove subscription')
    }
  }

  async testNotification(): Promise<void> {
    const response = await fetch('/api/push/test', {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send test notification')
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}
