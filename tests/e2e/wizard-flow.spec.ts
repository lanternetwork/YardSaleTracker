import { test, expect } from '@playwright/test'

test.describe('Wizard Flow', () => {
  test('should complete wizard flow as anonymous user', async ({ page }) => {
    // Navigate to the wizard
    await page.goto('/sell/new')
    
    // Step 1: Basics
    await expect(page.locator('h2')).toContainText('What are you selling?')
    await page.fill('input[type="text"]', 'Vintage Furniture Sale')
    await page.fill('textarea', 'Amazing collection of vintage furniture and home decor')
    await page.fill('input[placeholder="Min price"]', '50')
    await page.fill('input[placeholder="Max price"]', '500')
    await page.click('button:has-text("Next")')
    
    // Step 2: When
    await expect(page.locator('h2')).toContainText('When is your sale?')
    await page.fill('input[type="date"]', '2024-12-28')
    await page.fill('input[type="time"]', '09:00')
    await page.click('button:has-text("Next")')
    
    // Step 3: Where
    await expect(page.locator('h2')).toContainText('Where is your sale?')
    await page.fill('input[placeholder*="address"]', '123 Main St, San Francisco, CA 94102')
    await page.click('input[value="block_until_24h"]')
    await page.click('button:has-text("Next")')
    
    // Step 4: Preview
    await expect(page.locator('h2')).toContainText('Preview Your Sale')
    await expect(page.locator('h3')).toContainText('Vintage Furniture Sale')
    await expect(page.locator('text=Privacy Mode Active')).toBeVisible()
    
    // Publish (should redirect to auth)
    await page.click('button:has-text("Publish Sale")')
    
    // Should redirect to sign in
    await expect(page).toHaveURL(/\/signin/)
  })

  test('should persist wizard data through auth flow', async ({ page }) => {
    // Start wizard
    await page.goto('/sell/new')
    
    // Fill out basic info
    await page.fill('input[type="text"]', 'Test Sale')
    await page.fill('textarea', 'Test description')
    await page.fill('input[placeholder*="address"]', '123 Test St, Test City, TC 12345')
    await page.fill('input[type="date"]', '2024-12-28')
    await page.fill('input[type="time"]', '10:00')
    
    // Go through all steps
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    
    // Should be on preview step
    await expect(page.locator('h2')).toContainText('Preview Your Sale')
    
    // Publish should redirect to auth
    await page.click('button:has-text("Publish Sale")')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('should show privacy mode correctly', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Fill out form
    await page.fill('input[type="text"]', 'Privacy Test Sale')
    await page.fill('textarea', 'Testing privacy mode')
    await page.fill('input[placeholder*="address"]', '123 Privacy St, Test City, TC 12345')
    await page.fill('input[type="date"]', '2024-12-28')
    await page.fill('input[type="time"]', '10:00')
    
    // Go to where step
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    
    // Select block-level privacy
    await page.click('input[value="block_until_24h"]')
    await page.click('button:has-text("Next")')
    
    // Should show privacy mode in preview
    await expect(page.locator('text=Privacy Mode Active')).toBeVisible()
    await expect(page.locator('text=Your exact address will be hidden')).toBeVisible()
  })

  test('should handle weekend picker correctly', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Fill out basics
    await page.fill('input[type="text"]', 'Weekend Test Sale')
    await page.fill('textarea', 'Testing weekend picker')
    await page.fill('input[placeholder*="address"]', '123 Weekend St, Test City, TC 12345')
    
    // Go to when step
    await page.click('button:has-text("Next")')
    
    // Set weekend dates
    await page.fill('input[type="date"]', '2024-12-28') // Saturday
    await page.fill('input[type="date"]:nth-of-type(2)', '2024-12-29') // Sunday
    await page.fill('input[type="time"]', '09:00')
    await page.fill('input[type="time"]:nth-of-type(2)', '17:00')
    
    await page.click('button:has-text("Next")')
    await page.click('button:has-text("Next")')
    
    // Should show both dates in preview
    await expect(page.locator('text=2024-12-28')).toBeVisible()
    await expect(page.locator('text=2024-12-29')).toBeVisible()
  })
})

test.describe('Browse URL Persistence', () => {
  test('should persist filters in URL', async ({ page }) => {
    await page.goto('/explore?q=test&maxKm=10&dateFrom=2024-12-01&dateTo=2024-12-31')
    
    // Check that filters are applied
    await expect(page.locator('input[value="test"]')).toBeVisible()
    await expect(page.locator('input[value="10"]')).toBeVisible()
    await expect(page.locator('input[value="2024-12-01"]')).toBeVisible()
    await expect(page.locator('input[value="2024-12-31"]')).toBeVisible()
  })

  test('should restore filters on back/forward', async ({ page }) => {
    await page.goto('/explore')
    
    // Set some filters
    await page.fill('input[placeholder*="search"]', 'furniture')
    await page.fill('input[placeholder*="distance"]', '15')
    
    // Navigate away and back
    await page.goto('/')
    await page.goBack()
    
    // Filters should be restored
    await expect(page.locator('input[value="furniture"]')).toBeVisible()
    await expect(page.locator('input[value="15"]')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="text"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('textarea')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[placeholder="Min price"]')).toBeFocused()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check for proper labels
    await expect(page.locator('label:has-text("Title")')).toBeVisible()
    await expect(page.locator('label:has-text("Description")')).toBeVisible()
    await expect(page.locator('label:has-text("Address")')).toBeVisible()
  })
})
