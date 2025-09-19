import { Sale } from '@/lib/types'
import SalesList from './SalesList'
import EmptyState from './EmptyState'

interface SearchResultsProps {
  sales: Sale[]
  isLoading: boolean
  error: Error | null
  filters: {
    q?: string
    maxKm?: number
    dateFrom?: string
    dateTo?: string
    tags?: string[]
    min?: number
    max?: number
  }
}

export default function SearchResults({ 
  sales, 
  isLoading, 
  error, 
  filters 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
          <div className="text-neutral-600">Searching sales...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600">
        <div className="text-4xl mb-2">⚠️</div>
        <div className="text-lg font-medium">Error loading sales</div>
        <div className="text-sm mt-2">{error.message}</div>
      </div>
    )
  }

  if (sales.length === 0) {
    const hasFilters = Object.values(filters).some(v => 
      v !== undefined && v !== null && v !== '' && 
      (Array.isArray(v) ? v.length > 0 : true)
    )

    return (
      <EmptyState 
        title={hasFilters ? "No sales match your filters" : "No sales found"}
        cta={
          hasFilters ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500">
                Try adjusting your search criteria or clearing some filters.
              </p>
              <a 
                href="/explore?tab=add" 
                className="inline-block text-amber-600 hover:text-amber-700 font-medium"
              >
                Post the first sale →
              </a>
            </div>
          ) : (
            <a 
              href="/explore?tab=add" 
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Post the first sale →
            </a>
          )
        } 
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-600">
          {sales.length} sale{sales.length !== 1 ? 's' : ''} found
          {filters.q && (
            <span> for "{filters.q}"</span>
          )}
        </div>
        
        {/* Sort options */}
        <div className="flex gap-2 text-sm">
          <span className="text-neutral-500">Sort by:</span>
          <select className="px-2 py-1 border rounded text-sm">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="distance">Distance</option>
          </select>
        </div>
      </div>

      {/* Sales grid */}
      <SalesList sales={sales} />
    </div>
  )
}
