import { serve } from "https://deno.land/std/http/server.ts"

interface ScrapedSale {
  id: string
  title: string
  description?: string
  address?: string
  start_at?: string
  end_at?: string
  price_min?: number
  price_max?: number
  contact?: string
  source: string
  url?: string
}

interface ParsedItem {
  id: string
  title: string
  url?: string
  postedAt?: string
  price?: number | null
  city?: string | null
}

// Pure parser function - extracted for testing
function parseCraigslistList(html: string, limit: number = 20): ParsedItem[] {
  const results: ParsedItem[] = []
  
  // Regex patterns for different possible markup structures
  const titleRegex = /<a[^>]*class="(?:result-title|posting-title)"[^>]*>([^<]+)<\/a>/g
  const dateRegex = /<(?:time|span)[^>]*class="(?:result-date|posting-date)"[^>]*datetime="([^"]+)"[^>]*>/g
  const priceRegex = /<span[^>]*class="(?:result-price|posting-price)"[^>]*>([^<]+)<\/span>/g
  const linkRegex = /<a[^>]*class="(?:result-title|posting-title)"[^>]*href="([^"]+)"[^>]*>/g
  
  const titles: string[] = []
  const dates: string[] = []
  const prices: string[] = []
  const links: string[] = []
  
  let match
  while ((match = titleRegex.exec(html)) !== null) {
    titles.push(match[1].trim())
  }
  
  while ((match = dateRegex.exec(html)) !== null) {
    dates.push(match[1])
  }
  
  while ((match = priceRegex.exec(html)) !== null) {
    prices.push(match[1].trim())
  }
  
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1])
  }
  
  // Combine the data
  for (let i = 0; i < Math.min(titles.length, limit); i++) {
    const title = titles[i]
    const date = dates[i] || new Date().toISOString()
    const price = prices[i] || ''
    const link = links[i] || ''
    
    // Extract price range
    let parsedPrice: number | null = null
    
    if (price && price !== 'FREE') {
      const priceMatch = price.match(/\$(\d+)/g)
      if (priceMatch) {
        const prices = priceMatch.map(p => parseInt(p.replace('$', '')))
        parsedPrice = Math.min(...prices) // Use minimum price for single value
      }
    }
    
    results.push({
      id: `cl_${Date.now()}_${i}`,
      title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
      url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
      postedAt: date,
      price: parsedPrice,
      city: null
    })
  }
  
  return results
}

serve(async (req: any) => {
  const correlationId = `deno_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { city = "sfbay", query = "garage sale", limit = 20 } = await req.json()
    
    console.log(`[SCRAPER] [INFO] [${correlationId}] [${city}] [${query}] Starting scrape request`)
    
    // Validate inputs
    if (typeof city !== 'string' || typeof query !== 'string') {
      console.log(`[SCRAPER] [WARN] [${correlationId}] Invalid parameters: city=${typeof city}, query=${typeof query}`)
      return new Response(JSON.stringify({ 
        error: "Invalid parameters" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" }
      })
    }

    // Rate limiting: Add delay between requests
    const delay = Math.random() * 1000 + 500 // 500-1500ms delay
    await new Promise(resolve => setTimeout(resolve, delay))
    
    const url = `https://${city}.craigslist.org/search/gms?query=${encodeURIComponent(query)}`
    console.log(`[SCRAPER] [DEBUG] [${correlationId}] Fetching URL: ${url}`)
    
    // Fetch the page with proper headers and timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.5",
          "accept-encoding": "gzip, deflate, br",
          "connection": "keep-alive",
          "upgrade-insecure-requests": "1",
          "referer": `https://${city}.craigslist.org/`,
          "cache-control": "no-cache"
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`[SCRAPER] [ERROR] [${correlationId}] HTTP ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      console.log(`[SCRAPER] [DEBUG] [${correlationId}] Received ${html.length} bytes of HTML`)
      
      // Parse the HTML using the extracted parser function
      const parsedItems = parseCraigslistList(html, limit)
      console.log(`[SCRAPER] [INFO] [${correlationId}] Parsed ${parsedItems.length} items`)
      
      // Convert to ScrapedSale format
      const results: ScrapedSale[] = parsedItems.map(item => {
        // Extract price range from single price
        let price_min: number | undefined
        let price_max: number | undefined
        
        if (item.price !== null) {
          price_min = item.price
          price_max = item.price
        }
        
        return {
          id: item.id,
          title: item.title,
          description: `Found on Craigslist ${city}`,
          start_at: item.postedAt,
          price_min,
          price_max,
          source: 'craigslist',
          url: item.url
        }
      })
      
      console.log(`[SCRAPER] [INFO] [${correlationId}] Returning ${results.length} results`)
      
      return new Response(JSON.stringify({ 
        results,
        total: results.length,
        city,
        query
      }), { 
        headers: { "content-type": "application/json" }
      })
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.log(`[SCRAPER] [ERROR] [${correlationId}] Request timeout`)
        throw new Error('Request timeout')
      }
      
      throw fetchError
    }
    
  } catch (error) {
    console.log(`[SCRAPER] [ERROR] [${correlationId}] Scraper error: ${(error as Error).message}`)
    
    return new Response(JSON.stringify({ 
      error: "Failed to scrape data",
      message: (error as Error).message,
      results: []
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
})
