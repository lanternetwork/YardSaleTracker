export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Suspense } from 'react'
import ExploreClient from './ExploreClient'

export default function Explore() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-4">Loading...</div>}>
      <ExploreClient />
    </Suspense>
  )
}
