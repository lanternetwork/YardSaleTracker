import { Suspense } from 'react'
import { getSales } from '@/lib/data'
import HomeClient from './HomeClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export default async function HomePage() {
  // Get nearby sales (default to Louisville area)
  const sales = await getSales({
    lat: 38.2527,
    lng: -85.7585,
    distanceKm: 25,
    limit: 12
  })

  // Get user if authenticated
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<HomeSkeleton />}>
        <HomeClient 
          initialSales={sales}
          user={user}
        />
      </Suspense>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Hero section skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-3/4 mx-auto"></div>
        </div>
        
        {/* Map banner skeleton */}
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Sales grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
