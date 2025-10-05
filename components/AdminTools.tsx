'use client'
import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface ReviewKeyInfo {
  sale_id: string
  address_key: string
  review_key: string
  review_count: number
  seller_id: string
  title: string
  address: string
  city: string
  state: string
}

export default function AdminTools() {
  const [saleId, setSaleId] = useState('')
  const [reviewInfo, setReviewInfo] = useState<ReviewKeyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const handleLookup = async () => {
    if (!saleId.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Get sale information
      const { data: sale, error: saleError } = await supabase
        .from('sales_v2')
        .select('id, title, address, city, state, address_key, owner_id')
        .eq('id', saleId.trim())
        .single()

      if (saleError) {
        throw new Error(`Sale not found: ${saleError.message}`)
      }

      // Compute review_key
      const reviewKey = `${sale.address_key}|${sale.owner_id}`

      // Count reviews for this review_key
      const { count: reviewCount, error: countError } = await supabase
        .from('reviews_v2')
        .select('*', { count: 'exact', head: true })
        .eq('review_key', reviewKey)

      if (countError) {
        throw new Error(`Failed to count reviews: ${countError.message}`)
      }

      setReviewInfo({
        sale_id: sale.id,
        address_key: sale.address_key,
        review_key: reviewKey,
        review_count: reviewCount || 0,
        seller_id: sale.owner_id,
        title: sale.title,
        address: sale.address,
        city: sale.city,
        state: sale.state
      })
    } catch (err: any) {
      setError(err.message)
      setReviewInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Review Key Debugging</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="saleId" className="block text-sm font-medium text-gray-700 mb-2">
            Sale ID
          </label>
          <div className="flex gap-2">
            <input
              id="saleId"
              type="text"
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
              placeholder="Enter sale ID..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLookup}
              disabled={isLoading || !saleId.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {reviewInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-3">Review Key Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Sale ID:</span>
                <p className="text-gray-900 font-mono">{reviewInfo.sale_id}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <p className="text-gray-900">{reviewInfo.title}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <p className="text-gray-900">{reviewInfo.address}, {reviewInfo.city}, {reviewInfo.state}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Seller ID:</span>
                <p className="text-gray-900 font-mono">{reviewInfo.seller_id}</p>
              </div>
              
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Address Key:</span>
                <p className="text-gray-900 font-mono text-xs break-all">{reviewInfo.address_key}</p>
              </div>
              
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Review Key:</span>
                <p className="text-gray-900 font-mono text-xs break-all">{reviewInfo.review_key}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Review Count:</span>
                <p className="text-gray-900 font-semibold">{reviewInfo.review_count}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
