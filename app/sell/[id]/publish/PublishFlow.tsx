'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatRevealTimeRemaining } from '@/lib/sales/privacy'
import { Sale, DedupeCandidate } from '@/lib/sales/dedupe-utils'

export default function PublishFlow() {
  const params = useParams()
  const router = useRouter()
  const saleId = params.id as string
  
  const [sale, setSale] = useState<Sale | null>(null)
  const [candidates, setCandidates] = useState<DedupeCandidate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
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
      
      // Check for duplicates via API
      const duplicateResponse = await fetch('/api/sales/dedupe/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: saleData.lat,
          lng: saleData.lng,
          title: saleData.title,
          date_start: saleData.date_start,
          date_end: saleData.date_end
        })
      })
      
      if (duplicateResponse.ok) {
        const duplicateCandidates = await duplicateResponse.json()
        setCandidates(duplicateCandidates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sale')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotDuplicate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}/not-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherSaleId: candidateId })
      })
      
      if (response.ok) {
        // Remove from candidates list
        setCandidates(prev => prev.filter(c => c.id !== candidateId))
      }
    } catch (err) {
      console.error('Failed to record negative match:', err)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(`/api/sales/${saleId}/publish`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to publish sale')
      }

      const { redirectUrl } = await response.json()
      router.push(redirectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish sale')
    } finally {
      setIsPublishing(false)
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
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Publish Your Sale</h1>

        {/* Sale Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sale Preview</h2>
          <div className="space-y-2">
            <p><strong>Title:</strong> {sale.title}</p>
            {sale.description && <p><strong>Description:</strong> {sale.description}</p>}
            <p><strong>When:</strong> {sale.date_start} at {sale.time_start}</p>
            <p><strong>Where:</strong> {sale.address}</p>
            <p><strong>Privacy:</strong> {sale.privacy_mode === 'exact' ? 'Exact location' : 'Block-level until 24h before'}</p>
          </div>

          {/* Privacy countdown */}
          {sale.privacy_mode === 'block_until_24h' && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Location will be revealed:</strong> {formatRevealTimeRemaining(sale)}
              </p>
            </div>
          )}
        </div>

        {/* Duplicate Check */}
        {candidates.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              Potential Duplicates Found
            </h3>
            <p className="text-yellow-700 mb-4">
              We found {candidates.length} similar sales nearby. Please review them to avoid duplicates.
            </p>
            
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.sale.id} className="bg-white rounded-lg p-4 border border-yellow-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{candidate.sale.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{candidate.sale.address}</p>
                      <p className="text-sm text-gray-500 mt-1">{candidate.reason}</p>
                    </div>
                    <button
                      onClick={() => handleNotDuplicate(candidate.sale.id)}
                      className="ml-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Not a duplicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publish Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Publish?</h3>
              <p className="text-gray-600 mt-1">
                Your sale will be visible to everyone and you'll be able to manage it from your account.
              </p>
            </div>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? 'Publishing...' : 'Publish Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
