// Pure parser function for Craigslist HTML - extracted from Deno function
// This allows for unit testing without changing the original behavior

export interface ParsedItem {
  id: string
  title: string
  url?: string
  postedAt?: string
  price?: number | null
  city?: string | null
}

export function parseCraigslistList(html: string, limit: number = 20): ParsedItem[] {
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
      id: `cl_${Date.now()}_${i}`, // Generate stable ID for testing
      title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
      url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
      postedAt: date,
      price: parsedPrice,
      city: null // Will be set by caller
    })
  }
  
  return results
}
