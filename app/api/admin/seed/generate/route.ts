import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { checkAndSetIdempotency } from '@/lib/admin/idempotency'
import { RateLimiter } from '@/lib/rateLimiter'

// Canonical categories for realistic sales
const CANONICAL_CATEGORIES = [
  'furniture', 'electronics', 'clothing', 'books', 'toys', 'kitchen', 'tools',
  'sports', 'decor', 'art', 'vintage', 'collectibles', 'music', 'garden',
  'outdoor', 'small-appliances', 'office', 'fashion', 'home', 'kids', 'games'
]

// Major US metros for sampling
const MAJOR_METROS = [
  { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { city: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { city: 'Fort Worth', state: 'TX', lat: 32.7555, lng: -97.3308 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 }
]

// Realistic sale titles and descriptions
const SALE_TITLES = [
  'Community Yard Sale',
  'Multi-Family Garage Sale',
  'Neighborhood Block Sale',
  'Estate Sale',
  'Moving Sale',
  'Porch Sale',
  'Driveway Sale',
  'Sidewalk Sale',
  'Holiday Sale',
  'Spring Cleaning Sale',
  'Fall Clearance Sale',
  'Weekend Sale',
  'Family Sale',
  'House Sale',
  'Apartment Sale'
]

const SALE_DESCRIPTIONS = [
  'Everything must go! Great deals on furniture, electronics, and more.',
  'Moving soon - selling everything we can\'t take with us.',
  'Quality items at unbeatable prices. Cash only.',
  'Multi-family sale with something for everyone.',
  'Estate sale with antiques, furniture, and collectibles.',
  'Garage full of treasures waiting to be discovered.',
  'Downsizing sale - everything in excellent condition.',
  'Community sale with multiple families participating.',
  'Seasonal items and household goods at great prices.',
  'Vintage finds and modern items mixed together.'
]

// Item names by category
const ITEMS_BY_CATEGORY = {
  furniture: ['Dining Table', 'Sofa', 'Bookshelf', 'Coffee Table', 'Dresser', 'Nightstand', 'Chair', 'Desk'],
  electronics: ['TV', 'Laptop', 'Tablet', 'Phone', 'Speaker', 'Headphones', 'Camera', 'Gaming Console'],
  clothing: ['Dress', 'Shirt', 'Pants', 'Jacket', 'Shoes', 'Hat', 'Scarf', 'Belt'],
  books: ['Novel', 'Textbook', 'Cookbook', 'Biography', 'Mystery', 'Romance', 'Sci-Fi', 'History'],
  toys: ['Action Figure', 'Doll', 'Board Game', 'Puzzle', 'Stuffed Animal', 'Toy Car', 'LEGO Set', 'Puzzle'],
  kitchen: ['Dish Set', 'Cookware', 'Utensils', 'Appliances', 'Cutting Board', 'Mixing Bowl', 'Serving Platter'],
  tools: ['Drill', 'Hammer', 'Screwdriver Set', 'Wrench', 'Saw', 'Level', 'Tape Measure', 'Toolbox'],
  sports: ['Bike', 'Tennis Racket', 'Golf Clubs', 'Ski Boots', 'Helmet', 'Exercise Equipment', 'Yoga Mat'],
  decor: ['Picture Frame', 'Vase', 'Candle', 'Rug', 'Lamp', 'Mirror', 'Artwork', 'Plant Pot'],
  art: ['Painting', 'Drawing', 'Sculpture', 'Print', 'Photograph', 'Ceramic', 'Pottery', 'Craft'],
  vintage: ['Record Player', 'Typewriter', 'Camera', 'Jewelry', 'Furniture', 'Clothing', 'Books', 'Collectibles'],
  collectibles: ['Coins', 'Stamps', 'Cards', 'Figurines', 'Antiques', 'Memorabilia', 'Vintage Items'],
  music: ['Vinyl Records', 'CDs', 'Instruments', 'Speakers', 'Headphones', 'Music Books', 'Sheet Music'],
  garden: ['Plants', 'Pots', 'Tools', 'Seeds', 'Fertilizer', 'Garden Decor', 'Outdoor Furniture'],
  outdoor: ['Camping Gear', 'Hiking Boots', 'Tent', 'Sleeping Bag', 'Backpack', 'Cooler', 'Chairs'],
  'small-appliances': ['Toaster', 'Blender', 'Coffee Maker', 'Microwave', 'Iron', 'Vacuum', 'Fan'],
  office: ['Desk', 'Chair', 'Computer', 'Monitor', 'Printer', 'Supplies', 'Filing Cabinet'],
  fashion: ['Designer Items', 'Jewelry', 'Accessories', 'Handbags', 'Shoes', 'Watches', 'Scarves'],
  home: ['Bedding', 'Towels', 'Curtains', 'Rugs', 'Pillows', 'Blankets', 'Storage', 'Organizers'],
  kids: ['Toys', 'Clothes', 'Books', 'Games', 'Stuffed Animals', 'Educational Items', 'Sports Equipment'],
  games: ['Board Games', 'Card Games', 'Video Games', 'Puzzles', 'Chess Set', 'Checkers', 'Monopoly']
}

function authOk(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  if (!auth) return false
  const m = auth.match(/^Bearer\s+(.+)$/)
  if (!m) return false
  const token = process.env.SEED_TOKEN
  if (!token) return false
  return m[1] === token
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateRandomPrice(min: number = 5, max: number = 150): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function generateRandomLocation(centerZip?: string, centerLat?: number, centerLng?: number, radiusMi?: number) {
  if (centerLat && centerLng && radiusMi) {
    // Generate random location within radius
    const radiusKm = radiusMi * 1.60934
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * radiusKm
    
    const latOffset = (distance / 111) * Math.cos(angle)
    const lngOffset = (distance / 111) * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180)
    
    return {
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset
    }
  }
  
  // Fallback to random major metro
  const metro = getRandomElement(MAJOR_METROS)
  return {
    lat: metro.lat + (Math.random() - 0.5) * 0.1, // Add some randomness
    lng: metro.lng + (Math.random() - 0.5) * 0.1,
    city: metro.city,
    state: metro.state
  }
}

function generateDateWindow(windowType: 'this_weekend' | 'next_weekend' | 'mixed'): { start: Date; end: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let startDate: Date
  let endDate: Date
  
  switch (windowType) {
    case 'this_weekend':
      // This weekend (Saturday-Sunday)
      const thisSaturday = new Date(today)
      thisSaturday.setDate(today.getDate() + (6 - today.getDay()))
      startDate = thisSaturday
      endDate = new Date(thisSaturday)
      endDate.setDate(thisSaturday.getDate() + 1)
      break
      
    case 'next_weekend':
      // Next weekend (Saturday-Sunday)
      const nextSaturday = new Date(today)
      nextSaturday.setDate(today.getDate() + (6 - today.getDay()) + 7)
      startDate = nextSaturday
      endDate = new Date(nextSaturday)
      endDate.setDate(nextSaturday.getDate() + 1)
      break
      
    case 'mixed':
    default:
      // Random date within next 30 days
      const randomDays = Math.floor(Math.random() * 30) + 1
      startDate = new Date(today)
      startDate.setDate(today.getDate() + randomDays)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 3) + 1) // 1-3 days
      break
  }
  
  return { start: startDate, end: endDate }
}

function generateSaleData(
  sellerId: string,
  centerZip?: string,
  centerLat?: number,
  centerLng?: number,
  radiusMi?: number,
  dateWindow?: 'this_weekend' | 'next_weekend' | 'mixed'
) {
  const location = generateRandomLocation(centerZip, centerLat, centerLng, radiusMi)
  const dateRange = generateDateWindow(dateWindow || 'mixed')
  
  // Random start time between 8 AM and 10 AM
  const startHour = 8 + Math.floor(Math.random() * 3)
  const startMinute = Math.floor(Math.random() * 4) * 15 // 0, 15, 30, 45
  
  const startDate = new Date(dateRange.start)
  startDate.setHours(startHour, startMinute, 0, 0)
  
  const endDate = new Date(startDate)
  endDate.setHours(startDate.getHours() + 4 + Math.floor(Math.random() * 4)) // 4-7 hours duration
  
  const title = getRandomElement(SALE_TITLES)
  const description = getRandomElement(SALE_DESCRIPTIONS)
  
  // Generate 2-4 random categories
  const categories = getRandomElements(CANONICAL_CATEGORIES, 2 + Math.floor(Math.random() * 3))
  
  // Generate 2-3 items
  const itemCount = 2 + Math.floor(Math.random() * 2)
  const items = []
  
  for (let i = 0; i < itemCount; i++) {
    const category = getRandomElement(categories)
    const itemName = getRandomElement((ITEMS_BY_CATEGORY as any)[category] || ['Item'])
    const price = generateRandomPrice()
    
    items.push({
      name: itemName,
      price: Math.round(price * 100) // Convert to cents
    })
  }
  
  return {
    owner_id: sellerId,
    title: `${title} — ${location.city || 'City'}, ${location.state || 'ST'}`,
    description,
    address: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Pine St', 'Elm Dr', 'Cedar Ln'])}`,
    city: location.city || 'City',
    state: location.state || 'ST',
    zip_code: centerZip || null,
    lat: location.lat,
    lng: location.lng,
    date_start: startDate.toISOString().split('T')[0],
    time_start: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
    date_end: endDate.toISOString().split('T')[0],
    time_end: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
    tags: categories,
    status: 'published',
    privacy_mode: 'exact',
    is_featured: Math.random() < 0.1, // 10% chance of being featured
    items
  }
}

export async function POST(req: NextRequest) {
  // Rate limit check
  const adminRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      return `admin_rate_limit:${ip}`
    }
  })
  
  const rateLimitResult = await adminRateLimiter.checkLimit(req)
  if (!rateLimitResult.success) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
  }

  // Idempotency check
  const idempotencyKey = req.headers.get('Idempotency-Key')
  if (idempotencyKey) {
    const idempotencyStatus = checkAndSetIdempotency(idempotencyKey)
    if (idempotencyStatus === 'replay') {
      return NextResponse.json({ ok: true, status: 'idempotent_replay' })
    }
  }

  return await processGenerateRequest(req)
}

async function processGenerateRequest(req: NextRequest): Promise<NextResponse> {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { count, centerZip, radiusMi, dateWindow } = body

    // Validate inputs
    if (!count || count < 1 || count > 1000) {
      return NextResponse.json({ ok: false, error: 'Count must be between 1 and 1000' }, { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const startedAt = Date.now()

        // Get a random seller ID (or create one if none exist)
        const { data: users } = await supabase
          .from('profiles_v2')
          .select('user_id')
          .limit(1)

    let sellerId = 'b2750036-4a71-404a-9020-1734b5b888b1' // Default fallback
    if (users && users.length > 0) {
      sellerId = users[Math.floor(Math.random() * users.length)].user_id
    }

    // Look up center coordinates if centerZip provided
    let centerLat: number | undefined
    let centerLng: number | undefined
    
        if (centerZip) {
          const { data: zipData } = await supabase
            .from('zipcodes_v2')
            .select('lat, lng')
            .eq('zip', centerZip)
            .single()
      
      if (zipData) {
        centerLat = zipData.lat
        centerLng = zipData.lng
      }
    }

    console.log(`[GENERATE] Starting generation of ${count} sales...`)
    
    let inserted = 0
    let skipped = 0
    let itemsInserted = 0
    const errors: string[] = []

    // Process in batches of 50 for better performance
    const batchSize = 50
    const batches = Math.ceil(count / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const batchStart = batch * batchSize
      const batchEnd = Math.min(batchStart + batchSize, count)
      const batchCount = batchEnd - batchStart

      const salesToInsert = []
      const itemsToInsert = []

      // Generate sales for this batch
      for (let i = 0; i < batchCount; i++) {
        try {
          const saleData = generateSaleData(sellerId, centerZip, centerLat, centerLng, radiusMi, dateWindow)
          
              // Check for duplicates using the deduplication logic
              const { data: existing } = await supabase
                .from('sales_v2')
                .select('id')
                .eq('owner_id', saleData.owner_id)
                .ilike('title', saleData.title.toLowerCase())
                .eq('date_start', saleData.date_start)
                .gte('lat', Number((saleData.lat - 0.00005).toFixed(4)))
                .lte('lat', Number((saleData.lat + 0.00005).toFixed(4)))
                .gte('lng', Number((saleData.lng - 0.00005).toFixed(4)))
                .lte('lng', Number((saleData.lng + 0.00005).toFixed(4)))
                .limit(1)
                .maybeSingle()

          if (existing) {
            skipped++
            continue
          }

          salesToInsert.push({
            owner_id: saleData.owner_id,
            title: saleData.title,
            description: saleData.description,
            address: saleData.address,
            city: saleData.city,
            state: saleData.state,
            zip_code: saleData.zip_code,
            lat: saleData.lat,
            lng: saleData.lng,
            date_start: saleData.date_start,
            time_start: saleData.time_start,
            date_end: saleData.date_end,
            time_end: saleData.time_end,
            tags: saleData.tags,
            status: saleData.status,
            privacy_mode: saleData.privacy_mode,
            is_featured: saleData.is_featured,
          })

        } catch (error: any) {
          errors.push(`Sale generation failed: ${error.message}`)
        }
      }

          // Insert sales batch (direct table access for writes)
          if (salesToInsert.length > 0) {
            const { data: insertedSales, error: salesError } = await supabase
              .from('lootaura_v2.sales')
              .insert(salesToInsert)
              .select('id')

        if (salesError) {
          errors.push(`Batch ${batch + 1} sales insert failed: ${salesError.message}`)
        } else {
          inserted += insertedSales.length

          // Insert items for each sale
          for (let i = 0; i < insertedSales.length; i++) {
            const saleId = insertedSales[i].id
            const saleData = salesToInsert[i]
            const originalSaleData = generateSaleData(sellerId, centerZip, centerLat, centerLng, radiusMi, dateWindow)
            
            // Find the matching sale data to get items
            const matchingSale = salesToInsert.find(s => s.title === saleData.title)
            if (matchingSale) {
              const items = originalSaleData.items || []
              for (const item of items) {
                itemsToInsert.push({
                  sale_id: saleId,
                  name: item.name,
                  price: item.price,
                  category: null,
                  condition: null,
                  images: [],
                  is_sold: false,
                })
              }
            }
          }
        }
      }

          // Insert items batch (direct table access for writes)
          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from('lootaura_v2.items')
              .insert(itemsToInsert)

        if (itemsError) {
          errors.push(`Batch ${batch + 1} items insert failed: ${itemsError.message}`)
        } else {
          itemsInserted += itemsToInsert.length
        }
      }

      console.log(`[GENERATE] Batch ${batch + 1}/${batches} completed: ${inserted} sales, ${itemsInserted} items`)
    }

    const durationMs = Date.now() - startedAt

    console.log(`[GENERATE] Completed in ${durationMs}ms: inserted=${inserted}, skipped=${skipped}, itemsInserted=${itemsInserted}`)

    return NextResponse.json({
      ok: errors.length === 0,
      inserted,
      skipped,
      itemsInserted,
      durationMs,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('[GENERATE] Fatal error:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
