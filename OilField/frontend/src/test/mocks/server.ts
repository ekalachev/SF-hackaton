/**
 * MSW Server Setup for Node Environment (Vitest)
 * Provides mock API server for testing
 *
 * Following SOLID principles:
 * - Single Responsibility: Only configures MSW server
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Mock server instance
 * Use this in tests to override handlers or reset state
 */
export const server = setupServer(...handlers);

/**
 * Server lifecycle helpers
 * These are called automatically from test setup
 */

// Start server before all tests
export function startMockServer() {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests
  });
}

// Reset handlers after each test
export function resetMockServer() {
  server.resetHandlers();
}

// Close server after all tests
export function closeMockServer() {
  server.close();
}
