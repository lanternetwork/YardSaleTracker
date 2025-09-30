'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sale } from '@/lib/data'

interface FavoritesClientProps {
  initialFavorites: Sale[]
  user: any
}

export default function FavoritesClient({ initialFavorites, user }: FavoritesClientProps) {
  const [favorites, setFavorites] = useState<Sale[]>(initialFavorites)
  const [loading, setLoading] = useState(false)

  const handleRemoveFavorite = async (saleId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sales/${saleId}/favorite`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(sale => sale.id !== saleId))
      } else {
        console.error('Failed to remove favorite')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getPriceDisplay = (price?: number) => {
    if (price === null || price === undefined) return 'Free'
    if (price === 0) return 'Free'
    return `$${price.toLocaleString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">
          Sales you've saved for later ({favorites.length})
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-500 mb-6">Start browsing sales and save the ones you're interested in.</p>
          <Link
            href="/sales"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Browse Sales
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((sale) => (
            <div key={sale.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                    <Link 
                      href={`/sales/${sale.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {sale.title}
                    </Link>
                  </h3>
                  <button
                    onClick={() => handleRemoveFavorite(sale.id)}
                    disabled={loading}
                    className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {sale.city}, {sale.state}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(sale.date_start)} at {formatTime(sale.time_start)}
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {getPriceDisplay(sale.price)}
                  </div>
                </div>
                
                {sale.tags && sale.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {sale.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                    {sale.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{sale.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/sales/${sale.id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(sale.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
