/**
 * Embedding Service for generating semantic embeddings using Python Sentence Transformers
 *
 * Follows SOLID principles:
 * - Single Responsibility: Only handles embedding generation
 * - Open/Closed: Extensible for different models
 * - Dependency Inversion: Depends on Knex abstraction
 *
 * Uses all-MiniLM-L6-v2 model (384 dimensions) via Python script
 */

import type { Knex } from 'knex';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { WellDescriptionInput } from '../models/Well';

const execAsync = promisify(exec);

/**
 * Service for generating embeddings for semantic search
 */
export class EmbeddingService {
  private pythonScript: string;
  private readonly modelName = 'all-MiniLM-L6-v2';
  private readonly embeddingDimensions = 384;

  constructor(private db: Knex) {
    // Use temp directory for Python script
    this.pythonScript = join(tmpdir(), 'oilfield_generate_embedding.py');
    // Initialize Python script asynchronously (fire and forget)
    void this.initializePythonScript();
  }

  /**
   * Initialize Python script for embeddings (runs once at service creation)
   * Creates a temporary Python script that uses Sentence Transformers
   */
  private async initializePythonScript(): Promise<void> {
    const script = `#!/usr/bin/env python3
import sys
import json
from sentence_transformers import SentenceTransformer

# Load model (cached after first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Read text from stdin
text = sys.stdin.read()

# Generate embedding
embedding = model.encode(text).tolist()

# Output as JSON
print(json.dumps(embedding))
`;
    await writeFile(this.pythonScript, script, { mode: 0o755 });
  }

  /**
   * Generate natural language description for a well
   * Following PGVECTOR_INTEGRATION.md lines 251-266
   *
   * @param well - Well data for description generation
   * @returns Natural language description string
   */
  generateWellDescription(well: WellDescriptionInput): string {
    // Determine valuation category
    const discountPct = well.valuation_discount_pct ?? 0;
    const valuationCategory =
      discountPct >= 20 ? 'undervalued' :
      discountPct <= -20 ? 'overvalued' : 'fairly valued';

    // Build description parts
    const parts: string[] = [
      `Oil well ${well.well_name} in ${well.county || 'Unknown'} County, ${well.state}.`,
      `Located in ${well.field || 'unspecified'} formation.`,
    ];

    // Add production info if available
    if (well.current_oil_bbl_day !== undefined) {
      parts.push(`Current production: ${well.current_oil_bbl_day.toFixed(1)} bbl/day.`);
    }

    parts.push(`Status: ${well.status}.`);

    // Add valuation info if available
    if (well.valuation_discount_pct !== undefined) {
      parts.push(
        `Valuation: ${Math.abs(well.valuation_discount_pct).toFixed(1)}% ${valuationCategory}.`
      );
    }

    // Add decline rate if available
    if (well.decline_rate_annual !== undefined) {
      parts.push(
        `Decline rate: ${(well.decline_rate_annual * 100).toFixed(1)}% annually.`
      );
    }

    // Add cumulative production if available
    if (well.cumulative_oil_bbl !== undefined) {
      parts.push(
        `Cumulative production: ${well.cumulative_oil_bbl.toLocaleString()} barrels.`
      );
    }

    // Add operator if available
    if (well.operator_name) {
      parts.push(`Operator: ${well.operator_name}.`);
    }

    return parts.join(' ');
  }

  /**
   * Generate embedding vector for text using Python Sentence Transformers
   * Calls Python script via child_process
   *
   * @param text - Text to generate embedding for
   * @returns 384-dimensional embedding vector
   * @throws Error if Python script execution fails
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (text === null || text === undefined) {
      throw new Error('Text cannot be null or undefined');
    }

    try {
      // Escape text for shell command
      const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      // Call Python script
      const { stdout, stderr } = await execAsync(
        `echo "${escapedText}" | python3 "${this.pythonScript}"`,
        {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
          timeout: 30000, // 30 second timeout
        }
      );

      if (stderr && stderr.trim()) {
        console.warn('Python script stderr:', stderr);
      }

      // Parse JSON output
      const embedding = JSON.parse(stdout.trim()) as number[];

      // Validate embedding dimensions
      if (!Array.isArray(embedding)) {
        throw new Error('Python script did not return an array');
      }

      if (embedding.length !== this.embeddingDimensions) {
        throw new Error(
          `Expected ${this.embeddingDimensions} dimensions, got ${embedding.length}`
        );
      }

      return embedding;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate embedding: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Update embedding for a single well in database
   *
   * @param wellId - UUID of the well to update
   * @throws Error if well not found
   */
  async updateWellEmbedding(wellId: string): Promise<void> {
    // Get well data with joined operator name and valuation
    const wellQuery = this.db('wells')
      .leftJoin('operators', 'wells.operator_id', 'operators.id')
      .leftJoin('valuations', 'wells.id', 'valuations.well_id')
      .select(
        'wells.id',
        'wells.well_name',
        'wells.county',
        'wells.state',
        'wells.field',
        'wells.status',
        'operators.name as operator_name',
        'valuations.discount_pct as valuation_discount_pct'
      )
      .where('wells.id', wellId)
      .first();

    const well = await wellQuery as WellDescriptionInput | undefined;

    if (!well) {
      throw new Error(`Well ${wellId} not found`);
    }

    // Generate description
    const description = this.generateWellDescription(well);

    // Generate embedding
    const embedding = await this.generateEmbedding(description);

    // Update database with pgvector format
    await this.db('wells')
      .where({ id: wellId })
      .update({
        embedding: JSON.stringify(embedding), // pgvector accepts JSON array
        embedding_model: this.modelName,
        description,
        updated_at: this.db.fn.now(),
      });
  }

  /**
   * Batch update embeddings for all wells
   * Useful for initial population or full refresh
   */
  async updateAllEmbeddings(): Promise<void> {
    const wells = await this.db('wells').select('id') as { id: string }[];

    console.log(`Updating embeddings for ${wells.length} wells...`);

    for (const well of wells) {
      try {
        await this.updateWellEmbedding(well.id);
        console.log(`✓ Updated embedding for well ${well.id}`);
      } catch (error) {
        console.error(`✗ Failed to update well ${well.id}:`, error);
      }
    }

    console.log('✅ All embeddings updated!');
  }

  /**
   * Get model information
   */
  getModelInfo(): { name: string; dimensions: number } {
    return {
      name: this.modelName,
      dimensions: this.embeddingDimensions,
    };
  }
}
