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
  
  // Parse each result-row individually - more flexible regex
  const resultRowRegex = /<div class="result-row"[^>]*data-pid="[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g
  let rowMatch
  let count = 0
  
  while ((rowMatch = resultRowRegex.exec(html)) !== null && count < limit) {
    const rowHtml = rowMatch[1]
    
    // Extract title and link - more flexible pattern
    const titleMatch = rowHtml.match(/<a[^>]*class="[^"]*result-title[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/)
    if (!titleMatch) continue
    
    const link = titleMatch[1]
    const title = titleMatch[2].trim()
    
    // Extract date - more flexible pattern
    const dateMatch = rowHtml.match(/<(?:time|span)[^>]*class="[^"]*result-date[^"]*"[^>]*datetime="([^"]+)"[^>]*>/)
    const date = dateMatch ? dateMatch[1] : new Date().toISOString()
    
    // Extract price - more flexible pattern
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
      id: `cl_${Date.now()}_${count}`,
      title: title,
      url: link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`,
      postedAt: date,
      price: parsedPrice,
      city: null
    })
    
    count++
  }
  
  return results
}
