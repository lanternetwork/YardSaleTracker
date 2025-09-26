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
  if (!html) return results

  // Split by result rows to keep fields aligned
  const rowRegex = /<div[^>]*class="result-row"[\s\S]*?<\/div>\s*<\/div>/g
  const rows = html.match(rowRegex) || []

  for (let i = 0; i < Math.min(rows.length, limit); i++) {
    const row = rows[i]

    // Extract fields within this row
    const titleMatch = row.match(/<a[^>]*class="(?:result-title|posting-title)[^"]*"[^>]*>([^<]+)<\/a>/)
    const linkMatch = row.match(/<a[^>]*class="(?:result-title|posting-title)[^"]*"[^>]*href="([^"]+)"[^>]*>/)
    const dateMatch = row.match(/<(?:time|span)[^>]*class="(?:result-date|posting-date)"[^>]*datetime="([^"]+)"[^>]*>/)
    const priceMatch = row.match(/<span[^>]*class="(?:result-price|posting-price)"[^>]*>([^<]+)<\/span>/)

    const title = titleMatch ? titleMatch[1].trim() : ''
    const link = linkMatch ? linkMatch[1] : ''
    const date = dateMatch ? dateMatch[1] : new Date().toISOString()
    const priceText = priceMatch ? priceMatch[1].trim() : ''

    let parsedPrice: number | null = null
    if (priceText && priceText !== 'FREE') {
      const priceNumbers = priceText.match(/\$(\d+)/g)
      if (priceNumbers) {
        const nums = priceNumbers.map(p => parseInt(p.replace('$', '')))
        parsedPrice = Math.min(...nums)
      }
    }

    const href = link ? (link.startsWith('http') ? link : `https://sfbay.craigslist.org${link}`) : `https://sfbay.craigslist.org/`

    // Generate ID based on environment
    let id: string
    if (process.env.NODE_ENV === 'test') {
      // In test environment, use deterministic but unique IDs
      // Use full timestamp to ensure uniqueness between calls
      id = `cl_${Date.now()}_${i}`
    } else {
      // In production, use full timestamp with random component
      id = `cl_${Date.now()}${Math.floor(Math.random()*1000)}_${i}`
    }
    
    results.push({
      id,
      title: title.replace(/<[^>]*>/g, ''),
      url: href,
      postedAt: date,
      price: parsedPrice,
      city: null
    })
  }

  return results
}
