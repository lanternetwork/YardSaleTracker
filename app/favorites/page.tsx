'use client'
import { useFavorites } from '@/lib/hooks/useAuth'
import SalesList from '@/components/SalesList'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'

export default function Favorites() {
  const { data: user } = useAuth()
  const { data: favorites = [], isLoading, error } = useFavorites()

  if (isLoading) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
          <div className="text-neutral-600">Loading your saved sales...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-4">
        <div className="text-center py-16 text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-lg font-medium">Error loading favorites</div>
          <div className="text-sm mt-2">{error.message}</div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Saved Sales</h1>
        <p className="text-neutral-600">
          {favorites.length} saved sale{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState 
          title="No saved sales yet"
          cta={
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">💝</div>
                <p className="text-lg text-neutral-600 mb-2">
                  You haven't saved any sales yet
                </p>
                <p className="text-sm text-neutral-500 mb-4">
                  Browse sales and click the heart icon to save the ones you're interested in.
                </p>
                <a 
                  href="/explore" 
                  className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Browse Sales →
                </a>
              </div>
            </div>
          }
        />
      ) : (
        <SalesList sales={favorites} />
      )}
    </main>
  )
}
