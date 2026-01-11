# OilField Database Schema - Quick Reference

## Database Overview
- **Type**: PostgreSQL 16
- **Query Builder**: Knex.js
- **Vector Search**: pgvector (384 dimensions)
- **Extensions**: pgvector v0.8.1, PostGIS (optional)

## Tables Summary

| Table | Purpose | Key Fields | Relationships |
|-------|---------|-----------|----------------|
| **operators** | Company/entity operating wells | id (UUID), name | 1-to-many: wells |
| **wells** | Oil well records (core entity) | id, well_id, well_name, api_number, operator_id, embedding | many-to-one: operators, one-to-many: production_history, one-to-one: valuations |
| **production_history** | Time-series production data | id, well_id, date, oil_bbl, gas_mcf, water_bbl | many-to-one: wells |
| **valuations** | Well valuation metrics | id, well_id, npv_usd, market_value_usd, discount_pct, oil_price_usd, operating_cost_per_bbl, discount_rate, royalty_rate | one-to-one: wells |
| **well_narratives** | AI-generated well descriptions (cached) | id, well_id, narrative | many-to-one: wells |

## Entity Relationship Diagram

```
operators (1) ──────────────── (many) wells
                    |
                    ├──────── (many) production_history
                    |              (time-series data)
                    |
                    └──────── (1) valuations
                                  (+ economic assumptions)
                                  |
                                  └──── (many) well_narratives
                                        (AI-cached)
```

## Field Types at a Glance

```
PRIMARY KEYS:        UUID (gen_random_uuid())
FINANCIAL VALUES:    DECIMAL(15,2) for millions
PRODUCTION DATA:     DECIMAL(12,2) for barrels/MCF
PERCENTAGES/RATES:   DECIMAL(5,2) or DECIMAL(5,4)
TIMESTAMPS:          TIMESTAMP WITH TZ (auto-managed)
EMBEDDINGS:          VECTOR(384) pgvector
IDENTIFIERS:         TEXT (well_id, api_number)
COORDINATES:         DECIMAL(10,8) and DECIMAL(11,8)
```

## Indexes for Fast Queries

**By Table:**

| Table | Indexes |
|-------|---------|
| operators | name (unique) |
| wells | well_id (unique), api_number (unique), operator_id, status, county, embedding (HNSW) |
| production_history | (well_id, date DESC) composite |
| valuations | well_id (unique) |
| well_narratives | well_id, created_at |

## Foreign Key Cascades

```
Delete operator      → well.operator_id set to NULL (preserves well data)
Delete well          → production_history CASCADED DELETE
Delete well          → valuations CASCADED DELETE
Delete well          → well_narratives CASCADED DELETE
```

## Auto-Updated Fields

All tables have `created_at` and `updated_at` timestamps.
`updated_at` is automatically updated by trigger on every UPDATE.

## Key Constraints

- **operators.name**: UNIQUE (no duplicate operators)
- **wells.well_id**: UNIQUE (globally unique identifier)
- **wells.api_number**: UNIQUE (standard oil/gas identifier)
- **valuations.well_id**: UNIQUE (one valuation per well)
- **production_history(well_id, date)**: UNIQUE COMPOSITE (one record per date per well)

## Migrations Applied

1. **001_initial_schema.ts** - Core tables + pgvector setup
2. **20251101070508_add_well_narratives_table.ts** - AI narrative caching
3. **20251101070630_add_valuation_economic_fields.ts** - Economic assumptions

## Default Values

| Field | Default |
|-------|---------|
| wells.state | 'TX' |
| wells.status | 'active' |
| wells.embedding_model | 'all-MiniLM-L6-v2' |
| valuations.oil_price_usd | 75.00 |
| valuations.operating_cost_per_bbl | 15.00 |
| valuations.discount_rate | 0.10 (10%) |
| valuations.royalty_rate | 0.20 (20%) |
| valuations.valuation_date | NOW() |

## Most Important Queries

### 1. Get well with all related data
```sql
SELECT w.*, o.name, v.npv_usd
FROM wells w
LEFT JOIN operators o ON w.operator_id = o.id
LEFT JOIN valuations v ON w.id = v.well_id
WHERE w.id = $1;
```

### 2. Find similar wells (semantic search)
```sql
SELECT id, well_name, embedding <=> $1::vector AS distance
FROM wells
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### 3. Production history for period
```sql
SELECT * FROM production_history
WHERE well_id = $1 AND date BETWEEN $2 AND $3
ORDER BY date;
```

### 4. Filter wells by criteria
```sql
SELECT w.id, w.well_name, v.npv_usd
FROM wells w
LEFT JOIN valuations v ON w.id = v.well_id
WHERE w.county = $1 AND v.discount_pct > $2
ORDER BY v.npv_usd DESC;
```

## Database Connection (Development)

```
Host:     localhost
Port:     5434
Database: oilfield
User:     oilfield
Password: oilfield_dev

Connection String:
postgresql://oilfield:oilfield_dev@localhost:5434/oilfield
```

## Performance Notes

- **Vector search (HNSW)**: ~10ms on 1000+ wells
- **Single lookup**: <1ms (indexed)
- **Range query**: <10ms (indexed)
- **Complex joins**: 10-50ms
- **Batch insert 1000**: 1-3 seconds

## Seeding Process

1. Loads from `/data/processed/wells.json`
2. Extracts unique operators
3. Seeds operators → wells → production_history → valuations
4. All operations are **idempotent** (safe to re-run)

## Quick Command Reference

```bash
# Run migrations
npm run migrate:latest

# Rollback latest migration
npm run migrate:rollback

# Seed database
npm run seed

# Connect to database (from container)
docker exec -it oilfield-postgres psql -U oilfield -d oilfield

# Connect to database (from host)
psql -h localhost -p 5434 -U oilfield -d oilfield
# Password: oilfield_dev
```

## Important Files

- Migration files: `/backend/src/db/migrations/`
- Seed file: `/backend/src/db/seeds/001_seed_wells_data.ts`
- Knex config: `/backend/knexfile.ts`
- Type definitions: `/backend/src/types/well.types.ts`
- DB init script: `/scripts/init-db.sql`

## Design Principles Applied

- **SOLID**: Single Responsibility (service layer), Dependency Inversion (Knex abstraction)
- **UUID Primary Keys**: Globally unique, distributed-system friendly
- **DECIMAL for Money**: Precision in financial calculations
- **Cascading Deletes**: Data consistency (no orphaned records)
- **Unique Constraints**: Business rule enforcement at database level
- **Composite Indexes**: Optimized for common query patterns
- **Vector Indexes (HNSW)**: Fast semantic similarity search

---

**Version**: OilField 0.7.0
**Updated**: November 1, 2025
**For detailed documentation**: See DATABASE_SCHEMA.md
