import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginClient />
      </Suspense>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="max-w-md w-full space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg animate-pulse w-2/3"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
