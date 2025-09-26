import { createSupabaseServer } from '@/lib/supabase/server'
import IngestRunsSection from './IngestRunsSection'
import ScrapedSalesSection from './ScrapedSalesSection'

interface IngestRun {
  id: string
  started_at: string
  finished_at?: string
  source: string
  dry_run: boolean
  fetched_count: number
  new_count: number
  updated_count: number
  geocode_calls: number
  cache_hits: number
  status: string
  last_error?: string
}

interface ScrapedSale {
  id: string
  title: string
  url: string
  location_text?: string
  posted_at?: string
  first_seen_at?: string
  last_seen_at?: string
  status: string
}

export default async function IngestDiagnosticsContent() {
  const supabase = createSupabaseServer()

  // Fetch ingestion runs from database
  let runs: IngestRun[] = []
  try {
    const { data: runsData, error: runsError } = await supabase
      .from('ingest_runs')
      .select('*')
      .eq('source', 'craigslist')
      .order('started_at', { ascending: false })
      .limit(20)

    if (runsError) {
      console.error('Error fetching ingest runs:', runsError)
    } else {
      runs = runsData || []
    }
  } catch (error) {
    console.error('Error in diagnostics runs fetch:', error)
  }

  // Fetch scraped sales from Craigslist
  let scrapedSales: ScrapedSale[] = []
  let totalCount = 0
  
  try {
    const { data: sales, error, count } = await supabase
      .from('sales')
      .select('id, title, url, location_text, posted_at, first_seen_at, last_seen_at, status', { count: 'exact' })
      .eq('source', 'craigslist')
      .order('last_seen_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching scraped sales:', error)
    } else {
      scrapedSales = sales || []
      totalCount = count || 0
    }
  } catch (error) {
    console.error('Error in diagnostics sales fetch:', error)
  }

  return (
    <div className="space-y-8">
      <IngestRunsSection runs={runs} />
      <ScrapedSalesSection sales={scrapedSales} totalCount={totalCount} />
    </div>
  )
}
