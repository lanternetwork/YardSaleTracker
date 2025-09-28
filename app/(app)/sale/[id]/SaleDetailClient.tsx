'use client'
import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const YardSaleMap = dynamic(() => import('@/components/YardSaleMap'), {
  ssr: false,
  loading: () => <div className="h-[50vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">Loading map...</div>
})
import FavoriteButton from '@/components/FavoriteButton'
import ShareButton from '@/components/ShareButton'
import ReviewsSection from '@/components/ReviewsSection'
import PushNotificationButton from '@/components/PushNotificationButton'
import { Sale } from '@/lib/types'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface SaleDetailClientProps {
  sale: Sale
}

export function SaleDetailClient({ sale }: SaleDetailClientProps) {
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const supabase = createSupabaseBrowser()

  const mapPoints = useMemo(() => 
    sale.lat && sale.lng 
      ? [{ 
          id: sale.id, 
          title: sale.title, 
          lat: sale.lat, 
          lng: sale.lng,
          address: sale.address || '',
          privacy_mode: sale.privacy_mode || 'exact',
          date_start: sale.date_start || ''
        }]
      : []
  , [sale])

  useEffect(() => {
    fetchRatingData()
  }, [sale.id])

  const fetchRatingData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sale_rating', {
        sale_uuid: sale.id
      })

      if (error) throw error

      if (data && data.length > 0) {
        setAverageRating(Number(data[0].average_rating) || 0)
        setTotalReviews(Number(data[0].total_reviews) || 0)
      }
    } catch (error) {
      console.error('Error fetching rating data:', error)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{sale.title}</h1>
            <div className="text-neutral-600 mt-2">
              {sale.address && <div>{sale.address}</div>}
              {sale.city && sale.state && <div>{sale.city}, {sale.state}</div>}
            </div>
            {averageRating > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= Math.round(averageRating)
                          ? 'text-amber-400'
                          : 'text-neutral-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-neutral-600">
                  {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <FavoriteButton saleId={sale.id} initial={false} />
              <ShareButton sale={sale} />
            </div>
          </div>
        </div>

        {sale.description && (
          <p className="text-lg text-neutral-700 mb-4">{sale.description}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {sale.start_at && (
            <div>
              <h3 className="font-semibold text-neutral-900">Start Time</h3>
              <p className="text-neutral-600">
                {new Date(sale.start_at).toLocaleString()}
              </p>
            </div>
          )}
          
          {sale.end_at && (
            <div>
              <h3 className="font-semibold text-neutral-900">End Time</h3>
              <p className="text-neutral-600">
                {new Date(sale.end_at).toLocaleString()}
              </p>
            </div>
          )}


          {sale.contact && (
            <div>
              <h3 className="font-semibold text-neutral-900">Contact</h3>
              <p className="text-neutral-600">{sale.contact}</p>
            </div>
          )}
        </div>

        {sale.tags && sale.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-neutral-900 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {sale.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {mapPoints.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Location</h2>
          <YardSaleMap points={mapPoints} />
          {sale.address && (
            <div className="mt-4">
              <a 
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium" 
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(sale.address)}`}
              >
                Get Directions →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-8 pt-6 border-t">
        <ReviewsSection 
          saleId={sale.id} 
          averageRating={averageRating} 
          totalReviews={totalReviews} 
        />
      </div>

      {/* Push Notifications */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Stay Updated</h2>
        <PushNotificationButton />
      </div>

      <div className="mt-8 pt-6 border-t">
        <a 
          href="/explore" 
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          ← Back to all sales
        </a>
      </div>
    </main>
  )
}
