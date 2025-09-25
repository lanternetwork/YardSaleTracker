import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FavoriteButton from '../../components/FavoriteButton'
import { useFavorites, useToggleFavorite } from '../../lib/hooks/useFavorites'

// Mock the auth hooks
vi.mock('../../lib/hooks/useFavorites', () => ({
  useFavorites: vi.fn(),
  useToggleFavorite: vi.fn()
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('FavoriteButton', () => {
  it('renders save button when not favorited', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [],
      isError: false,
      error: null,
      isPending: false,
      isLoading: false,
      isSuccess: true,
      isIdle: false,
      status: 'success',
      fetchStatus: 'idle',
      isRefetching: false,
      isFetching: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetchError: false,
      isInitialLoading: false,
      refetch: vi.fn(),
      remove: vi.fn()
    })
    vi.mocked(useToggleFavorite).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    render(
      <TestWrapper>
        <FavoriteButton saleId="test-sale-id" />
      </TestWrapper>
    )

    expect(screen.getByText('♡ Save')).toBeInTheDocument()
  })

  it('renders saved button when favorited', async () => {
    // Mock the hook to return a favorited sale
    vi.mocked(useFavorites).mockReturnValue({
      data: [{ id: 'test-sale-id', title: 'Test Sale' }],
      isError: false,
      error: null,
      isPending: false,
      isLoading: false,
      isSuccess: true,
      isIdle: false,
      status: 'success',
      fetchStatus: 'idle',
      isRefetching: false,
      isFetching: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetchError: false,
      isInitialLoading: false,
      refetch: vi.fn(),
      remove: vi.fn()
    })
    vi.mocked(useToggleFavorite).mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    })

    render(
      <TestWrapper>
        <FavoriteButton saleId="test-sale-id" />
      </TestWrapper>
    )

    // The component should immediately show the favorited state
    expect(screen.getByText('♥ Saved')).toBeInTheDocument()
  })

  it('calls toggle function when clicked', async () => {
    const mockToggle = vi.fn()
    vi.mocked(useFavorites).mockReturnValue({
      data: [],
      isError: false,
      error: null,
      isPending: false,
      isLoading: false,
      isSuccess: true,
      isIdle: false,
      status: 'success',
      fetchStatus: 'idle',
      isRefetching: false,
      isFetching: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetchError: false,
      isInitialLoading: false,
      refetch: vi.fn(),
      remove: vi.fn()
    })
    vi.mocked(useToggleFavorite).mockReturnValue({
      mutate: mockToggle,
      isPending: false
    })

    render(
      <TestWrapper>
        <FavoriteButton saleId="test-sale-id" />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockToggle).toHaveBeenCalledWith({
      saleId: 'test-sale-id',
      isFavorited: false
    })
  })

  it('shows loading state when pending', () => {
    vi.mocked(useFavorites).mockReturnValue({
      data: [],
      isError: false,
      error: null,
      isPending: false,
      isLoading: false,
      isSuccess: true,
      isIdle: false,
      status: 'success',
      fetchStatus: 'idle',
      isRefetching: false,
      isFetching: false,
      isStale: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetchError: false,
      isInitialLoading: false,
      refetch: vi.fn(),
      remove: vi.fn()
    })
    vi.mocked(useToggleFavorite).mockReturnValue({
      mutate: vi.fn(),
      isPending: true
    })

    render(
      <TestWrapper>
        <FavoriteButton saleId="test-sale-id" />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('has correct ARIA attributes', () => {
    render(
      <TestWrapper>
        <FavoriteButton saleId="test-sale-id" />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
