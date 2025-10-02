import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReviewsSection from '@/components/ReviewsSection'

// Mock the Supabase client (include rpc as required by component)
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  })),
  rpc: vi.fn(() => Promise.resolve({
    data: null,
    error: null
  }))
}

// Mock the async operations to resolve immediately
const mockFetchReviews = vi.fn().mockResolvedValue({
  data: [],
  error: null
})

const mockFetchUserReview = vi.fn().mockResolvedValue({
  data: null,
  error: null
})

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => mockSupabase
}))

// Mock the auth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' }
  })
}))

describe('ReviewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with rating summary', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={4.5} 
        totalReviews={10} 
      />
    )
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('10 reviews')).toBeInTheDocument()
    })
  })

  it('renders star rating correctly', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={3.5} 
        totalReviews={5} 
      />
    )
    
    // Wait for component to load
    await waitFor(() => {
      // Should show 4 filled stars (rounded up from 3.5)
      const filledStars = screen.getAllByText('★').filter(star => 
        star.className.includes('text-amber-400')
      )
      expect(filledStars).toHaveLength(4)
    })
  })

  it('renders review form for authenticated users', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Write a Review')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument()
    })
  })

  it('validates rating selection', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    // Wait for loading to complete
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /submit review/i })
      fireEvent.click(submitButton)

      // Should not submit without rating
      expect(submitButton).toBeDisabled()
    })
  })

  it('allows rating selection', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    // Wait for loading to complete
    await waitFor(() => {
      const stars = screen.getAllByRole('button')
      const thirdStar = stars[2] // 3rd star
      fireEvent.click(thirdStar)

      // Should show 3 filled stars
      const filledStars = screen.getAllByText('★').filter(star => 
        star.className.includes('text-amber-400')
      )
      expect(filledStars).toHaveLength(3)
    }, { timeout: 3000 })
  })

  it('allows comment input', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    // Wait for loading to complete
    await waitFor(() => {
      const commentInput = screen.getByPlaceholderText(/share your experience/i)
      fireEvent.change(commentInput, { target: { value: 'Great sale!' } })

      expect(commentInput).toHaveValue('Great sale!')
    })
  })

  it('shows loading state initially', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument()
  })

  it('shows empty state when no reviews', async () => {
    // Mock empty reviews response
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }))
    })

    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('No reviews yet. Be the first to review this sale!')).toBeInTheDocument()
    })
  })

  it('shows existing reviews', async () => {
    const mockReviews = [
      {
        id: '1',
        rating: 5,
        comment: 'Great sale!',
        created_at: '2023-12-01T10:00:00Z'
      },
      {
        id: '2',
        rating: 4,
        comment: 'Good prices',
        created_at: '2023-12-02T10:00:00Z'
      }
    ]

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockReviews,
            error: null
          }))
        }))
      }))
    })

    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={4.5} 
        totalReviews={2} 
      />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Great sale!')).toBeInTheDocument()
      expect(screen.getByText('Good prices')).toBeInTheDocument()
    })
  })
})
