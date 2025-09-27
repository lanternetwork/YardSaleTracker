'use client'
import { useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import NavTabs from '@/components/NavTabs'
import SearchFilters from '@/components/SearchFilters'
import SearchResults from '@/components/SearchResults'
import VirtualizedSalesList from '@/components/VirtualizedSalesList'
import dynamicImport from 'next/dynamic'

const CustomClusteredMap = dynamicImport(() => import('@/components/CustomClusteredMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
        <div className="text-neutral-600">Loading map...</div>
        <div className="text-xs text-neutral-500 mt-2">Dynamic import in progress</div>
      </div>
    </div>
  )
})
import AddSaleForm from '@/components/AddSaleForm'
import ImportSales from '@/components/ImportSales'
import DiagnosticsCard from '@/components/DiagnosticsCard'
import { useSales } from '@/lib/hooks/useSales'
import { Filters } from '@/state/filters'

function ExploreContent() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filters>({ q: '', maxKm: 25, tags: [] })
  
  const tab = searchParams.get('tab') as 'list' | 'map' | 'add' | 'find' || 'list'

  // Use React Query hook for data fetching
  const { data: sales = [], isLoading, error } = useSales(filters)

  const mapPoints = useMemo(() => 
    sales
      .filter(s => s.lat && s.lng)
      .map(s => ({ 
        id: s.id, 
        title: s.title, 
        lat: s.lat!, 
        lng: s.lng!,
        address: s.address || '',
        privacy_mode: s.privacy_mode || 'exact',
        date_start: s.date_start || '',
        time_start: s.time_start
      }))
  , [sales])

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Explore Yard Sales</h1>
      <p className="text-neutral-600 mb-4">Browse, search, and discover amazing deals in your neighborhood.</p>
      
      <DiagnosticsCard />
      
      <NavTabs />
      
      <div className="mb-6">
        <SearchFilters onChange={setFilters} showAdvanced={tab === 'list'} />
      </div>

      {tab === 'list' && (
        <div>
          <div className="mb-4 text-sm text-neutral-600">
            {isLoading ? 'Loading...' : `${sales.length} sales found`}
          </div>
          <VirtualizedSalesList 
            sales={sales} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
      )}
      {tab === 'map' && (
        <div>
          <div className="mb-4 text-sm text-neutral-600">
            {isLoading ? 'Loading...' : `${sales.length} sales found`}
          </div>
          <CustomClusteredMap points={mapPoints} />
        </div>
      )}
      {tab === 'add' && (
        <div id="add" className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Post Your Sale</h2>
          <AddSaleForm />
        </div>
      )}
      {tab === 'find' && <ImportSales />}
    </main>
  )
}

export default function Explore() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-4"><div className="h-8 bg-neutral-200 rounded animate-pulse"></div></div>}>
      <ExploreContent />
    </Suspense>
  )
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
