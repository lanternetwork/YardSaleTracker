'use client'
import Link from 'next/link'

interface EmptyStateProps {
  title?: string
  description?: string
  showDemo?: boolean
  cta?: React.ReactNode
}

export default function EmptyState({ 
  title = "No sales found",
  description = "Try adjusting your search filters or check back later for new listings.",
  showDemo = false,
  cta
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">{title}</h2>
        <p className="text-neutral-600 mb-6">{description}</p>
        
        <div className="space-y-3">
          {cta || (
            <Link
              href="/explore?tab=add"
              className="inline-block bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Post Your Sale in 60s
            </Link>
          )}
          
          {process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true' && showDemo && (
            <div className="mt-4">
              <p className="text-sm text-neutral-500 mb-3">Or check out these demo sales:</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold">Demo: Estate Sale - Antique Furniture</h3>
                  <p className="text-sm text-neutral-600">123 Main St, Anytown</p>
                  <p className="text-sm text-neutral-500">This weekend • $50-200</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold">Demo: Moving Sale - Everything Must Go</h3>
                  <p className="text-sm text-neutral-600">456 Oak Ave, Anytown</p>
                  <p className="text-sm text-neutral-500">Next Saturday • $10-100</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}