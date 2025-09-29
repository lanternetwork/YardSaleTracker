import { test, expect } from '@playwright/test'

test.describe('Autosave Drafts', () => {
  test('should autosave draft when typing (signed out)', async ({ page }) => {
    // Navigate to create sale page
    await page.goto('/sell/new')
    
    // Check if stabilize mode is active
    const stabilizeNotice = page.locator('text=Stabilize mode active in preview')
    if (await stabilizeNotice.isVisible()) {
      test.skip(true, 'Stabilize mode is active - skipping autosave test')
    }

    // Fill out basic information
    await page.fill('input[placeholder*="Multi-Family Garage Sale"]', 'Test Garage Sale')
    await page.fill('textarea[placeholder*="Describe your sale"]', 'A great garage sale with lots of items')
    
    // Wait for autosave to trigger
    await page.waitForSelector('text=Saving...', { timeout: 2000 })
    
    // Wait for save to complete
    await page.waitForSelector('text=Saved', { timeout: 5000 })
    
    // Verify the draft was created
    const savedIndicator = page.locator('text=Saved')
    await expect(savedIndicator).toBeVisible()
    
    // Reload the page to test persistence
    await page.reload()
    
    // Verify the data persisted
    await expect(page.locator('input[placeholder*="Multi-Family Garage Sale"]')).toHaveValue('Test Garage Sale')
    await expect(page.locator('textarea[placeholder*="Describe your sale"]')).toHaveValue('A great garage sale with lots of items')
  })

  test('should show time presets and apply them correctly', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check if stabilize mode is active
    const stabilizeNotice = page.locator('text=Stabilize mode active in preview')
    if (await stabilizeNotice.isVisible()) {
      test.skip(true, 'Stabilize mode is active - skipping time presets test')
    }

    // Navigate to the "When" step
    await page.click('button:has-text("Next")')
    
    // Check that time presets are visible
    await expect(page.locator('text=This Saturday 8–2')).toBeVisible()
    await expect(page.locator('text=This Sunday 9–1')).toBeVisible()
    await expect(page.locator('text=Sat + Sun 8–2')).toBeVisible()
    await expect(page.locator('text=Custom')).toBeVisible()
    
    // Click on "This Saturday 8–2" preset
    await page.click('button:has-text("This Saturday 8–2")')
    
    // Verify the preset was applied
    await expect(page.locator('input[type="date"]').first()).toHaveValue(/.+/)
    await expect(page.locator('input[type="time"]').first()).toHaveValue('08:00')
    await expect(page.locator('input[type="time"]').nth(1)).toHaveValue('14:00')
    
    // Verify the selection is highlighted
    const selectedPreset = page.locator('button:has-text("This Saturday 8–2")')
    await expect(selectedPreset).toHaveClass(/border-amber-500/)
  })

  test('should handle autosave errors gracefully', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/sales', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })

    await page.goto('/sell/new')
    
    // Check if stabilize mode is active
    const stabilizeNotice = page.locator('text=Stabilize mode active in preview')
    if (await stabilizeNotice.isVisible()) {
      test.skip(true, 'Stabilize mode is active - skipping autosave error test')
    }

    // Fill out basic information
    await page.fill('input[placeholder*="Multi-Family Garage Sale"]', 'Test Garage Sale')
    
    // Wait for autosave to trigger and fail
    await page.waitForSelector('text=Save failed', { timeout: 5000 })
    
    // Verify error message is shown
    const errorIndicator = page.locator('text=Save failed')
    await expect(errorIndicator).toBeVisible()
  })
})
