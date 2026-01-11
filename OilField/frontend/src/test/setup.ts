import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'
import { startMockServer, resetMockServer, closeMockServer } from './mocks/server'

// Mock ResizeObserver for Recharts testing
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock Mapbox GL JS for map component testing
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getSource: vi.fn(),
      getCanvas: vi.fn(() => ({
        style: {},
      })),
    })),
  },
}))

// Setup MSW mock server for API testing
beforeAll(() => {
  startMockServer()
})

afterEach(() => {
  resetMockServer()
})

afterAll(() => {
  closeMockServer()
})
