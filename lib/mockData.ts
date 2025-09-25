import { Sale } from './types'

export const mockSales: Sale[] = [
  {
    id: 'mock-1',
    title: 'Sample Garage Sale',
    description: 'This is a sample sale for testing purposes',
    address: '123 Main St, Anytown, USA',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    lat: 37.7749,
    lng: -122.4194,
    start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    tags: ['furniture', 'electronics'],
    price_min: 5,
    price_max: 50,
    contact: 'sample@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'mock-user'
  },
  {
    id: 'mock-2',
    title: 'Estate Sale - Antiques',
    description: 'Beautiful antique furniture and collectibles',
    address: '456 Oak Ave, Another City, USA',
    city: 'Another City',
    state: 'NY',
    zip: '67890',
    lat: 40.7128,
    lng: -74.0060,
    start_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['antiques', 'furniture', 'collectibles'],
    price_min: 25,
    price_max: 200,
    contact: 'estate@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'mock-user'
  }
]

export function getMockSales(): Sale[] {
  console.warn('Using mock data - database connection failed')
  return mockSales
}
