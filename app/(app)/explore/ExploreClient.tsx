'use client'
import { useMemo, useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

import NavTabs from '@/components/NavTabs'
import SearchFilters from '@/components/SearchFilters'
import VirtualizedSalesList from '@/components/VirtualizedSalesList'
import dynamicImport from 'next/dynamic'
import AddSaleForm from '@/components/AddSaleForm'
import ImportSales from '@/components/ImportSales'
import DiagnosticsCard from '@/components/DiagnosticsCard'
import { Filters } from '@/state/filters'
import { trackCenterSource } from '@/lib/analytics/events'

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

interface ExploreClientProps {
  initialSales: any[]
  initialMapPoints: any[]
  initialCenter: { lat: number; lng: number; source: string; city?: string; zip?: string }
  initialRadius: number
  searchParams: {
    tab?: string
    lat?: string
    lng?: string
    radius?: string
    zip?: string
    q?: string
    maxKm?: string
    dateFrom?: string
    dateTo?: string
    tags?: string
  }
}

export default function ExploreClient({ 
  initialSales, 
  initialMapPoints, 
  initialCenter, 
  initialRadius,
  searchParams 
}: ExploreClientProps) {
  const [filters, setFilters] = useState<Filters>({ 
    q: searchParams.q || '', 
    maxKm: searchParams.maxKm ? Number(searchParams.maxKm) : 25, 
    tags: searchParams.tags ? searchParams.tags.split(',') : [],
    dateFrom: searchParams.dateFrom || '',
    dateTo: searchParams.dateTo || ''
  })
  
  const tab = searchParams.tab as 'list' | 'map' | 'add' | 'find' || 'list'

  // Track current center and radius from URL params
  const [currentCenter, setCurrentCenter] = useState(initialCenter)
  const [currentRadius, setCurrentRadius] = useState(initialRadius)
  
  // Use initial data from server
  const [sales] = useState(initialSales)
  const [mapPoints] = useState(initialMapPoints)

  // Track center source on first paint
  useEffect(() => {
    trackCenterSource({ source: initialCenter.source as any })
  }, [initialCenter.source])

  // Update center when URL params change
  useEffect(() => {
    if (searchParams.lat && searchParams.lng) {
      setCurrentCenter({
        lat: parseFloat(searchParams.lat),
        lng: parseFloat(searchParams.lng)
      })
    }
    if (searchParams.radius) {
      setCurrentRadius(parseFloat(searchParams.radius))
    }
  }, [searchParams.lat, searchParams.lng, searchParams.radius])

  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Explore Yard Sales</h1>
      <p className="text-neutral-600 mb-4">Browse, search, and discover amazing deals in your neighborhood.</p>
      
      <DiagnosticsCard />
      
      <NavTabs />
      
      <div className="mb-6">
        <SearchFilters 
          onChange={setFilters} 
          showAdvanced={tab === 'list'} 
          centerSource={initialCenter.source}
          centerCity={initialCenter.city}
        />
      </div>

      {tab === 'list' && (
        <div>
          <div className="mb-4 text-sm text-neutral-600">
            {sales.length} sales found
          </div>
          <VirtualizedSalesList 
            sales={sales} 
            isLoading={false} 
            error={null} 
          />
        </div>
      )}
      {tab === 'map' && (
        <div>
          <div className="mb-4 text-sm text-neutral-600">
            {sales.length} sales found
          </div>
          <CustomClusteredMap 
            points={mapPoints} 
            center={currentCenter}
            zoom={currentRadius <= 5 ? 12 : currentRadius <= 25 ? 10 : 8}
          />
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
