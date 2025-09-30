'use client'

import { useState } from 'react'
import { useLocation } from '@/lib/location/useLocation'
import { formatLocation } from '@/lib/location/client'

interface UseLocationButtonProps {
  onLocationUpdate?: (location: { lat: number; lng: number }) => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function UseLocationButton({ 
  onLocationUpdate, 
  className = '',
  variant = 'primary',
  size = 'md'
}: UseLocationButtonProps) {
  const { location, loading, error, getLocation, requestPermission, clearError } = useLocation()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    clearError()
    
    try {
      await getLocation()
      if (location) {
        onLocationUpdate?.(location)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } catch (err) {
      console.error('Location error:', err)
    }
  }

  const handleRequestPermission = async () => {
    clearError()
    
    try {
      const granted = await requestPermission()
      if (granted && location) {
        onLocationUpdate?.(location)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } catch (err) {
      console.error('Permission error:', err)
    }
  }

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
    }
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  const getIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )
    }
    
    if (showSuccess) {
      return (
        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }

  const getButtonText = () => {
    if (loading) return 'Getting location...'
    if (showSuccess) return 'Location found!'
    if (error?.code === 'PERMISSION_DENIED') return 'Enable location access'
    return 'Use my location'
  }

  if (error?.code === 'PERMISSION_DENIED') {
    return (
      <button
        onClick={handleRequestPermission}
        className={getButtonClasses()}
        disabled={loading}
      >
        {getIcon()}
        {getButtonText()}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        className={getButtonClasses()}
        disabled={loading}
      >
        {getIcon()}
        {getButtonText()}
      </button>
      
      {location && (
        <p className="text-xs text-gray-600">
          📍 {formatLocation(location)}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">
          {error.message}
        </p>
      )}
    </div>
  )
}
