import { Suspense } from 'react'
import FavoritesClient from './FavoritesClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export default async function FavoritesPage() {
  const supabase = createSupabaseServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your favorite sales.</p>
          <a
            href="/signin"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  // Get user's favorite sales
  const { data: favorites } = await supabase
    .from(T.favorites)
    .select(`
      created_at,
      sales:${T.sales} (
        id,
        title,
        description,
        address,
        city,
        state,
        zip_code,
        lat,
        lng,
        date_start,
        time_start,
        date_end,
        time_end,
        price,
        tags,
        status,
        is_featured,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const favoriteSales = favorites?.map(fav => fav.sales).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoritesClient 
          initialFavorites={favoriteSales}
          user={user}
        />
      </Suspense>
    </div>
  )
}

function FavoritesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-1/3"></div>
        
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
