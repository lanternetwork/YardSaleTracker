import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddSaleForm from '@/components/AddSaleForm'

// Mock the hooks
vi.mock('@/lib/hooks/useSales', () => ({
  useCreateSale: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'test-id' }),
    isPending: false
  }))
}))

// Mock the geocoding function
vi.mock('@/lib/geocode', () => ({
  geocodeAddress: vi.fn().mockResolvedValue({
    lat: 40.7128,
    lng: -74.0060,
    city: 'New York',
    state: 'NY',
    zip: '10001'
  })
}))

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowser: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } } })
    }
  })
}))

describe('AddSaleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<AddSaleForm />)
    
    expect(screen.getByPlaceholderText('e.g., Estate Sale - Antiques & Collectibles')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Start typing your address...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Describe what you\'re selling...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Phone number or email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post sale/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<AddSaleForm />)
    
    const submitButton = screen.getByRole('button', { name: /post sale/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please complete required fields')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const { useCreateSale } = await import('@/lib/hooks/useSales')
    const mockMutateAsync = vi.fn().mockResolvedValue({ id: 'test-id' })
    
    vi.mocked(useCreateSale).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: 'idle' as const,
      submittedAt: undefined
    })
    
    render(<AddSaleForm />)
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText('e.g., Estate Sale - Antiques & Collectibles'), {
      target: { value: 'Test Sale' }
    })
    fireEvent.change(screen.getByPlaceholderText('Start typing your address...'), {
      target: { value: '123 Test St' }
    })

    const submitButton = screen.getByRole('button', { name: /post sale/i })
    fireEvent.click(submitButton)

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Sale',
          address: '123 Test St'
        })
      )
    }, { timeout: 2000 })
  })

  it('handles geocoding on address change', async () => {
    const { geocodeAddress } = await import('@/lib/geocode')
    
    render(<AddSaleForm />)
    
    const addressInput = screen.getByPlaceholderText('Start typing your address...')
    fireEvent.change(addressInput, {
      target: { value: '123 Test St, New York, NY' }
    })

    // Wait for geocoding to complete
    await waitFor(() => {
      expect(geocodeAddress).toHaveBeenCalledWith('123 Test St, New York, NY')
    })
  })

  it('adds and removes tags', async () => {
    render(<AddSaleForm />)
    
    const tagInput = screen.getByPlaceholderText('Add a tag...')
    fireEvent.change(tagInput, { target: { value: 'furniture' } })
    fireEvent.keyDown(tagInput, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('furniture')).toBeInTheDocument()
    })

    // Remove tag
    const removeButton = screen.getByRole('button', { name: /remove furniture/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('furniture')).not.toBeInTheDocument()
    })
  })

  it('validates price range', async () => {
    render(<AddSaleForm />)
    
    // Fill in required fields first
    fireEvent.change(screen.getByPlaceholderText('e.g., Estate Sale - Antiques & Collectibles'), {
      target: { value: 'Test Sale' }
    })
    fireEvent.change(screen.getByPlaceholderText('Start typing your address...'), {
      target: { value: '123 Test St' }
    })
    
    const minPriceInput = screen.getByPlaceholderText('0.00')
    const maxPriceInput = screen.getByPlaceholderText('100.00')

    fireEvent.change(minPriceInput, { target: { value: '100' } })
    fireEvent.change(maxPriceInput, { target: { value: '50' } })

    const submitButton = screen.getByRole('button', { name: /post sale/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Min price must be less than max price')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const { useCreateSale } = await import('@/lib/hooks/useSales')
    vi.mocked(useCreateSale).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
      data: undefined,
      error: null,
      variables: undefined,
      isError: false,
      isSuccess: false,
      isIdle: false,
      mutate: vi.fn(),
      reset: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: 'pending' as const,
      submittedAt: Date.now()
    })
    
    render(<AddSaleForm />)
    
    // Check that the button shows "Posting..." and is disabled
    expect(screen.getByText('Posting...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /posting.../i })).toBeDisabled()
  })
})
