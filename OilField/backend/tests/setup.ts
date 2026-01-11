/**
 * Test setup file
 * Loads environment variables and configures test environment
 */

import { config } from 'dotenv';
import knex, { Knex } from 'knex';
import knexConfig from '../knexfile';
import { beforeAll, afterAll } from 'vitest';

// Load environment variables from .env file
config();

// Set default test database connection if not provided
if (!process.env.DB_NAME) {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5434';
  process.env.DB_NAME = 'oilfield';
  process.env.DB_USER = 'oilfield';
  process.env.DB_PASSWORD = 'oilfield_dev';
}

// Global database instance for migrations
let globalDb: Knex | null = null;

// Run migrations once before all tests
beforeAll(async () => {
  try {
    globalDb = knex(knexConfig.development);

    // Unlock migrations in case they're stuck
    try {
      await globalDb.migrate.unlock();
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Run migrations
    await globalDb.migrate.latest();

    console.log('Global test setup: Migrations completed');
  } catch (error) {
    console.error('Global test setup failed:', error);
    throw error;
  }
}, 60000); // 60 second timeout for setup

// Cleanup after all tests
afterAll(async () => {
  if (globalDb) {
    await globalDb.destroy();
  }
});
