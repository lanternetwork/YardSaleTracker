import { test, expect } from '@playwright/test'

test.describe('Sale Wizard', () => {
  test('should create and publish a sale (happy path)', async ({ page }) => {
    // Navigate to create sale page
    await page.goto('/sell/new')
    
    // Check if stabilize mode is active
    const stabilizeNotice = page.locator('text=Stabilize mode active in preview')
    if (await stabilizeNotice.isVisible()) {
      test.skip('Stabilize mode is active - skipping wizard test')
    }

    // Fill out the wizard
    await test.step('Fill out sale details', async () => {
      // Basics step
      await page.fill('input[placeholder*="Multi-Family Garage Sale"]', 'Test Garage Sale')
      await page.fill('textarea[placeholder*="Describe what you\'re selling"]', 'Great deals on furniture and electronics')
      await page.click('button:has-text("Next")')
    })

    await test.step('Set date and time', async () => {
      // When step
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      
      await page.fill('input[type="date"]', dateString)
      await page.fill('input[type="time"]', '10:00')
      await page.click('button:has-text("Next")')
    })

    await test.step('Set location', async () => {
      // Where step
      await page.fill('input[placeholder*="Enter your address"]', '123 Main St, San Francisco, CA 94102')
      await page.click('input[value="block_until_24h"]') // Select privacy mode
      await page.click('button:has-text("Next")')
    })

    await test.step('Review and create', async () => {
      // Preview step
      await expect(page.locator('text=Test Garage Sale')).toBeVisible()
      await expect(page.locator('text=Great deals on furniture')).toBeVisible()
      await expect(page.locator('text=Block-level until 24h before')).toBeVisible()
      
      await page.click('button:has-text("Create Sale")')
    })

    // Should redirect to publish page
    await test.step('Publish the sale', async () => {
      await expect(page).toHaveURL(/\/sell\/[^\/]+\/publish/)
      
      // Check that sale details are shown
      await expect(page.locator('text=Test Garage Sale')).toBeVisible()
      await expect(page.locator('text=Location will be revealed')).toBeVisible()
      
      // Click publish (this should trigger auth flow)
      await page.click('button:has-text("Publish Sale")')
    })

    // Note: The actual auth flow and redirect to manage page would need to be tested
    // with proper authentication setup, which is beyond the scope of this basic test
  })

  test('should show stabilize mode notice when enabled', async ({ page }) => {
    // This test assumes STABILIZE_MODE=1 is set in the environment
    await page.goto('/sell/new')
    
    // Should show stabilize mode notice
    await expect(page.locator('text=Stabilize mode active in preview')).toBeVisible()
    await expect(page.locator('text=The sale creation wizard is temporarily disabled')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Skip if stabilize mode
    const stabilizeNotice = page.locator('text=Stabilize mode active in preview')
    if (await stabilizeNotice.isVisible()) {
      test.skip('Stabilize mode is active - skipping validation test')
    }

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")')
    
    // Should stay on basics step (no navigation)
    await expect(page.locator('text=Sale Details')).toBeVisible()
    
    // Fill title and try again
    await page.fill('input[placeholder*="Multi-Family Garage Sale"]', 'Test Sale')
    await page.click('button:has-text("Next")')
    
    // Should proceed to next step
    await expect(page.locator('text=When')).toBeVisible()
  })
})
