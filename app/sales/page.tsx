import { Suspense } from 'react'
import SalesClient from './SalesClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface SalesPageProps {
  searchParams: {
    lat?: string
    lng?: string
    distanceKm?: string
    city?: string
    categories?: string
    dateFrom?: string
    dateTo?: string
    page?: string
    pageSize?: string
  }
}

export const dynamic = 'force-dynamic'

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const supabase = createSupabaseServerClient()
  let user: any = null
  try {
    const res = await supabase.auth.getUser()
    user = res.data.user
  } catch {
    user = null
  }

  // Parse search parameters
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : undefined
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : undefined
  const distanceKm = searchParams.distanceKm ? parseFloat(searchParams.distanceKm) : 25
  const city = searchParams.city
  const categories = searchParams.categories ? searchParams.categories.split(',') : undefined
  const pageSize = searchParams.pageSize ? parseInt(searchParams.pageSize) : 50

  // Fetch initial sales data using the new API
  let initialSales = []
  try {
    const queryParams = new URLSearchParams()
    // Only add location params if they exist
    if (lat !== undefined && lng !== undefined) {
      queryParams.set('lat', lat.toString())
      queryParams.set('lng', lng.toString())
      if (distanceKm !== undefined) queryParams.set('distanceKm', distanceKm.toString())
    }
    if (city) queryParams.set('city', city)
    if (categories && categories.length > 0) queryParams.set('categories', categories.join(','))
    queryParams.set('limit', pageSize.toString())

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/sales?${queryParams.toString()}`)
    const data = await response.json()
    
    if (data.ok) {
      initialSales = data.data || []
    } else {
      console.error('Initial sales fetch failed:', data.error)
      initialSales = []
    }
  } catch (err) {
    console.error('Sales page initial fetch failed:', err)
    initialSales = []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<SalesSkeleton />}>
        <SalesClient 
          initialSales={initialSales}
          initialSearchParams={searchParams}
          user={user}
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
