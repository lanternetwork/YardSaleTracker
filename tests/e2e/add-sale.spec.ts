import { test, expect } from '@playwright/test'

test.describe('Add Sale E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/auth/v1/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            aud: 'authenticated'
          }
        })
      })
    })

    // Mock Supabase sales API
    await page.route('**/rest/v1/yard_sales**', async (route) => {
      if (route.request().method() === 'POST') {
        // Mock successful creation
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'sale-123',
            title: 'Neighborhood Sale',
            address: '1600 Amphitheatre Parkway, Mountain View, CA',
            lat: 37.422,
            lng: -122.084,
            owner_id: 'test-user-id',
            created_at: new Date().toISOString(),
            tags: [],
            photos: []
          })
        })
      } else {
        // Mock sales list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'sale-123',
              title: 'Neighborhood Sale',
              address: '1600 Amphitheatre Parkway, Mountain View, CA',
              lat: 37.422,
              lng: -122.084,
              owner_id: 'test-user-id',
              created_at: new Date().toISOString(),
              tags: [],
              photos: []
            }
          ])
        })
      }
    })

    // Mock Google Maps API
    await page.route('**/maps.googleapis.com/maps/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [{
            geometry: {
              location: {
                lat: 37.422,
                lng: -122.084
              }
            },
            formatted_address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
            address_components: [
              { long_name: 'Mountain View', types: ['locality'] },
              { short_name: 'CA', types: ['administrative_area_level_1'] },
              { long_name: '94043', types: ['postal_code'] }
            ]
          }]
        })
      })
    })

    // Mock Google Maps JS API
    await page.addInitScript(() => {
      (window as any).google = {
        maps: {
          places: {
            Autocomplete: class MockAutocomplete {
              constructor(input: HTMLInputElement, options: any) {
                this.input = input
                this.options = options
              }
              
              addListener(event: string, callback: Function) {
                if (event === 'place_changed') {
                  // Simulate place selection after typing
                  this.input.addEventListener('input', () => {
                    if (this.input.value.includes('Amphitheatre')) {
                      setTimeout(() => callback(), 100)
                    }
                  })
                }
              }
              
              getPlace() {
                if (this.input.value.includes('Amphitheatre')) {
                  return {
                    formatted_address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
                    geometry: {
                      location: {
                        lat: () => 37.422,
                        lng: () => -122.084
                      }
                    },
                    address_components: [
                      { long_name: 'Mountain View', types: ['locality'] },
                      { short_name: 'CA', types: ['administrative_area_level_1'] },
                      { long_name: '94043', types: ['postal_code'] }
                    ]
                  }
                }
                return { formatted_address: this.input.value, geometry: null }
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
              return { lat: () => 37.422, lng: () => -122.084 }
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
              return { remove: () => {} }
            },
            removeListener: (listener: any) => {}
          },
          ControlPosition: {
            TOP_LEFT: 'TOP_LEFT'
          },
          Size: class MockSize {
            constructor(public width: number, public height: number) {}
          }
        }
      }
    })

    // Mock Google Maps Loader
    await page.addInitScript(() => {
      (window as any).google = {
        ...(window as any).google,
        maps: {
          ...(window as any).google?.maps,
          // Add any additional mocks if needed
        }
      }
    })
  })

  test('should complete full add sale flow', async ({ page }) => {
    // Navigate to explore page with add tab
    await page.goto('/explore?tab=add')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Verify add sale form is visible
    await expect(page.locator('h2:has-text("Post Your Sale")')).toBeVisible()
    
    // Fill in the form
    await page.fill('input[name="title"]', 'Neighborhood Sale')
    await page.fill('input[name="address"]', '1600 Amphitheatre Parkway, Mountain View, CA')
    
    // Wait for address autocomplete to trigger
    await page.waitForTimeout(500)
    
    // Verify location was found
    await expect(page.locator('text=✓ Location found')).toBeVisible()
    
    // Fill in optional fields
    await page.fill('textarea[name="description"]', 'Large neighborhood garage sale with furniture and electronics')
    await page.fill('input[name="start_at"]', '2025-02-01T09:00')
    await page.fill('input[name="end_at"]', '2025-02-01T17:00')
    await page.fill('input[name="price_min"]', '5')
    await page.fill('input[name="price_max"]', '100')
    await page.fill('input[name="contact"]', '555-123-4567')
    
    // Add a tag
    await page.fill('input[placeholder="Add a tag..."]', 'furniture')
    await page.press('input[placeholder="Add a tag..."]', 'Enter')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for success message
    await page.waitForSelector('text=Sale posted successfully!', { timeout: 10000 })
    
    // Navigate to List tab
    await page.click('text=List')
    
    // Wait for list to load
    await page.waitForLoadState('networkidle')
    
    // Verify the new sale appears in the list
    await expect(page.locator('text=Neighborhood Sale')).toBeVisible()
    await expect(page.locator('text=1600 Amphitheatre Parkway, Mountain View, CA')).toBeVisible()
    
    // Navigate to Map tab
    await page.click('text=Map')
    
    // Wait for map to load
    await page.waitForLoadState('networkidle')
    
    // Verify map is visible (should not show "No sales with locations found")
    await expect(page.locator('text=No sales with locations found')).not.toBeVisible()
    
    // Click on the sale in the list to go to details
    await page.click('text=View Details →')
    
    // Wait for details page to load
    await page.waitForLoadState('networkidle')
    
    // Verify details page shows correct information
    await expect(page.locator('h1:has-text("Neighborhood Sale")')).toBeVisible()
    await expect(page.locator('text=1600 Amphitheatre Parkway, Mountain View, CA')).toBeVisible()
    await expect(page.locator('text=Get Directions →')).toBeVisible()
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/e2e/screenshots/add-sale-flow.png' })
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/explore?tab=add')
    await page.waitForLoadState('networkidle')
    
    // Try to submit without required fields
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Please complete required fields')).toBeVisible()
  })

  test('should handle geocoding failure gracefully', async ({ page }) => {
    // Mock geocoding to fail
    await page.route('**/maps.googleapis.com/maps/api/geocode/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: []
        })
      })
    })

    await page.goto('/explore?tab=add')
    await page.waitForLoadState('networkidle')
    
    // Fill in form with address that won't geocode
    await page.fill('input[name="title"]', 'Test Sale')
    await page.fill('input[name="address"]', 'Invalid Address That Should Fail')
    
    // Wait a bit for geocoding attempt
    await page.waitForTimeout(1000)
    
    // Should not show location found message
    await expect(page.locator('text=✓ Location found')).not.toBeVisible()
    
    // Form should still be submittable
    await page.click('button[type="submit"]')
    
    // Should still create the sale (without coordinates)
    await page.waitForSelector('text=Sale posted successfully!', { timeout: 10000 })
  })

  test('should show loading state during submission', async ({ page }) => {
    // Mock slow API response
    await page.route('**/rest/v1/yard_sales**', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'sale-123',
            title: 'Test Sale',
            address: 'Test Address',
            owner_id: 'test-user-id',
            created_at: new Date().toISOString(),
            tags: [],
            photos: []
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    })

    await page.goto('/explore?tab=add')
    await page.waitForLoadState('networkidle')
    
    // Fill in form
    await page.fill('input[name="title"]', 'Test Sale')
    await page.fill('input[name="address"]', 'Test Address')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('text=Posting...')).toBeVisible()
    
    // Wait for completion
    await page.waitForSelector('text=Sale posted successfully!', { timeout: 10000 })
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/rest/v1/yard_sales**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    })

    await page.goto('/explore?tab=add')
    await page.waitForLoadState('networkidle')
    
    // Fill in form
    await page.fill('input[name="title"]', 'Test Sale')
    await page.fill('input[name="address"]', 'Test Address')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Internal server error')).toBeVisible()
  })
})
