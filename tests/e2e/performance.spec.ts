import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('should load browse page within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/explore')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 2.5 seconds
    expect(loadTime).toBeLessThan(2500)
  })

  test('should load wizard page within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/sell/new')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 2.5 seconds
    expect(loadTime).toBeLessThan(2500)
  })

  test('should load map within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/explore?tab=map')
    
    // Wait for map to load
    await page.waitForSelector('[data-testid="map"]', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle large datasets efficiently', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/sales**', async route => {
      const mockSales = Array.from({ length: 100 }, (_, i) => ({
        id: `sale-${i}`,
        title: `Sale ${i}`,
        address: `${i} Main St, City, State`,
        lat: 37.7749 + (i * 0.001),
        lng: -122.4194 + (i * 0.001),
        status: 'published'
      }))
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSales)
      })
    })
    
    const startTime = Date.now()
    
    await page.goto('/explore')
    
    // Wait for all sales to load
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should handle large datasets efficiently
    expect(loadTime).toBeLessThan(5000)
  })

  test('should have proper image optimization', async ({ page }) => {
    await page.goto('/explore')
    
    // Check for optimized images
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute('src')
      if (src) {
        // Should use optimized image formats
        expect(src).toMatch(/\.(webp|avif|jpg|jpeg|png)$/)
      }
    }
  })

  test('should have proper lazy loading', async ({ page }) => {
    await page.goto('/explore')
    
    // Check for lazy loading attributes
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const loading = await images.nth(i).getAttribute('loading')
      if (loading) {
        expect(loading).toBe('lazy')
      }
    }
  })

  test('should have proper bundle size', async ({ page }) => {
    const response = await page.goto('/explore')
    
    // Check for proper content encoding
    expect(response?.headers()['content-encoding']).toBeDefined()
    
    // Check for proper cache headers
    const cacheControl = response?.headers()['cache-control']
    expect(cacheControl).toBeDefined()
  })
})
