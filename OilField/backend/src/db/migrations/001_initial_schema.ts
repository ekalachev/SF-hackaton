import type { Knex } from 'knex';

/**
 * Initial database schema migration for OilField platform
 * Creates core tables: operators, wells, production_history, valuations
 * Enables pgvector extension for semantic search
 */
export async function up(knex: Knex): Promise<void> {
  // Enable pgvector extension for semantic search
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');

  // 1. Operators table
  await knex.schema.createTable('operators', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable().unique();
    table.text('operator_number');
    table.text('address');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 2. Wells table
  await knex.schema.createTable('wells', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Identity
    table.text('well_id').notNullable().unique();
    table.text('well_name').notNullable();
    table.text('api_number').unique();

    // Operator relationship
    table
      .uuid('operator_id')
      .references('id')
      .inTable('operators')
      .onDelete('SET NULL');

    // Location
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.text('county');
    table.text('field');
    table.text('state').defaultTo('TX');

    // Well attributes
    table.text('status').defaultTo('active');
    table.integer('depth_ft');
    table.date('completion_date');

    // Semantic search - pgvector embedding
    table.specificType('embedding', 'vector(384)');
    table.text('embedding_model').defaultTo('all-MiniLM-L6-v2');

    // Metadata
    table.text('description');

    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // 3. Production history table
  await knex.schema.createTable('production_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('well_id')
      .notNullable()
      .references('id')
      .inTable('wells')
      .onDelete('CASCADE');

    // Production data
    table.date('date').notNullable();
    table.decimal('oil_bbl', 12, 2);
    table.decimal('gas_mcf', 12, 2);
    table.decimal('water_bbl', 12, 2);

    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Unique constraint on well_id + date
    table.unique(['well_id', 'date']);
  });

  // 4. Valuations table
  await knex.schema.createTable('valuations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('well_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('wells')
      .onDelete('CASCADE');

    // Valuation results
    table.decimal('npv_usd', 15, 2);
    table.decimal('market_value_usd', 15, 2);
    table.decimal('discount_pct', 5, 2);
    table.decimal('confidence', 3, 2);
    table.decimal('remaining_reserves_bbl', 15, 2);

    // Calculation metadata
    table.timestamp('calculated_at', { useTz: true });

    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create indexes for performance
  await knex.schema.raw(
    'CREATE INDEX idx_wells_operator ON wells (operator_id)'
  );
  await knex.schema.raw('CREATE INDEX idx_wells_status ON wells (status)');
  await knex.schema.raw('CREATE INDEX idx_wells_county ON wells (county)');
  await knex.schema.raw(
    'CREATE INDEX idx_production_well_date ON production_history (well_id, date DESC)'
  );

  // Create HNSW index for fast vector similarity search
  // Using cosine distance operator for semantic search
  await knex.schema.raw(
    'CREATE INDEX idx_wells_embedding ON wells USING hnsw (embedding vector_cosine_ops)'
  );

  // Create trigger function for updating timestamps
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Attach update triggers to all tables
  await knex.raw(`
    CREATE TRIGGER operators_updated_at_trigger
      BEFORE UPDATE ON operators
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER wells_updated_at_trigger
      BEFORE UPDATE ON wells
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER production_history_updated_at_trigger
      BEFORE UPDATE ON production_history
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
  `);

  await knex.raw(`
    CREATE TRIGGER valuations_updated_at_trigger
      BEFORE UPDATE ON valuations
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
  `);
}

/**
 * Rollback migration - drops all tables and extensions
 */
export async function down(knex: Knex): Promise<void> {
  // Drop triggers first
  await knex.raw('DROP TRIGGER IF EXISTS operators_updated_at_trigger ON operators');
  await knex.raw('DROP TRIGGER IF EXISTS wells_updated_at_trigger ON wells');
  await knex.raw(
    'DROP TRIGGER IF EXISTS production_history_updated_at_trigger ON production_history'
  );
  await knex.raw('DROP TRIGGER IF EXISTS valuations_updated_at_trigger ON valuations');

  // Drop trigger function
  await knex.raw('DROP FUNCTION IF EXISTS update_timestamp()');

  // Drop tables in reverse order (respecting foreign keys)
  await knex.schema.dropTableIfExists('valuations');
  await knex.schema.dropTableIfExists('production_history');
  await knex.schema.dropTableIfExists('wells');
  await knex.schema.dropTableIfExists('operators');

  // Drop pgvector extension
  await knex.raw('DROP EXTENSION IF EXISTS vector');
}
