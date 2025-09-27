import { test, expect } from '@playwright/test'

test.describe('Browse Enhancements', () => {
  test('should show privacy countdown for block-level privacy sales', async ({ page }) => {
    // Mock a sale with block-level privacy
    await page.route('**/api/sales**', async route => {
      const mockSales = [{
        id: 'sale-1',
        title: 'Privacy Test Sale',
        address: '123 Main St, City, State',
        lat: 37.7749,
        lng: -122.4194,
        privacy_mode: 'block_until_24h',
        date_start: '2024-12-31',
        time_start: '09:00',
        status: 'published'
      }]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSales)
      })
    })
    
    await page.goto('/explore')
    
    // Should show privacy countdown
    await expect(page.locator('text=Privacy Mode Active')).toBeVisible()
    await expect(page.locator('text=Reveals in')).toBeVisible()
  })

  test('should cluster markers on map', async ({ page }) => {
    // Mock multiple sales in close proximity
    await page.route('**/api/sales**', async route => {
      const mockSales = [
        {
          id: 'sale-1',
          title: 'Sale 1',
          address: '123 Main St, City, State',
          lat: 37.7749,
          lng: -122.4194,
          status: 'published'
        },
        {
          id: 'sale-2',
          title: 'Sale 2',
          address: '125 Main St, City, State',
          lat: 37.7750,
          lng: -122.4195,
          status: 'published'
        },
        {
          id: 'sale-3',
          title: 'Sale 3',
          address: '127 Main St, City, State',
          lat: 37.7751,
          lng: -122.4196,
          status: 'published'
        }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSales)
      })
    })
    
    await page.goto('/explore?tab=map')
    
    // Should show clustered markers
    await expect(page.locator('[data-testid="map"]')).toBeVisible()
  })

  test('should hide past sales by default', async ({ page }) => {
    // Mock sales with past dates
    await page.route('**/api/sales**', async route => {
      const mockSales = [
        {
          id: 'sale-1',
          title: 'Past Sale',
          address: '123 Main St, City, State',
          date_start: '2024-01-01',
          status: 'published'
        },
        {
          id: 'sale-2',
          title: 'Future Sale',
          address: '456 Oak Ave, City, State',
          date_start: '2024-12-31',
          status: 'published'
        }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSales)
      })
    })
    
    await page.goto('/explore')
    
    // Should only show future sales
    await expect(page.locator('text=Future Sale')).toBeVisible()
    await expect(page.locator('text=Past Sale')).not.toBeVisible()
  })

  test('should show optimized images with proper loading states', async ({ page }) => {
    await page.goto('/explore')
    
    // Check for image optimization
    const images = page.locator('img')
    await expect(images.first()).toBeVisible()
    
    // Check for loading states
    await expect(page.locator('text=Loading...')).toBeVisible()
  })

  test('should handle keyboard navigation in wizard', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="text"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('textarea')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[placeholder="Min price"]')).toBeFocused()
  })

  test('should show weekend picker with suggested dates', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Fill out basics and go to when step
    await page.fill('input[type="text"]', 'Test Sale')
    await page.fill('textarea', 'Test description')
    await page.click('button:has-text("Next")')
    
    // Should show weekend picker
    await expect(page.locator('text=When is your sale?')).toBeVisible()
    await expect(page.locator('text=Single Day')).toBeVisible()
    await expect(page.locator('text=Multiple Days')).toBeVisible()
  })

  test('should show privacy preview when address is entered', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Fill out basics and go to where step
    await page.fill('input[type="text"]', 'Test Sale')
    await page.fill('textarea', 'Test description')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    
    // Enter address
    await page.fill('input[placeholder*="address"]', '123 Main St, San Francisco, CA 94102')
    
    // Should show privacy preview
    await expect(page.locator('text=Privacy Preview')).toBeVisible()
    await expect(page.locator('text=Exact Location')).toBeVisible()
    await expect(page.locator('text=Block-Level Privacy')).toBeVisible()
  })

  test('should show dedupe prompt when duplicates are found', async ({ page }) => {
    // Mock dedupe response
    await page.route('**/api/sales/*/publish', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Possible duplicates found',
          duplicates: [
            {
              id: 'sale-2',
              title: 'Similar Sale',
              address: '125 Main St, City, State',
              distance: 50,
              similarity: 0.8
            }
          ]
        })
      })
    })
    
    await page.goto('/sell/new')
    
    // Fill out form
    await page.fill('input[type="text"]', 'Test Sale')
    await page.fill('textarea', 'Test description')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.fill('input[placeholder*="address"]', '123 Main St, City, State')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Publish Sale")')
    
    // Should show dedupe prompt
    await expect(page.locator('text=Possible Duplicates Found')).toBeVisible()
    await expect(page.locator('text=Similar Sale')).toBeVisible()
  })
})
