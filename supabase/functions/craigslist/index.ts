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

serve(async (req) => {
  try {
    const { city = "sfbay", query = "garage sale", limit = 20 } = await req.json()
    
    // Validate inputs
    if (typeof city !== 'string' || typeof query !== 'string') {
      return new Response(JSON.stringify({ 
        error: "Invalid parameters" 
      }), { 
        status: 400,
        headers: { "content-type": "application/json" }
      })
    }

    const url = `https://${city}.craigslist.org/search/gms?query=${encodeURIComponent(query)}`
    
    // Fetch the page with proper headers
    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.5",
        "accept-encoding": "gzip, deflate, br",
        "connection": "keep-alive",
        "upgrade-insecure-requests": "1"
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Parse the HTML to extract sale information
    const results: ScrapedSale[] = []
    
    // Simple regex-based parsing (in production, use a proper HTML parser)
    const titleRegex = /<a[^>]*class="result-title"[^>]*>([^<]+)<\/a>/g
    const dateRegex = /<time[^>]*class="result-date"[^>]*datetime="([^"]+)"[^>]*>/g
    const priceRegex = /<span[^>]*class="result-price"[^>]*>([^<]+)<\/span>/g
    const linkRegex = /<a[^>]*class="result-title"[^>]*href="([^"]+)"[^>]*>/g
    
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
      let price_min: number | undefined
      let price_max: number | undefined
      
      if (price) {
        const priceMatch = price.match(/\$(\d+)/g)
        if (priceMatch) {
          const prices = priceMatch.map(p => parseInt(p.replace('$', '')))
          price_min = Math.min(...prices)
          price_max = Math.max(...prices)
        }
      }
      
      results.push({
        id: crypto.randomUUID(),
        title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
        description: `Found on Craigslist ${city}`,
        start_at: date,
        price_min,
        price_max,
        source: 'craigslist',
        url: link.startsWith('http') ? link : `https://${city}.craigslist.org${link}`
      })
    }
    
    return new Response(JSON.stringify({ 
      results,
      total: results.length,
      city,
      query
    }), { 
      headers: { "content-type": "application/json" }
    })
    
  } catch (error) {
    console.error('Scraper error:', error)
    
    return new Response(JSON.stringify({ 
      error: "Failed to scrape data",
      message: error.message,
      results: []
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
})
