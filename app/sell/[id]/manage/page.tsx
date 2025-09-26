'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Sale {
  id: string
  title: string
  description: string
  address: string
  date_start: string
  date_end: string
  time_start: string
  time_end: string
  privacy_mode: 'exact' | 'block_until_24h'
  price_min?: number
  price_max?: number
  tags: string[]
  status: 'draft' | 'published' | 'hidden' | 'auto_hidden'
  created_at: string
  updated_at: string
}

export default function ManageSale() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadSale()
  }, [params.id])

  const loadSale = async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to load sale')
      }
      const data = await response.json()
      setSale(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sale')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!sale) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/sales/${sale.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to publish sale')
      }
      
      // Reload the sale to get updated status
      await loadSale()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish sale')
    } finally {
      setActionLoading(false)
    }
  }

  const handleHide = async () => {
    if (!sale) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to hide sale')
      }
      
      // Reload the sale to get updated status
      await loadSale()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hide sale')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnhide = async () => {
    if (!sale) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to unhide sale')
      }
      
      // Reload the sale to get updated status
      await loadSale()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unhide sale')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading sale...</p>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold mb-2">Sale Not Found</h1>
          <p className="text-neutral-600 mb-6">{error || 'The sale you\'re looking for doesn\'t exist.'}</p>
          <Link href="/sell/new" className="text-amber-600 hover:text-amber-700 font-medium">
            Create a New Sale →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Link href="/explore" className="text-amber-600 hover:text-amber-700 font-medium mb-4 inline-block">
            ← Back to Browse
          </Link>
          <h1 className="text-3xl font-bold mb-2">Manage Your Sale</h1>
          <p className="text-neutral-600">View and manage your yard sale listing</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{sale.title}</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  sale.status === 'published' ? 'bg-green-100 text-green-800' :
                  sale.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  sale.status === 'hidden' ? 'bg-red-100 text-red-800' :
                  'bg-neutral-100 text-neutral-800'
                }`}>
                  {sale.status === 'published' ? 'Published' :
                   sale.status === 'draft' ? 'Draft' :
                   sale.status === 'hidden' ? 'Hidden' :
                   'Auto-Hidden'}
                </span>
                {sale.privacy_mode === 'block_until_24h' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    🔒 Privacy Mode
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {sale.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Publishing...' : 'Publish Sale'}
                </button>
              )}
              
              {sale.status === 'published' && (
                <button
                  onClick={handleHide}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Hiding...' : 'Hide Sale'}
                </button>
              )}
              
              {sale.status === 'hidden' && (
                <button
                  onClick={handleUnhide}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Unhiding...' : 'Unhide Sale'}
                </button>
              )}
            </div>
          </div>
          
          {sale.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-neutral-700 whitespace-pre-wrap">{sale.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">When</h3>
              <div className="space-y-1 text-neutral-700">
                <div><strong>Start:</strong> {sale.date_start} {sale.time_start && `at ${sale.time_start}`}</div>
                {sale.date_end && (
                  <div><strong>End:</strong> {sale.date_end} {sale.time_end && `at ${sale.time_end}`}</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Where</h3>
              <div className="text-neutral-700">
                <div>{sale.address}</div>
                {sale.privacy_mode === 'block_until_24h' && (
                  <div className="text-sm text-blue-600 mt-1">
                    🔒 Exact address hidden until 24h before start
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {(sale.price_min || sale.price_max) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Price Range</h3>
              <div className="text-neutral-700">
                {sale.price_min && sale.price_max ? 
                  `$${sale.price_min} - $${sale.price_max}` :
                  sale.price_min ? 
                  `$${sale.price_min}+` :
                  `Up to $${sale.price_max}`
                }
              </div>
            </div>
          )}
          
          {sale.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {sale.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="text-sm text-neutral-500">
              <div>Created: {new Date(sale.created_at).toLocaleString()}</div>
              <div>Last updated: {new Date(sale.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/sell/${sale.id}/edit`}
              className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-center"
            >
              <div className="text-2xl mb-2">✏️</div>
              <div className="font-medium">Edit Sale</div>
              <div className="text-sm text-neutral-600">Update details</div>
            </Link>
            
            <Link
              href="/explore"
              className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-center"
            >
              <div className="text-2xl mb-2">👀</div>
              <div className="font-medium">View on Map</div>
              <div className="text-sm text-neutral-600">See how it appears</div>
            </Link>
            
            <div className="p-4 border border-neutral-200 rounded-lg text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Analytics</div>
              <div className="text-sm text-neutral-600">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
