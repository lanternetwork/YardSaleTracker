import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import YardSaleMap from '@/components/YardSaleMap'
import { getAddressFixtures } from '@/tests/utils/mocks'

// Mock Google Maps
const mockMap = {
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  fitBounds: vi.fn(),
  getZoom: vi.fn().mockReturnValue(10),
  controls: {
    [Symbol.for('TOP_LEFT')]: {
      push: vi.fn()
    }
  }
}

const mockMarker = {
  setMap: vi.fn(),
  addListener: vi.fn(),
  getPosition: vi.fn().mockReturnValue({
    lat: () => 37.7749,
    lng: () => -122.4194
  })
}

const mockInfoWindow = {
  open: vi.fn(),
  close: vi.fn()
}

const mockBounds = {
  extend: vi.fn(),
  isEmpty: vi.fn().mockReturnValue(false)
}

const mockLatLng = vi.fn().mockImplementation((lat, lng) => ({ lat, lng }))

const mockSize = vi.fn().mockImplementation((width, height) => ({ width, height }))

const mockEvent = {
  addListener: vi.fn().mockReturnValue({ remove: vi.fn() }),
  removeListener: vi.fn()
}

// Mock Google Maps globals
const mockGoogle = {
  maps: {
    Map: vi.fn().mockImplementation(() => mockMap),
    Marker: vi.fn().mockImplementation(() => mockMarker),
    InfoWindow: vi.fn().mockImplementation(() => mockInfoWindow),
    LatLngBounds: vi.fn().mockImplementation(() => mockBounds),
    LatLng: mockLatLng,
    Size: mockSize,
    event: mockEvent,
    ControlPosition: {
      TOP_LEFT: Symbol.for('TOP_LEFT')
    }
  }
}

// Mock the Loader
vi.mock('@googlemaps/js-api-loader', () => ({
  Loader: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(mockGoogle)
  }))
}))

describe('Map Render Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up global google object
    ;(global as any).google = mockGoogle
    if (typeof window !== 'undefined') {
      (window as any).google = mockGoogle
    }
    
    // Mock the Loader to return our mock Google
    vi.doMock('@googlemaps/js-api-loader', () => ({
      Loader: vi.fn().mockImplementation(() => ({
        load: vi.fn().mockResolvedValue(mockGoogle)
      }))
    }))
    
    // Ensure the component can access the mock
    Object.defineProperty(window, 'google', {
      value: mockGoogle,
      writable: true
    })
  })

  it('should render map with markers for sales with coordinates', async () => {
    const addresses = getAddressFixtures()
    const testPoints = [
      {
        id: 'sale-1',
        title: 'Test Sale 1',
        lat: addresses[0].lat,
        lng: addresses[0].lng
      },
      {
        id: 'sale-2',
        title: 'Test Sale 2',
        lat: addresses[1].lat,
        lng: addresses[1].lng
      }
    ]

    render(<YardSaleMap points={testPoints} />)

    // Wait for map to load
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify map container is rendered
    expect(screen.getByTestId('map')).toBeInTheDocument()

    // Verify map was created
    expect(mockGoogle.maps.Map).toHaveBeenCalled()
    
    // Verify markers were created
    expect(mockGoogle.maps.Marker).toHaveBeenCalledTimes(2)
    
    // Verify bounds were set
    expect(mockMap.fitBounds).toHaveBeenCalled()
  })

  it('should handle empty points array', async () => {
    render(<YardSaleMap points={[]} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Map should still be created
    expect(mockGoogle.maps.Map).toHaveBeenCalled()
    
    // No markers should be created
    expect(mockGoogle.maps.Marker).not.toHaveBeenCalled()
    
    // Bounds should not be set
    expect(mockMap.fitBounds).not.toHaveBeenCalled()
  })

  it('should create markers with correct properties', async () => {
    const testPoints = [
      {
        id: 'sale-1',
        title: 'Test Sale 1',
        lat: 37.7749,
        lng: -122.4194
      }
    ]

    render(<YardSaleMap points={testPoints} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify marker was created with correct position
    expect(mockGoogle.maps.Marker).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { lat: 37.7749, lng: -122.4194 },
        title: 'Test Sale 1',
        map: mockMap,
        icon: expect.objectContaining({
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: expect.any(Object)
        })
      })
    )
  })

  it('should create info windows for markers', async () => {
    const testPoints = [
      {
        id: 'sale-1',
        title: 'Test Sale 1',
        lat: 37.7749,
        lng: -122.4194
      }
    ]

    render(<YardSaleMap points={testPoints} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify info window was created
    expect(mockGoogle.maps.InfoWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Test Sale 1')
      })
    )
  })

  it('should add click listeners to markers', async () => {
    const testPoints = [
      {
        id: 'sale-1',
        title: 'Test Sale 1',
        lat: 37.7749,
        lng: -122.4194
      }
    ]

    render(<YardSaleMap points={testPoints} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify click listener was added
    expect(mockMarker.addListener).toHaveBeenCalledWith('click', expect.any(Function))
  })

  it('should set bounds to fit all markers', async () => {
    const testPoints = [
      {
        id: 'sale-1',
        title: 'Test Sale 1',
        lat: 37.7749,
        lng: -122.4194
      },
      {
        id: 'sale-2',
        title: 'Test Sale 2',
        lat: 37.7849,
        lng: -122.4094
      }
    ]

    render(<YardSaleMap points={testPoints} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify bounds were created and extended
    expect(mockGoogle.maps.LatLngBounds).toHaveBeenCalled()
    expect(mockBounds.extend).toHaveBeenCalledTimes(2)
    expect(mockMap.fitBounds).toHaveBeenCalled()
  })

  it('should handle map loading error', async () => {
    // Mock loader to reject by setting up a different mock
    vi.doMock('@googlemaps/js-api-loader', () => ({
      Loader: vi.fn().mockImplementation(() => ({
        load: vi.fn().mockRejectedValue(new Error('Failed to load'))
      }))
    }))

    render(<YardSaleMap points={[]} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Should show error state
    expect(screen.getByText('Failed to load map')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    render(<YardSaleMap points={[]} />)

    // The component should show loading state initially
    expect(screen.getByText('Loading map...')).toBeInTheDocument()
  })

  it('should show no sales message when no points', async () => {
    render(<YardSaleMap points={[]} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    expect(screen.getByText('No sales with locations found')).toBeInTheDocument()
  })

  it('should add Near Me button when geolocation is available', async () => {
    // Mock geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn()
      },
      writable: true
    })

    render(<YardSaleMap points={[]} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify Near Me button was added
    expect(mockMap.controls[Symbol.for('TOP_LEFT')].push).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement)
    )
  })

  it('should handle geolocation error gracefully', async () => {
    // Mock geolocation to fail
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn().mockImplementation((success, error) => {
          error({ code: 1, message: 'Permission denied' })
        })
      },
      writable: true
    })

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<YardSaleMap points={[]} />)

    await new Promise(resolve => setTimeout(resolve, 500))

    // Click the "Near Me" button to trigger geolocation
    const nearMeButton = screen.getByText('📍 Near Me')
    fireEvent.click(nearMeButton)

    await new Promise(resolve => setTimeout(resolve, 200))

    // Should show error alert
    expect(alertSpy).toHaveBeenCalledWith(
      'Unable to get your location. Please check your browser settings.'
    )

    alertSpy.mockRestore()
  })
})
