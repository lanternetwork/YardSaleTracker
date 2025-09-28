import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zip = searchParams.get('zip') || '90078'
  
  console.log(`Testing ZIP code: ${zip}`)
  
  const searchQueries = [
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=5`,
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&format=json&limit=5`,
    `https://nominatim.openstreetmap.org/search?q=${zip}&country=US&format=json&limit=5`
  ]
  
  const results = []
  
  for (let i = 0; i < searchQueries.length; i++) {
    const url = searchQueries[i]
    console.log(`Testing approach ${i + 1}: ${url}`)
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
        }
      })
      
      const data = await response.json()
      
      // Filter for US results
      const usResults = data?.filter((result: any) => 
        result.address?.country_code === 'us' || 
        result.address?.country === 'United States' ||
        result.display_name?.includes('United States')
      ) || []
      
      results.push({
        approach: i + 1,
        url,
        status: response.status,
        dataLength: data?.length || 0,
        usResultsLength: usResults.length,
        data: data,
        usResults: usResults
      })
      
      console.log(`Approach ${i + 1} result:`, {
        status: response.status,
        dataLength: data?.length || 0,
        firstResult: data?.[0] || null
      })
      
      } catch (error) {
        results.push({
          approach: i + 1,
          url,
          error: error instanceof Error ? error.message : String(error)
        })
      }
  }
  
  return NextResponse.json({
    zip,
    results,
    summary: {
      totalApproaches: searchQueries.length,
      successfulApproaches: results.filter(r => r.dataLength > 0).length,
      bestResult: results.find(r => r.dataLength > 0) || null
    }
  })
}
