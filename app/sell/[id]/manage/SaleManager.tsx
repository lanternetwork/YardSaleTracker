'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatRevealTimeRemaining } from '@/lib/sales/privacy'

interface Sale {
  id: string
  title: string
  description?: string
  address: string
  lat?: number
  lng?: number
  date_start: string
  time_start: string
  privacy_mode: 'exact' | 'block_until_24h'
  status: 'draft' | 'published' | 'hidden' | 'auto_hidden'
  created_at: string
  updated_at: string
}

export default function SaleManager() {
  const params = useParams()
  const router = useRouter()
  const saleId = params.id as string
  
  const [sale, setSale] = useState<Sale | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSale()
  }, [saleId])

  const loadSale = async () => {
    try {
      const response = await fetch(`/api/sales/${saleId}`)
      if (!response.ok) {
        throw new Error('Failed to load sale')
      }
      const saleData = await response.json()
      setSale(saleData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sale')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'published' | 'hidden') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update sale')
      }

      const updatedSale = await response.json()
      setSale(updatedSale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sale')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete sale')
      }

      router.push('/explore')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading sale...</p>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Sale not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Sale</h1>
          <button
            onClick={() => router.push('/explore')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Back to Browse
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-gray-900">{sale.title}</p>
                </div>

                {sale.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900">{sale.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">When</label>
                  <p className="mt-1 text-gray-900">{sale.date_start} at {sale.time_start}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Where</label>
                  <p className="mt-1 text-gray-900">{sale.address}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Privacy</label>
                  <p className="mt-1 text-gray-900">
                    {sale.privacy_mode === 'exact' ? 'Exact location' : 'Block-level until 24h before'}
                  </p>
                  {sale.privacy_mode === 'block_until_24h' && (
                    <p className="mt-1 text-sm text-blue-600">
                      Reveals in: {formatRevealTimeRemaining(sale)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Management Actions */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    sale.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : sale.status === 'hidden'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sale.status}
                  </span>
                </div>

                {sale.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange('hidden')}
                    disabled={isUpdating}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Hide Sale
                  </button>
                )}

                {sale.status === 'hidden' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    disabled={isUpdating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Show Sale
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/sell/${saleId}/edit`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Sale
                </button>

                <button
                  onClick={() => window.open(`/sale/${saleId}`, '_blank')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  View Public Page
                </button>

                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Delete Sale
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{new Date(sale.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
