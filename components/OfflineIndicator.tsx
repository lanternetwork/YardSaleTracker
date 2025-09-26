'use client'
import { useEffect, useState } from 'react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Check initial state
    setIsOffline(!navigator.onLine)

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
        <div>
          <div className="text-orange-800 font-medium">You're offline</div>
          <div className="text-orange-600 text-sm">
            Some features may not work properly. Check your internet connection.
          </div>
        </div>
      </div>
    </div>
  )
}