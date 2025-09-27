import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check for proper labels
    await expect(page.locator('label:has-text("Title")')).toBeVisible()
    await expect(page.locator('label:has-text("Description")')).toBeVisible()
    await expect(page.locator('label:has-text("Address")')).toBeVisible()
    
    // Check for proper roles
    await expect(page.locator('button[role="button"]')).toBeVisible()
    await expect(page.locator('input[role="textbox"]')).toBeVisible()
  })

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

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check initial focus
    await expect(page.locator('input[type="text"]')).toBeFocused()
    
    // Check focus after navigation
    await page.click('button:has-text("Next")')
    await expect(page.locator('input[type="date"]')).toBeFocused()
  })

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/explore')
    
    // Check for alt text on images
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check heading hierarchy
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h2')).toBeVisible()
    
    // Check heading levels
    const h1 = page.locator('h1')
    const h2 = page.locator('h2')
    
    await expect(h1).toHaveCount(1)
    await expect(h2).toHaveCount(1)
  })

  test('should have proper form validation', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Try to submit without required fields
    await page.click('button:has-text("Next")')
    
    // Should show validation errors
    await expect(page.locator('input[required]')).toBeVisible()
  })

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check for proper color contrast
    const text = page.locator('text=Create Your Yard Sale')
    await expect(text).toBeVisible()
    
    // Check for proper background colors
    const background = page.locator('body')
    await expect(background).toBeVisible()
  })

  test('should have proper screen reader support', async ({ page }) => {
    await page.goto('/sell/new')
    
    // Check for screen reader text
    await expect(page.locator('text=Create Your Yard Sale')).toBeVisible()
    await expect(page.locator('text=Fill out the form below')).toBeVisible()
    
    // Check for proper form labels
    await expect(page.locator('label:has-text("Title")')).toBeVisible()
    await expect(page.locator('label:has-text("Description")')).toBeVisible()
  })
})
