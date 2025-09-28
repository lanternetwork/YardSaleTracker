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
  
  // Get initial center from IP or URL params
  let center = getInitialCenter(headersList)
  let radius = 25 // Default radius in miles
  
  // Override with URL params if present
  if (searchParams.lat && searchParams.lng) {
    center = {
      lat: parseFloat(searchParams.lat),
      lng: parseFloat(searchParams.lng)
    }
  }
  
  if (searchParams.radius) {
    radius = parseFloat(searchParams.radius)
  }
  
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
