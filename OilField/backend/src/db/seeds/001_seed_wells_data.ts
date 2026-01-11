import type { Knex } from 'knex';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Interface definitions for type safety
 * Following SOLID principles - Interface Segregation
 */

interface WellLocation {
  latitude: number;
  longitude: number;
  county: string;
  state: string;
  field: string;
}

interface WellAttributes {
  completion_date: string;
  depth_ft: number;
  api_number: number;
}

interface WellProduction {
  current_bbl_day: number;
  cumulative_bbl: number;
  cumulative_gas_mcf: number;
  cumulative_water_bbl: number;
  decline_rate: number;
}

interface ProductionHistoryRecord {
  date: string;
  oil_bbl: number;
  gas_mcf: number;
  water_bbl: number;
  days_produced: number;
}

interface WellValuation {
  npvUsd: number;
  marketValueUsd: number;
  discountPct: number;
  confidence: number;
  remainingReservesBbl: number;
}

interface WellData {
  id: string;
  name: string;
  operator: string;
  location: WellLocation;
  status: string;
  attributes: WellAttributes;
  production: WellProduction;
  production_history: ProductionHistoryRecord[];
  valuation: WellValuation;
  embedding: number[];
  embeddingModel: string;
  description: string;
}

interface OperatorRecord {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

interface WellRecord {
  id: string;
  well_id: string;
  well_name: string;
  api_number: string;
  operator_id: string;
  latitude: number;
  longitude: number;
  county: string;
  field: string;
  state: string;
  status: string;
  depth_ft: number;
  completion_date: Date;
  embedding: string;
  embedding_model: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface ProductionRecord {
  well_id: string;
  date: Date;
  oil_bbl: number;
  gas_mcf: number;
  water_bbl: number;
}

interface ValuationRecord {
  well_id: string;
  npv_usd: number;
  market_value_usd: number;
  discount_pct: number;
  confidence: number;
  remaining_reserves_bbl: number;
  calculated_at: Date;
}

/**
 * Data access layer - Single Responsibility Principle
 * Handles reading and parsing JSON data
 */
class WellsDataLoader {
  private readonly dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  public loadWellsData(): WellData[] {
    const rawData = readFileSync(this.dataPath, 'utf-8');
    return JSON.parse(rawData) as WellData[];
  }
}

/**
 * Data transformation layer - Single Responsibility Principle
 * Converts JSON data to database records
 */
class DataTransformer {
  /**
   * Extract unique operators from wells data
   */
  public extractOperators(wellsData: WellData[]): Map<string, OperatorRecord> {
    const operatorsMap = new Map<string, OperatorRecord>();
    const now = new Date();

    wellsData.forEach((well) => {
      if (!operatorsMap.has(well.operator)) {
        // Generate deterministic UUID from operator name for idempotency
        const operatorId = this.generateDeterministicId(well.operator);
        operatorsMap.set(well.operator, {
          id: operatorId,
          name: well.operator,
          created_at: now,
          updated_at: now,
        });
      }
    });

    return operatorsMap;
  }

  /**
   * Transform well data to database format
   */
  public transformWell(
    well: WellData,
    operatorId: string
  ): Omit<WellRecord, 'created_at' | 'updated_at'> {
    return {
      id: this.generateDeterministicId(well.id),
      well_id: well.id,
      well_name: well.name,
      api_number: well.attributes.api_number.toString(),
      operator_id: operatorId,
      latitude: well.location.latitude,
      longitude: well.location.longitude,
      county: well.location.county,
      field: well.location.field,
      state: well.location.state,
      status: well.status,
      depth_ft: well.attributes.depth_ft,
      completion_date: new Date(well.attributes.completion_date),
      embedding: this.formatEmbedding(well.embedding),
      embedding_model: well.embeddingModel,
      description: well.description || null,
    };
  }

  /**
   * Transform production history records
   */
  public transformProductionHistory(
    well: WellData,
    wellDbId: string
  ): ProductionRecord[] {
    return well.production_history.map((record) => ({
      well_id: wellDbId,
      date: this.parseProductionDate(record.date),
      oil_bbl: record.oil_bbl,
      gas_mcf: record.gas_mcf,
      water_bbl: record.water_bbl,
    }));
  }

  /**
   * Transform valuation data
   */
  public transformValuation(
    well: WellData,
    wellDbId: string
  ): ValuationRecord {
    return {
      well_id: wellDbId,
      npv_usd: well.valuation.npvUsd,
      market_value_usd: well.valuation.marketValueUsd,
      discount_pct: well.valuation.discountPct,
      confidence: well.valuation.confidence,
      remaining_reserves_bbl: well.valuation.remainingReservesBbl,
      calculated_at: new Date(),
    };
  }

  /**
   * Format embedding array for pgvector
   */
  private formatEmbedding(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Parse production date from YYYY-MM format
   */
  private parseProductionDate(dateStr: string): Date {
    const [year, month] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  /**
   * Generate deterministic UUID-like ID from string
   * This ensures idempotency - same input always produces same ID
   */
  private generateDeterministicId(input: string): string {
    // Simple deterministic hash - in production, use a proper UUID v5
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Format as UUID-like string
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hexHash.slice(0, 8)}-${hexHash.slice(0, 4)}-${hexHash.slice(0, 4)}-${hexHash.slice(0, 4)}-${hexHash.slice(0, 12).padEnd(12, '0')}`;
  }
}

/**
 * Database seeding service - Single Responsibility Principle
 * Orchestrates the seeding process
 */
class DatabaseSeeder {
  private readonly knex: Knex;
  private readonly transformer: DataTransformer;

  constructor(knex: Knex, transformer: DataTransformer) {
    this.knex = knex;
    this.transformer = transformer;
  }

  /**
   * Seed operators table
   * Returns map of operator name to database ID
   */
  public async seedOperators(
    wellsData: WellData[]
  ): Promise<Map<string, OperatorRecord>> {
    const operatorsMap = this.transformer.extractOperators(wellsData);
    const operators = Array.from(operatorsMap.values());

    // Insert operators (idempotent with ON CONFLICT)
    await this.knex('operators')
      .insert(
        operators.map((op) => ({
          id: op.id,
          name: op.name,
        }))
      )
      .onConflict('name')
      .ignore();

    return operatorsMap;
  }

  /**
   * Seed wells table
   * Returns map of well_id to database ID
   */
  public async seedWells(
    wellsData: WellData[],
    operatorsMap: Map<string, OperatorRecord>
  ): Promise<Map<string, string>> {
    const wellsMap = new Map<string, string>();

    for (const well of wellsData) {
      const operator = operatorsMap.get(well.operator);
      if (!operator) {
        throw new Error(`Operator not found: ${well.operator}`);
      }

      const wellRecord = this.transformer.transformWell(well, operator.id);
      wellsMap.set(well.id, wellRecord.id);

      // Insert well (idempotent with ON CONFLICT)
      await this.knex('wells')
        .insert(wellRecord)
        .onConflict('well_id')
        .merge(); // Update if exists
    }

    return wellsMap;
  }

  /**
   * Seed production history table
   */
  public async seedProductionHistory(
    wellsData: WellData[],
    wellsMap: Map<string, string>
  ): Promise<void> {
    const allProductionRecords: ProductionRecord[] = [];

    for (const well of wellsData) {
      const wellDbId = wellsMap.get(well.id);
      if (!wellDbId) {
        throw new Error(`Well not found in map: ${well.id}`);
      }

      const records = this.transformer.transformProductionHistory(well, wellDbId);
      allProductionRecords.push(...records);
    }

    // Batch insert production history (idempotent with ON CONFLICT)
    if (allProductionRecords.length > 0) {
      await this.knex('production_history')
        .insert(allProductionRecords)
        .onConflict(['well_id', 'date'])
        .merge(); // Update if exists
    }
  }

  /**
   * Seed valuations table
   */
  public async seedValuations(
    wellsData: WellData[],
    wellsMap: Map<string, string>
  ): Promise<void> {
    const valuations: ValuationRecord[] = [];

    for (const well of wellsData) {
      const wellDbId = wellsMap.get(well.id);
      if (!wellDbId) {
        throw new Error(`Well not found in map: ${well.id}`);
      }

      const valuation = this.transformer.transformValuation(well, wellDbId);
      valuations.push(valuation);
    }

    // Insert valuations (idempotent with ON CONFLICT)
    if (valuations.length > 0) {
      await this.knex('valuations')
        .insert(valuations)
        .onConflict('well_id')
        .merge(); // Update if exists
    }
  }
}

/**
 * Main seed function
 * Entry point for Knex seed system
 */
export async function seed(knex: Knex): Promise<void> {
  // Initialize services (Dependency Inversion Principle)
  // Use relative path from backend directory which works in both CommonJS and ESM
  // Path from backend to ../data/processed/wells.json
  const dataPath = resolve(process.cwd(), '../data/processed/wells.json');
  const loader = new WellsDataLoader(dataPath);
  const transformer = new DataTransformer();
  const seeder = new DatabaseSeeder(knex, transformer);

  // Load data
  const wellsData = loader.loadWellsData();

  // Seed in order (respecting foreign key constraints)
  console.log('Seeding operators...');
  const operatorsMap = await seeder.seedOperators(wellsData);
  console.log(`Seeded ${operatorsMap.size} operators`);

  console.log('Seeding wells...');
  const wellsMap = await seeder.seedWells(wellsData, operatorsMap);
  console.log(`Seeded ${wellsMap.size} wells`);

  console.log('Seeding production history...');
  await seeder.seedProductionHistory(wellsData, wellsMap);
  console.log('Production history seeded');

  console.log('Seeding valuations...');
  await seeder.seedValuations(wellsData, wellsMap);
  console.log('Valuations seeded');

  console.log('Database seeding completed successfully!');
}
