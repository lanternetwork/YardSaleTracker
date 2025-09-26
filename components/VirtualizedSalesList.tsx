'use client'
import { Virtuoso } from 'react-virtuoso'
import SaleCard from './SaleCard'
import EmptyState from './EmptyState'
import { Sale } from '@/lib/types'

interface VirtualizedSalesListProps {
  sales: Sale[]
  isLoading?: boolean
  error?: Error | null
}

export default function VirtualizedSalesList({ sales, isLoading, error }: VirtualizedSalesListProps) {
  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-lg font-medium">Error loading sales</div>
        <div className="text-sm mt-2 max-w-md mx-auto">
          {error.message.includes('fetch') ? (
            <>
              <div>Failed to fetch data from the server.</div>
              <div className="mt-2 text-xs text-neutral-500">
                This might be due to network issues or server configuration problems.
              </div>
            </>
          ) : (
            error.message
          )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-16 text-neutral-500">
        <div className="text-6xl mb-4">⏳</div>
        <div className="text-lg font-medium">Loading sales...</div>
      </div>
    )
  }

  if (!sales?.length) {
    return <EmptyState />
  }

  return (
    <div className="h-[60vh] w-full">
      <Virtuoso
        data={sales}
        itemContent={(index, sale) => (
          <div className="p-2">
            <SaleCard sale={sale} />
          </div>
        )}
        className="h-full"
        style={{ height: '100%' }}
      />
    </div>
  )
}
