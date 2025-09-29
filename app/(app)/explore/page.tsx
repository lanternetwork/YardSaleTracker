import { Suspense } from 'react'
import { headers, cookies } from 'next/headers'
import { getInitialCenter } from '@/lib/location/center'
import { querySalesByRadius, getDefaultDateRange } from '@/lib/server/salesQuery'
import ExploreClient from './ExploreClient'

interface ExplorePageProps {
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

export default async function Explore({ searchParams }: ExplorePageProps) {
  const headersList = await headers()
  const cookieStore = await cookies()
  
  // Get initial center using preference order: URL → cookie → account → IP → fallback
  const center = await getInitialCenter({
    headers: headersList,
    url: new URL(`https://example.com?${new URLSearchParams(searchParams as any).toString()}`),
    cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])),
    user: null // TODO: Add user authentication
  })
  
  const radius = center.radius
  
  // Get date range
  const { dateFrom, dateTo } = getDefaultDateRange()
  
  // Query sales within radius
  const sales = await querySalesByRadius({
    lat: center.lat,
    lng: center.lng,
    radiusMi: radius,
    dateFrom: searchParams.dateFrom || dateFrom,
    dateTo: searchParams.dateTo || dateTo
  })
  
  // Convert to map points
  const mapPoints = sales
    .filter((s: any) => s.lat && s.lng)
    .map((s: any) => ({ 
      id: s.id, 
      title: s.title, 
      lat: s.lat!, 
      lng: s.lng!,
      address: s.address || '',
      privacy_mode: s.privacy_mode || 'exact',
      date_start: s.date_start || '',
      time_start: s.time_start
    }))

  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-4"><div className="h-8 bg-neutral-200 rounded animate-pulse"></div></div>}>
      <ExploreClient 
        initialSales={sales}
        initialMapPoints={mapPoints}
        initialCenter={center}
        initialRadius={radius}
        searchParams={searchParams}
      />
    </Suspense>
  )
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
