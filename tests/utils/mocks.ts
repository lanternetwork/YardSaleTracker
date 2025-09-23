import { readFileSync } from 'fs'
import { join } from 'path'

// Load address fixtures
const addresses = JSON.parse(
  readFileSync(join(process.cwd(), 'tests', 'fixtures', 'addresses.json'), 'utf-8')
)

export interface MockAddress {
  address: string
  lat: number
  lng: number
  formatted_address: string
  city: string
  state: string
  zip: string
}

// Google Maps JS Loader Mock
export class MockGoogleMapsLoader {
  private apiKey: string
  private libraries: string[]

  constructor({ apiKey, libraries }: { apiKey: string; libraries: string[] }) {
    this.apiKey = apiKey
    this.libraries = libraries
  }

  async load() {
    // Mock the global google object
    if (typeof window !== 'undefined') {
      (window as any).google = {
        maps: {
          places: {
            Autocomplete: class MockAutocomplete {
              private input: HTMLInputElement
              private fields: string[]
              private listeners: { [key: string]: Function[] } = {}

              constructor(input: HTMLInputElement, options: { fields: string[] }) {
                this.input = input
                this.fields = options.fields
              }

              addListener(event: string, callback: Function) {
                if (!this.listeners[event]) {
                  this.listeners[event] = []
                }
                this.listeners[event].push(callback)
              }

              getPlace() {
                const value = this.input.value
                const address = addresses.find((addr: MockAddress) => 
                  addr.address.toLowerCase().includes(value.toLowerCase()) ||
                  addr.formatted_address.toLowerCase().includes(value.toLowerCase())
                )

                if (address) {
                  return {
                    formatted_address: address.formatted_address,
                    geometry: {
                      location: {
                        lat: () => address.lat,
                        lng: () => address.lng
                      }
                    },
                    address_components: [
                      { long_name: address.city, types: ['locality'] },
                      { short_name: address.state, types: ['administrative_area_level_1'] },
                      { long_name: address.zip, types: ['postal_code'] }
                    ]
                  }
                }

                return {
                  formatted_address: value,
                  geometry: null,
                  address_components: []
                }
              }

              // Simulate place_changed event
              simulatePlaceChanged() {
                const callbacks = this.listeners['place_changed'] || []
                callbacks.forEach(callback => callback())
              }
            }
          },
          Map: class MockMap {
            constructor(container: HTMLElement, options: any) {
              // Mock map initialization
            }
          },
          Marker: class MockMarker {
            constructor(options: any) {
              // Mock marker creation
            }
            setMap(map: any) {
              // Mock setMap
            }
            addListener(event: string, callback: Function) {
              // Mock event listener
            }
            getPosition() {
              return { lat: () => 37.7749, lng: () => -122.4194 }
            }
          },
          InfoWindow: class MockInfoWindow {
            constructor(options: any) {
              // Mock info window
            }
            open(options: any) {
              // Mock open
            }
            close() {
              // Mock close
            }
          },
          LatLngBounds: class MockLatLngBounds {
            extend(position: any) {
              // Mock extend
            }
            isEmpty() {
              return false
            }
          },
          LatLng: class MockLatLng {
            constructor(public lat: number, public lng: number) {}
          },
          event: {
            addListener: (map: any, event: string, callback: Function) => {
              // Mock event listener
              return { remove: () => {} }
            },
            removeListener: (listener: any) => {
              // Mock remove listener
            }
          },
          ControlPosition: {
            TOP_LEFT: 'TOP_LEFT'
          },
          Size: class MockSize {
            constructor(public width: number, public height: number) {}
          }
        }
      }
    }
  }
}

// Nominatim Mock
export function mockNominatimFetch() {
  const originalFetch = global.fetch
  
  global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    const urlString = url.toString()
    
    if (urlString.includes('nominatim.openstreetmap.org')) {
      const searchParams = new URL(urlString).searchParams
      const query = searchParams.get('q')
      
      const address = addresses.find((addr: MockAddress) => 
        addr.address.toLowerCase().includes(query?.toLowerCase() || '') ||
        addr.formatted_address.toLowerCase().includes(query?.toLowerCase() || '')
      )

      if (address) {
        return new Response(JSON.stringify([{
          lat: address.lat.toString(),
          lon: address.lng.toString(),
          display_name: address.formatted_address,
          address: {
            city: address.city,
            state: address.state,
            postcode: address.zip
          }
        }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return originalFetch(url, init)
  }

  return () => {
    global.fetch = originalFetch
  }
}

// Supabase Client Mock
export function createMockSupabaseClient() {
  const mockSales: any[] = []
  let nextId = 1

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: (table: string) => {
      if (table === 'yard_sales') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: any[]) => {
            const newSale = {
              id: `sale-${nextId++}`,
              ...data[0],
              owner_id: 'test-user-id',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            mockSales.push(newSale)
            return {
              data: [newSale],
              error: null
            }
          }),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            return {
              data: mockSales[0] || null,
              error: null
            }
          })
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      }
    },
    rpc: vi.fn().mockImplementation((functionName: string, params: any) => {
      if (functionName === 'search_sales') {
        return {
          data: mockSales,
          error: null
        } as any
      }
      return {
        data: [],
        error: null
      } as any
    })
  }
}

// Enable/Disable functions for E2E
export function enableMocks() {
  // Mock Google Maps Loader
  vi.mock('@googlemaps/js-api-loader', () => ({
    Loader: MockGoogleMapsLoader
  }))

  // Mock Supabase
  vi.mock('@/lib/supabase/client', () => ({
    createSupabaseBrowser: () => createMockSupabaseClient()
  }))

  // Mock geocoding
  vi.mock('@/lib/geocode', () => ({
    geocodeAddress: vi.fn().mockImplementation(async (address: string) => {
      const found = addresses.find((addr: MockAddress) => 
        addr.address.toLowerCase().includes(address.toLowerCase()) ||
        addr.formatted_address.toLowerCase().includes(address.toLowerCase())
      )
      
      if (found) {
        return {
          lat: found.lat,
          lng: found.lng,
          formatted_address: found.formatted_address,
          city: found.city,
          state: found.state,
          zip: found.zip
        }
      }
      return null
    })
  }))
}

export function disableMocks() {
  vi.restoreAllMocks()
}

// Helper to get address fixtures
export function getAddressFixtures(): MockAddress[] {
  return addresses
}
