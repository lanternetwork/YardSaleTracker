import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ReviewsSection from '@/components/ReviewsSection'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn(() => ({
      then: vi.fn()
    }))
  }))
}

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowser: () => mockSupabase as any
}))

// Mock the auth hook
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({ data: { id: 'test-user' } }) as any
}))

describe('ReviewsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with rating summary', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={4.5} 
        totalReviews={10} 
      />
    )
    
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('10 reviews')).toBeInTheDocument()
  })

  it('renders star rating correctly', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={3.5} 
        totalReviews={5} 
      />
    )
    
    // Should show 4 filled stars (rounded up from 3.5)
    const filledStars = screen.getAllByText('★').filter(star => 
      star.className.includes('text-amber-400')
    )
    expect(filledStars).toHaveLength(4)
  })

  it('renders review form for authenticated users', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    expect(screen.getByText('Write a Review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument()
  })

  it('validates rating selection', async () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /submit review/i })
    fireEvent.click(submitButton)

    // Should not submit without rating
    expect(submitButton).toBeDisabled()
  })

  it('allows rating selection', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    const stars = screen.getAllByRole('button')
    const thirdStar = stars[2] // 3rd star
    fireEvent.click(thirdStar)

    // Should show 3 filled stars
    const filledStars = screen.getAllByText('★').filter(star => 
      star.className.includes('text-amber-400')
    )
    expect(filledStars).toHaveLength(3)
  })

  it('allows comment input', () => {
    render(
      <ReviewsSection 
        saleId="test-sale" 
        averageRating={0} 
        totalReviews={0} 
      />
    )
    
    const commentInput = screen.getByPlaceholderText(/share your experience/i)
    fireEvent.change(commentInput, { target: { value: 'Great sale!' } })

    expect(commentInput).toHaveValue('Great sale!')
  })

  it('shows loading state', () => {
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
          order: vi.fn(() => ({
            then: vi.fn((callback) => {
              callback({ data: [], error: null })
            })
          }))
        }))
      })),
      rpc: vi.fn(() => ({ then: vi.fn() }))
    } as any)

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
          order: vi.fn(() => ({
            then: vi.fn((callback) => {
              callback({ data: mockReviews, error: null })
            })
          }))
        }))
      })),
      rpc: vi.fn(() => ({ then: vi.fn() }))
    } as any)

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
