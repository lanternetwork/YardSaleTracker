import { Suspense } from 'react'
import SellWizardClient from './SellWizardClient'

export default function SellNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<SellWizardSkeleton />}>
        <SellWizardClient />
      </Suspense>
    </div>
  )
}

function SellWizardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-1/3 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-1/2 mx-auto"></div>
        </div>
        
        {/* Progress skeleton */}
        <div className="flex justify-center">
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Form skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
