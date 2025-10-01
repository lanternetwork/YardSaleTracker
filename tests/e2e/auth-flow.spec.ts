import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('guest can create sale draft and is redirected to auth on publish', async ({ page }) => {
    // Navigate to create sale page
    await page.goto('/sell/new')
    
    // Fill out the sale form
    await page.fill('input[name="title"]', 'Test Garage Sale')
    await page.fill('input[name="address"]', '123 Main St')
    await page.fill('input[name="city"]', 'Anytown')
    await page.fill('input[name="state"]', 'CA')
    await page.fill('input[name="zip"]', '12345')
    await page.fill('input[name="contact"]', 'test@example.com')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth\?returnTo=/)
    
    // Verify the auth page is displayed
    await expect(page.locator('h2')).toContainText('Sign in to your account')
  })

  test('authenticated user can publish sale', async ({ page }) => {
    // This test would require setting up authentication
    // For now, we'll mark it as skipped with a TODO
    test.skip(true, 'TODO: Implement authentication setup for E2E tests')
    
    // TODO: Set up authenticated user session
    // TODO: Navigate to /sell/new
    // TODO: Fill out form
    // TODO: Submit form
    // TODO: Should land on /sell/review with draft intact
    // TODO: Publish sale
    // TODO: Verify sale is published
  })

  test('favorites require authentication', async ({ page }) => {
    // Try to access favorites without authentication
    await page.goto('/favorites')
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth\?returnTo=/)
  })

  test('account page requires authentication', async ({ page }) => {
    // Try to access account page without authentication
    await page.goto('/account')
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/)
  })

  test('protected routes redirect to auth with correct returnTo parameter', async ({ page }) => {
    const protectedRoutes = ['/sell/review', '/sell/publish', '/favorites', '/account']
    
    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(`/auth\\?returnTo=${encodeURIComponent(route)}`))
    }
  })

  test('static assets are not blocked by auth middleware', async ({ page }) => {
    // Test that static assets can be accessed without authentication
    const staticAssets = [
      '/manifest.json',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml'
    ]
    
    for (const asset of staticAssets) {
      const response = await page.goto(asset)
      // Should not redirect to auth page
      expect(response?.url()).not.toContain('/auth')
    }
  })
})

test.describe('Deferred Authentication Flow', () => {
  test.skip('complete deferred auth flow', async ({ page }) => {
    // TODO: This test requires full authentication setup
    // 1. Create sale as guest
    // 2. Redirect to auth
    // 3. Sign in (mock or real)
    // 4. Land on review page with draft
    // 5. Publish sale
    // 6. Verify sale is published with correct owner_id
  })
})
