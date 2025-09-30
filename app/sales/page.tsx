import { Suspense } from 'react'
import { getSales } from '@/lib/data'
import SalesClient from './SalesClient'

interface SalesPageProps {
  searchParams: {
    lat?: string
    lng?: string
    distance?: string
    city?: string
    categories?: string
    q?: string
  }
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  // Parse search parameters
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined
  const distance = searchParams.distance ? parseFloat(searchParams.distance) : 25
  const city = searchParams.city
  const categories = searchParams.categories ? searchParams.categories.split(',') : undefined
  const query = searchParams.q

  // Fetch initial sales data
  const initialSales = await getSales({
    lat,
    lng,
    distanceKm: distance,
    city,
    categories,
    limit: 24
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<SalesSkeleton />}>
        <SalesClient 
          initialSales={initialSales}
          initialFilters={{
            lat,
            lng,
            distance,
            city: city || '',
            categories: categories || [],
            query: query || ''
          }}
        />
      </Suspense>
    </div>
  )
}

function SalesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Search bar skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Filters skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
        </div>
        
        {/* Sales grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
