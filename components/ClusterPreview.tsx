'use client'

import { useEffect, useRef } from 'react'
import { Sale } from '@/types/sale'

interface ClusterPreviewProps {
  sales: Sale[]
  total: number
  onViewAll: () => void
  onZoomToCluster: () => void
  onClose: () => void
}

export default function ClusterPreview({ 
  sales, 
  total, 
  onViewAll, 
  onZoomToCluster, 
  onClose 
}: ClusterPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus trap and ESC handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const formatDate = (sale: Sale) => {
    const dateStr = sale.date_start || sale.start_at
    const timeStr = sale.time_start
    if (dateStr) {
      const date = new Date(dateStr)
      const dateFormatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      const timeFormatted = timeStr ? 
        new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : ''
      return `${dateFormatted}${timeFormatted ? ` at ${timeFormatted}` : ''}`
    }
    return 'Date TBD'
  }

  const formatLocation = (sale: Sale) => {
    if (sale.city && sale.state) {
      return `${sale.city}, ${sale.state}`
    }
    return sale.address || 'Location TBD'
  }

  return (
    <div 
      ref={panelRef}
      className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden"
      tabIndex={-1}
      role="dialog"
      aria-label="Cluster preview"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {total} Sale{total !== 1 ? 's' : ''} in this area
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <div className="p-4 space-y-3">
          {sales.slice(0, 10).map((sale) => (
            <div 
              key={sale.id}
              className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => {
                window.open(`/sale/${sale.id}`, '_blank', 'noopener,noreferrer')
              }}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {sale.title}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  {formatLocation(sale)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(sale)}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          {total > 10 && (
            <button
              onClick={onViewAll}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View all ({total})
            </button>
          )}
          <button
            onClick={onZoomToCluster}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Zoom to cluster
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
