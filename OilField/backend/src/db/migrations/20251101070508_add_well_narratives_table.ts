import type { Knex } from "knex";

/**
 * Migration: Add well_narratives table for caching AI-generated narratives
 * Sprint 4 - AI Features
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('well_narratives', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Well relationship
    table
      .uuid('well_id')
      .notNullable()
      .references('id')
      .inTable('wells')
      .onDelete('CASCADE');

    // Narrative content
    table.text('narrative').notNullable();

    // Timestamps
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Index for lookups
    table.index('well_id');
    table.index('created_at');
  });

  // Attach update trigger
  await knex.raw(`
    CREATE TRIGGER well_narratives_updated_at_trigger
      BEFORE UPDATE ON well_narratives
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS well_narratives_updated_at_trigger ON well_narratives');
  await knex.schema.dropTableIfExists('well_narratives');
}

