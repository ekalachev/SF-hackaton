import type { Knex } from "knex";

/**
 * Migration: Add economic assumption fields to valuations table
 * Sprint 4 - AI Features
 * Required for ClaudeService report generation
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('valuations', (table) => {
    // Economic assumptions
    table.decimal('oil_price_usd', 8, 2).defaultTo(75.00);
    table.decimal('operating_cost_per_bbl', 8, 2).defaultTo(15.00);
    table.decimal('discount_rate', 5, 4).defaultTo(0.10); // 10%
    table.decimal('royalty_rate', 5, 4).defaultTo(0.20); // 20%
    table.date('valuation_date').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // Check if table exists before attempting to alter it
  const hasTable = await knex.schema.hasTable('valuations');
  if (hasTable) {
    await knex.schema.alterTable('valuations', (table) => {
      table.dropColumn('oil_price_usd');
      table.dropColumn('operating_cost_per_bbl');
      table.dropColumn('discount_rate');
      table.dropColumn('royalty_rate');
      table.dropColumn('valuation_date');
    });
  }
}

