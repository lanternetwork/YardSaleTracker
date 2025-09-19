'use client'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import NavTabs from '@/components/NavTabs'
import SearchFilters from '@/components/SearchFilters'
import SearchResults from '@/components/SearchResults'
import VirtualizedSalesList from '@/components/VirtualizedSalesList'
import dynamic from 'next/dynamic'

const YardSaleMap = dynamic(() => import('@/components/YardSaleMap'), {
  ssr: false,
  loading: () => <div className="h-[60vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">Loading map...</div>
})
import AddSaleForm from '@/components/AddSaleForm'
import ImportSales from '@/components/ImportSales'
import { useSales } from '@/lib/hooks/useSales'
import { Filters } from '@/state/filters'

export default function Explore() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filters>({ q: '', maxKm: 25, tags: [] })
  
  const tab = searchParams.get('tab') as 'list' | 'map' | 'add' | 'find' || 'list'

  // Use React Query hook for data fetching
  const { data: sales = [], isLoading, error } = useSales(filters)

  const mapPoints = useMemo(() => 
    sales
      .filter(s => s.lat && s.lng)
      .map(s => ({ id: s.id, title: s.title, lat: s.lat!, lng: s.lng! }))
  , [sales])

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Explore Yard Sales</h1>
      <p className="text-neutral-600 mb-4">Browse, search, and discover amazing deals in your neighborhood.</p>
      
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
      {tab === 'map' && <YardSaleMap points={mapPoints} />}
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
