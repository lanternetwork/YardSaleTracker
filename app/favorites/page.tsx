'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface Favorite {
  id: string
  created_at: string
  sales: {
    id: string
    title: string
    address: string
    city: string
    state: string
    lat?: number
    lng?: number
    start_at?: string
    end_at?: string
    price_min?: number
    price_max?: number
    status: string
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadFavorites()
      mergeLocalFavorites()
    }
  }, [user])

  const loadFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.data || [])
      } else {
        setMessage('Error loading favorites')
      }
    } catch (error) {
      setMessage('Error loading favorites')
    } finally {
      setIsLoading(false)
    }
  }

  const mergeLocalFavorites = async () => {
    try {
      const localFavorites = localStorage.getItem('favorites')
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites)
        if (favoriteIds.length > 0) {
          // Add each local favorite to server
          for (const saleId of favoriteIds) {
            await fetch(`/api/favorites/${saleId}`, {
              method: 'POST',
            })
          }
          // Clear local favorites
          localStorage.removeItem('favorites')
          // Reload favorites
          loadFavorites()
        }
      }
    } catch (error) {
      console.error('Error merging local favorites:', error)
    }
  }

  const handleRemoveFavorite = async (saleId: string) => {
    try {
      const response = await fetch(`/api/favorites/${saleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.sales.id !== saleId))
        setMessage('Removed from favorites')
      } else {
        setMessage('Error removing favorite')
      }
    } catch (error) {
      setMessage('Error removing favorite')
    }
  }

  if (!user) {
    return <div className="p-4 text-center">Redirecting to sign in...</div>
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading favorites...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't favorited any sales yet.</p>
          <a
            href="/explore"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Sales
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{favorite.sales.title}</h3>
                  <p className="text-gray-600 mb-2">{favorite.sales.address}, {favorite.sales.city}, {favorite.sales.state}</p>
                  
                  {favorite.sales.start_at && (
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Start:</strong> {new Date(favorite.sales.start_at).toLocaleString()}
                    </p>
                  )}
                  
                  {favorite.sales.end_at && (
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>End:</strong> {new Date(favorite.sales.end_at).toLocaleString()}
                    </p>
                  )}
                  
                  {(favorite.sales.price_min || favorite.sales.price_max) && (
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Price:</strong> ${favorite.sales.price_min || 0} - ${favorite.sales.price_max || 'No limit'}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-500">
                    <strong>Status:</strong> {favorite.sales.status}
                  </p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <a
                    href={`/sale/${favorite.sales.id}`}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleRemoveFavorite(favorite.sales.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
          {message}
        </div>
      )}
    </div>
  )
}
