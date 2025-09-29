import { isStabilize } from '@/lib/config/flags'
import dynamic from 'next/dynamic'

// Full wizard implementation
const SaleWizard = dynamic(() => import('./SaleWizard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading wizard...</p>
      </div>
    </div>
  )
})

export default function NewSalePage() {
  // Stabilize Mode guard - lightweight placeholder
  if (isStabilize) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Create a Sale
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              <strong>Stabilize mode active in preview</strong>
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              The sale creation wizard is temporarily disabled in preview mode 
              to ensure system stability. This feature will be available in production.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <SaleWizard />
}