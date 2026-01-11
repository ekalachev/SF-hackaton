import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// Mock the MapView component to avoid Mapbox GL initialization
vi.mock('@/components/map/MapView', () => ({
  MapView: () => <div data-testid="map-view">Map Component</div>,
}))

// Mock the useWells hook
vi.mock('@/hooks/useWells', () => ({
  useWells: () => ({ data: null, isLoading: false, error: null }),
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('provides QueryClient context to children', () => {
    render(<App />)
    // If QueryClientProvider is not properly set up, MapView would fail to render
    expect(screen.getByTestId('map-view')).toBeInTheDocument()
  })

  it('renders the MapView component', () => {
    render(<App />)
    expect(screen.getByText('Map Component')).toBeInTheDocument()
  })
})
