import { Suspense } from 'react'
import SalesSearchClient from './SalesSearchClient'
import { getSales } from '@/lib/data'

interface SalesSearchPageProps {
  searchParams: {
    lat?: string
    lng?: string
    distance?: string
    city?: string
    categories?: string
  }
}

export default async function SalesSearchPage({ searchParams }: SalesSearchPageProps) {
  // Parse search parameters
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined
  const distance = searchParams.distance ? parseFloat(searchParams.distance) : 25
  const city = searchParams.city
  const categories = searchParams.categories ? searchParams.categories.split(',') : undefined

  // Fetch initial sales data
  const initialSales = await getSales({
    lat,
    lng,
    distanceKm: distance,
    city,
    categories,
    limit: 50,
    offset: 0
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Sales Near You</h1>
          <p className="text-gray-600">
            Discover yard sales, garage sales, and estate sales in your area
          </p>
        </div>

        <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>}>
          <SalesSearchClient 
            initialSales={initialSales}
            initialLocation={lat && lng ? { lat, lng } : undefined}
            initialDistance={distance}
            initialCity={city}
            initialCategories={categories}
          />
        </Suspense>
      </div>
    </div>
  )
}
