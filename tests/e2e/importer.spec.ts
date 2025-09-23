import { test, expect } from '@playwright/test'

test.describe('Craigslist Importer E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /api/scrape endpoint
    await page.route('**/api/scrape', async (route) => {
      const mockResults = [
        {
          id: 'cl_test_1',
          title: 'Multi-Family Garage Sale - Moving!',
          description: 'Found on Craigslist sfbay',
          start_at: '2025-01-27T10:30:00-0800',
          price_min: 5,
          price_max: 50,
          source: 'craigslist',
          url: 'https://sfbay.craigslist.org/gms/d/garage-sale-multi-family/1234567890.html'
        },
        {
          id: 'cl_test_2',
          title: 'Estate Sale - Antique Furniture & Tools',
          description: 'Found on Craigslist sfbay',
          start_at: '2025-01-27T09:15:00-0800',
          price_min: 10,
          price_max: 200,
          source: 'craigslist',
          url: 'https://sfbay.craigslist.org/gms/d/estate-sale-furniture/1234567891.html'
        },
        {
          id: 'cl_test_3',
          title: 'Yard Sale - Kids Toys & Books',
          description: 'Found on Craigslist sfbay',
          start_at: '2025-01-26T14:20:00-0800',
          price_min: 1,
          price_max: 25,
          source: 'craigslist',
          url: 'https://sfbay.craigslist.org/gms/d/yard-sale-kids-toys/1234567892.html'
        }
      ]

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: mockResults,
          total: mockResults.length,
          city: 'sfbay',
          query: 'garage sale'
        })
      })
    })

    // Mock the createSale mutation
    await page.route('**/api/sales', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'created_sale_' + Date.now(),
            success: true
          })
        })
      }
    })

    // Mock geocoding
    await page.route('**/maps.googleapis.com/maps/api/geocode/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [{
            geometry: {
              location: {
                lat: 37.7749,
                lng: -122.4194
              }
            },
            formatted_address: 'San Francisco, CA, USA'
          }]
        })
      })
    })
  })

  test('should import sales from Craigslist and show them in List', async ({ page }) => {
    // Navigate to explore page
    await page.goto('/explore')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Click on Import tab
    await page.click('text=Import')
    
    // Wait for import form to be visible
    await page.waitForSelector('text=Import Sales from Craigslist')
    
    // Fill in search form
    await page.selectOption('select', 'sfbay')
    await page.fill('input[placeholder*="garage sale"]', 'garage sale')
    
    // Click search button
    await page.click('button:has-text("Search Craigslist")')
    
    // Wait for results to load
    await page.waitForSelector('text=Found 3 sales', { timeout: 10000 })
    
    // Verify results are displayed
    await expect(page.locator('text=Multi-Family Garage Sale - Moving!')).toBeVisible()
    await expect(page.locator('text=Estate Sale - Antique Furniture & Tools')).toBeVisible()
    await expect(page.locator('text=Yard Sale - Kids Toys & Books')).toBeVisible()
    
    // Select first two items
    await page.check('input[type="checkbox"]:near(text="Multi-Family Garage Sale - Moving!")')
    await page.check('input[type="checkbox"]:near(text="Estate Sale - Antique Furniture & Tools")')
    
    // Verify import button shows correct count
    await expect(page.locator('button:has-text("Import 2 Selected")')).toBeVisible()
    
    // Click import button
    await page.click('button:has-text("Import 2 Selected")')
    
    // Wait for success message
    await page.waitForSelector('text=Successfully imported 2 sales!', { timeout: 10000 })
    
    // Navigate to List tab
    await page.click('text=List')
    
    // Wait for list to load
    await page.waitForLoadState('networkidle')
    
    // Verify imported sales appear in list
    await expect(page.locator('text=Multi-Family Garage Sale - Moving!')).toBeVisible()
    await expect(page.locator('text=Estate Sale - Antique Furniture & Tools')).toBeVisible()
    
    // Verify source is shown
    await expect(page.locator('text=craigslist')).toBeVisible()
  })

  test('should handle import errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/scrape', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Scraping failed',
          message: 'Network timeout'
        })
      })
    })

    // Navigate to explore page
    await page.goto('/explore')
    
    // Click on Import tab
    await page.click('text=Import')
    
    // Fill in search form
    await page.selectOption('select', 'sfbay')
    await page.fill('input[placeholder*="garage sale"]', 'garage sale')
    
    // Click search button
    await page.click('button:has-text("Search Craigslist")')
    
    // Wait for error message
    await page.waitForSelector('text=Scraping failed', { timeout: 10000 })
    
    // Verify error is displayed
    await expect(page.locator('text=Scraping failed')).toBeVisible()
  })

  test('should show map markers for imported sales with coordinates', async ({ page }) => {
    // Navigate to explore page
    await page.goto('/explore')
    
    // Click on Import tab
    await page.click('text=Import')
    
    // Fill in search form
    await page.selectOption('select', 'sfbay')
    await page.fill('input[placeholder*="garage sale"]', 'garage sale')
    
    // Click search button
    await page.click('button:has-text("Search Craigslist")')
    
    // Wait for results
    await page.waitForSelector('text=Found 3 sales')
    
    // Select one item
    await page.check('input[type="checkbox"]:near(text="Multi-Family Garage Sale - Moving!")')
    
    // Click import
    await page.click('button:has-text("Import 1 Selected")')
    
    // Wait for success
    await page.waitForSelector('text=Successfully imported 1 sales!')
    
    // Navigate to Map tab
    await page.click('text=Map')
    
    // Wait for map to load
    await page.waitForLoadState('networkidle')
    
    // Verify map is visible (Google Maps should load)
    await expect(page.locator('[data-testid="yard-sale-map"]')).toBeVisible()
    
    // Take screenshot for verification
    await page.screenshot({ path: 'tests/e2e/screenshots/importer-map.png' })
  })

  test('should handle select all functionality', async ({ page }) => {
    // Navigate to explore page
    await page.goto('/explore')
    
    // Click on Import tab
    await page.click('text=Import')
    
    // Fill in search form
    await page.selectOption('select', 'sfbay')
    await page.fill('input[placeholder*="garage sale"]', 'garage sale')
    
    // Click search button
    await page.click('button:has-text("Search Craigslist")')
    
    // Wait for results
    await page.waitForSelector('text=Found 3 sales')
    
    // Click select all
    await page.click('button:has-text("Select All")')
    
    // Verify all items are selected
    const checkboxes = page.locator('input[type="checkbox"]:checked')
    await expect(checkboxes).toHaveCount(3)
    
    // Verify import button shows correct count
    await expect(page.locator('button:has-text("Import 3 Selected")')).toBeVisible()
    
    // Click deselect all
    await page.click('button:has-text("Deselect All")')
    
    // Verify no items are selected
    const uncheckedCheckboxes = page.locator('input[type="checkbox"]:not(:checked)')
    await expect(uncheckedCheckboxes).toHaveCount(3)
  })
})
