import { Suspense } from 'react'
import IngestDiagnosticsContent from './IngestDiagnosticsContent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function IngestDiagnosticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Craigslist Ingestion Diagnostics</h1>
          <p className="mt-2 text-gray-600">
            Monitor ingestion runs and view scraped sales data
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading diagnostics...</span>
          </div>
        }>
          <IngestDiagnosticsContent />
        </Suspense>
      </div>
    </div>
  )
}
