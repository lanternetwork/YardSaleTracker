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
  
  // Find all result-row divs and extract data from each
  const resultRows = html.match(/<div class="result-row"[^>]*>[\s\S]*?<\/div>\s*<\/div>/g) || []
  
  for (let i = 0; i < Math.min(resultRows.length, limit); i++) {
    const rowHtml = resultRows[i]
    
    // Extract title and link - look for result-title class
    const titleMatch = rowHtml.match(/<a[^>]*class="[^"]*result-title[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/)
    if (!titleMatch) continue
    
    const link = titleMatch[1]
    const title = titleMatch[2].trim()
    
    // Extract date - look for result-date class
    const dateMatch = rowHtml.match(/<span[^>]*class="[^"]*result-date[^"]*"[^>]*datetime="([^"]+)"[^>]*>/)
    const date = dateMatch ? dateMatch[1] : new Date().toISOString()
    
    // Extract price - look for result-price class
    const priceMatch = rowHtml.match(/<span[^>]*class="[^"]*result-price[^"]*"[^>]*>([^<]+)<\/span>/)
    const priceText = priceMatch ? priceMatch[1].trim() : ''
    
    // Parse price
    let parsedPrice: number | null = null
    if (priceText && priceText !== 'FREE') {
      const priceNumbers = priceText.match(/\$(\d+)/g)
      if (priceNumbers) {
        const prices = priceNumbers.map(p => parseInt(p.replace('$', '')))
        parsedPrice = Math.min(...prices)
      }
    }
    
    results.push({
      id: `cl_${Date.now()}_${i}`,
      title: title,
      url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
      postedAt: date,
      price: parsedPrice,
      city: null
    })
  }
  
  return results
}
