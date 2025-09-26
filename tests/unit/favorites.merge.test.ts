import { vi, describe, it, beforeEach, expect } from 'vitest'

// Mock Supabase client for testing favorites merge logic
const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

describe('Favorites Merge Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should merge local favorites to server on first sign-in', async () => {
    const localFavorites = ['sale-1', 'sale-2', 'sale-3']
    const userId = 'user-123'
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify(localFavorites)),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // Mock fetch for adding favorites
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'favorite-1' } })
    })

    // Simulate merge logic
    const mergeLocalFavorites = async () => {
      const localFavorites = localStorage.getItem('favorites')
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites)
        if (favoriteIds.length > 0) {
          // Add each local favorite to server
          for (const saleId of favoriteIds) {
            await fetch(`/api/favorites/${saleId}`, {
              method: 'POST',
            })
          }
          // Clear local favorites
          localStorage.removeItem('favorites')
        }
      }
    }

    await mergeLocalFavorites()

    // Verify all local favorites were added to server
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenCalledWith('/api/favorites/sale-1', { method: 'POST' })
    expect(fetch).toHaveBeenCalledWith('/api/favorites/sale-2', { method: 'POST' })
    expect(fetch).toHaveBeenCalledWith('/api/favorites/sale-3', { method: 'POST' })

    // Verify local storage was cleared
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('favorites')
  })

  it('should handle empty local favorites gracefully', async () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // @ts-ignore
    global.fetch = vi.fn()

    const mergeLocalFavorites = async () => {
      const localFavorites = localStorage.getItem('favorites')
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites)
        if (favoriteIds.length > 0) {
          for (const saleId of favoriteIds) {
            await fetch(`/api/favorites/${saleId}`, { method: 'POST' })
          }
          localStorage.removeItem('favorites')
        }
      }
    }

    await mergeLocalFavorites()

    // Should not make any API calls
    expect(fetch).not.toHaveBeenCalled()
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
  })

  it('should handle invalid JSON in localStorage', async () => {
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('invalid-json'),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // @ts-ignore
    global.fetch = vi.fn()

    const mergeLocalFavorites = async () => {
      try {
        const localFavorites = localStorage.getItem('favorites')
        if (localFavorites) {
          const favoriteIds = JSON.parse(localFavorites)
          if (favoriteIds.length > 0) {
            for (const saleId of favoriteIds) {
              await fetch(`/api/favorites/${saleId}`, { method: 'POST' })
            }
            localStorage.removeItem('favorites')
          }
        }
      } catch (error) {
        console.error('Error merging local favorites:', error)
      }
    }

    await mergeLocalFavorites()

    // Should not make any API calls due to JSON parse error
    expect(fetch).not.toHaveBeenCalled()
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
  })

  it('should handle server errors gracefully', async () => {
    const localFavorites = ['sale-1', 'sale-2']
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(JSON.stringify(localFavorites)),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // Mock fetch to return errors
    // @ts-ignore
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true }) // First call succeeds
      .mockResolvedValueOnce({ ok: false, status: 409 }) // Second call fails (already favorited)

    const mergeLocalFavorites = async () => {
      const localFavorites = localStorage.getItem('favorites')
      if (localFavorites) {
        const favoriteIds = JSON.parse(localFavorites)
        if (favoriteIds.length > 0) {
          for (const saleId of favoriteIds) {
            try {
              await fetch(`/api/favorites/${saleId}`, { method: 'POST' })
            } catch (error) {
              console.error(`Error adding favorite ${saleId}:`, error)
            }
          }
          localStorage.removeItem('favorites')
        }
      }
    }

    await mergeLocalFavorites()

    // Should still clear localStorage even if some calls fail
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('favorites')
  })
})
