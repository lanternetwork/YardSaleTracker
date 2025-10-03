'use client'

import { useState } from 'react'
// Using simple text/icons instead of react-icons to avoid dependency issues

interface UseLocationButtonProps {
  onClick: () => void
  loading: boolean
  error: string | null
  className?: string
}

export default function UseLocationButton({ 
  onClick, 
  loading, 
  error, 
  className = '' 
}: UseLocationButtonProps) {
  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <button
        onClick={onClick}
        disabled={loading}
        aria-label={loading ? 'Getting your location...' : 'Use your current location'}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin mr-2">⟳</span>
            Getting Location...
          </>
        ) : (
          <>
            <span className="mr-2">📍</span>
            Use My Location
          </>
        )}
      </button>
      
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <span className="mr-1">⚠️</span>
          {error}
        </div>
      )}
    </div>
  )
}