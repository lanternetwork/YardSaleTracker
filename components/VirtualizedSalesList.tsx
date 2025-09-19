'use client'
import { Virtuoso } from 'react-virtuoso'
import SaleCard from './SaleCard'
import EmptyState from './EmptyState'

interface VirtualizedSalesListProps {
  sales: any[]
  isLoading?: boolean
  error?: Error | null
}

export default function VirtualizedSalesList({ sales, isLoading, error }: VirtualizedSalesListProps) {
  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <div className="text-6xl mb-4">⚠️</div>
        <div className="text-lg font-medium">Error loading sales</div>
        <div className="text-sm mt-2">{error.message}</div>
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
