import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

// Load environment variables for tests
config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    // Run integration tests in tests/ folder sequentially to avoid database conflicts
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Run tests in sequence for files that touch the database
    sequence: {
      concurrent: false,
    },
  },
});
