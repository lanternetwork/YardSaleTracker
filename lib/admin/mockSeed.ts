export type MockSale = {
  title: string
  description?: string
  city: string
  state: string
  lat: number
  lng: number
  date_start: string // YYYY-MM-DD
  time_start: string // HH:mm
  price?: number
  is_featured?: boolean
  seller_id: string
  tags?: string[]
  items: Array<{
    name: string
    description?: string
    price_cents?: number
    category?: string
    condition?: string
    images?: string[]
  }>
}

// Small, realistic dataset (server-only)
import { CATEGORIES } from '@/lib/data/categories'

export const MOCK_SALES: MockSale[] = [
  {
    title: 'Neighborhood Multi-Family Sale',
    description: 'Toys, furniture, electronics, and kitchenware. Something for everyone!'
      + ' Early birds welcome.',
    city: 'Louisville',
    state: 'KY',
    lat: 38.2505,
    lng: -85.7571,
    date_start: new Date().toISOString().slice(0,10),
    time_start: '08:00',
    price: 0,
    is_featured: true,
    seller_id: '00000000-0000-0000-0000-000000000001',
    tags: [CATEGORIES[0], CATEGORIES[1], CATEGORIES[14]],
    items: [
      { name: 'IKEA Bookshelf', description: 'Good condition, white', price_cents: 2500, category: 'furniture' },
      { name: 'Sony 42\" TV', description: '1080p, works great', price_cents: 12000, category: 'electronics' },
      { name: 'Kitchenware Set', description: 'Pots and pans bundle', price_cents: 4000 }
    ]
  },
  {
    title: 'Moving Sale - Everything Must Go',
    description: 'Sofa, dining table, decor, and more. Cash only.',
    city: 'Louisville',
    state: 'KY',
    lat: 38.2552,
    lng: -85.7608,
    date_start: new Date(Date.now() + 86400000).toISOString().slice(0,10),
    time_start: '09:00',
    price: 0,
    seller_id: '00000000-0000-0000-0000-000000000002',
    tags: [CATEGORIES[0], CATEGORIES[7], CATEGORIES[20]],
    items: [
      { name: 'Sectional Sofa', description: 'Light wear', price_cents: 25000, category: 'furniture' },
      { name: 'Dining Table', description: 'Seats 6', price_cents: 18000, category: 'furniture' }
    ]
  },
  {
    title: 'Weekend Yard Sale - Tools & Garden',
    description: 'Power tools, lawn equipment, and garden supplies.',
    city: 'Louisville',
    state: 'KY',
    lat: 38.2601,
    lng: -85.7522,
    date_start: new Date(Date.now() + 2*86400000).toISOString().slice(0,10),
    time_start: '07:30',
    price: 0,
    seller_id: '00000000-0000-0000-0000-000000000003',
    tags: [CATEGORIES[2], CATEGORIES[8], CATEGORIES[21]],
    items: [
      { name: 'Cordless Drill', description: 'Includes charger', price_cents: 6000, category: 'tools' },
      { name: 'Lawn Mower', description: 'Gas-powered, runs well', price_cents: 15000, category: 'garden' },
      { name: 'Tool Set', description: 'Wrenches & sockets', price_cents: 4500, category: 'tools' }
    ]
  }
]


