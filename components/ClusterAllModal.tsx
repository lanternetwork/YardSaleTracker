'use client'

import { useEffect, useRef } from 'react'
import { Sale } from '@/types/sale'

interface ClusterAllModalProps {
  sales: Sale[]
  open: boolean
  onClose: () => void
}

export default function ClusterAllModal({ sales, open, onClose }: ClusterAllModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap and ESC handling
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    modalRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const formatDate = (sale: Sale) => {
    const dateStr = sale.date_start || sale.start_at
    const timeStr = sale.time_start
    if (dateStr) {
      const date = new Date(dateStr)
      const dateFormatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div 
          ref={modalRef}
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          tabIndex={-1}
          role="dialog"
          aria-label="All sales in cluster"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                All Sales in Cluster ({sales.length})
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-96">
            <div className="p-6 space-y-4">
              {sales.map((sale) => (
                <div 
                  key={sale.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    window.open(`/sale/${sale.id}`, '_blank', 'noopener,noreferrer')
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {sale.title}
                      </h3>
                      {sale.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {sale.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {formatLocation(sale)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(sale)}
                        </span>
                      </div>
                      {sale.tags && sale.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sale.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {sale.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{sale.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Click any sale to view details
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Placeholder for future bbox deep linking
                    navigator.clipboard?.writeText(window.location.href)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Copy list link
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
