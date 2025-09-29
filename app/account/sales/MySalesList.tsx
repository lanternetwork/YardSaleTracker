'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface Sale {
  id: string
  title: string
  date_start: string
  time_start: string
  address: string
  status: 'draft' | 'published' | 'hidden' | 'auto_hidden'
  created_at: string
  updated_at: string
}

export default function MySalesList() {
  const { data: user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showPast, setShowPast] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await fetch('/api/account/sales')
        if (!response.ok) {
          throw new Error('Failed to fetch sales')
        }
        const data = await response.json()
        setSales(data)
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Failed to load sales' 
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSales()
  }, [])

  const handleHideUnhide = async (saleId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'hidden' ? 'unhide' : 'hide'
      const response = await fetch(`/api/account/sales/${saleId}/${action}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} sale`)
      }

      // Update local state
      setSales(prev => prev.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: action === 'hide' ? 'hidden' : 'published' }
          : sale
      ))

      setMessage({ 
        type: 'success', 
        text: `Sale ${action === 'hide' ? 'hidden' : 'unhidden'} successfully ✓` 
      })

      // Show undo option for 10 seconds
      setTimeout(() => {
        setMessage(null)
      }, 10000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update sale' 
      })
    }
  }

  const handleUndo = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId)
    if (sale) {
      await handleHideUnhide(saleId, sale.status)
    }
  }

  const filteredSales = sales.filter(sale => {
    if (showPast) return true
    const saleDate = new Date(`${sale.date_start}T${sale.time_start}`)
    return saleDate >= new Date()
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      hidden: 'bg-red-100 text-red-800',
      auto_hidden: 'bg-yellow-100 text-yellow-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      draft: 'Draft',
      published: 'Published',
      hidden: 'Hidden',
      auto_hidden: 'Auto-hidden'
    }
    return texts[status as keyof typeof texts] || status
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your sales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/account" className="text-amber-600 hover:text-amber-700 text-sm">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mt-4">My Sales</h1>
          <p className="text-neutral-600 mt-2">Manage your yard sales</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <span>{message.text}</span>
              {message.type === 'success' && message.text.includes('hidden') && (
                <button
                  onClick={() => {
                    const saleId = sales.find(s => s.status === 'hidden')?.id
                    if (saleId) handleUndo(saleId)
                  }}
                  className="text-sm underline hover:no-underline"
                >
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {filteredSales.length} {showPast ? 'total' : 'upcoming'} sales
            </h2>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowPast(!showPast)}
                className={`px-3 py-1 rounded text-sm ${
                  showPast 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                {showPast ? 'Show Upcoming Only' : 'Show Past 90 Days'}
              </button>
              
              <Link
                href="/sell/new"
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm"
              >
                Post New Sale
              </Link>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {showPast ? 'No past sales' : 'No upcoming sales'}
              </h3>
              <p className="text-neutral-600 mb-4">
                {showPast 
                  ? 'You haven\'t posted any sales in the past 90 days'
                  : 'You don\'t have any upcoming sales posted'
                }
              </p>
              <Link
                href="/sell/new"
                className="inline-block px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Post Your First Sale
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-neutral-900">{sale.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(sale.status)}`}>
                          {getStatusText(sale.status)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-neutral-600 space-y-1">
                        <p><strong>When:</strong> {sale.date_start} at {sale.time_start}</p>
                        <p><strong>Where:</strong> {sale.address}</p>
                        <p><strong>Posted:</strong> {new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {sale.status === 'published' && (
                        <Link
                          href={`/sale/${sale.id}`}
                          target="_blank"
                          className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
                        >
                          View Live
                        </Link>
                      )}
                      
                      {sale.status === 'draft' && (
                        <Link
                          href={`/sell/${sale.id}/edit`}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
                        >
                          Edit
                        </Link>
                      )}
                      
                      {sale.status !== 'draft' && (
                        <Link
                          href={`/sell/${sale.id}/manage`}
                          className="px-3 py-1 text-sm border border-neutral-300 rounded hover:bg-neutral-50"
                        >
                          Manage
                        </Link>
                      )}
                      
                      {sale.status !== 'draft' && (
                        <button
                          onClick={() => handleHideUnhide(sale.id, sale.status)}
                          className={`px-3 py-1 text-sm rounded ${
                            sale.status === 'hidden'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {sale.status === 'hidden' ? 'Unhide' : 'Hide'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
