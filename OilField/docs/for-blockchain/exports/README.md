# OilField Database Sample Data Exports

**Export Date**: November 1, 2025
**Total Export Size**: 320 KB (well under 1 MB limit)
**Database Version**: PostgreSQL 16 + pgvector 0.8.1
**Database Size**: 11 MB

## Contents

This directory contains sample data exports from the OilField production database.

### Full Data Exports

#### `sample_data.sql` (205 KB)
Complete data dump of all tables in SQL INSERT format. Includes:
- 15 operators
- 25 wells
- 432 production history records
- 25 valuations
- 0 well narratives (not yet generated)

**To restore:**
```bash
psql -h localhost -p 5434 -U oilfield -d oilfield < sample_data.sql
```

### Schema Exports

#### `schema_only.sql` (12 KB)
Complete database schema including all tables, indexes, constraints, triggers, and extensions.

**Tables included:**
- operators
- wells (with pgvector embedding column)
- production_history
- valuations
- well_narratives

**To restore schema only:**
```bash
psql -h localhost -p 5434 -U oilfield -d oilfield < schema_only.sql
```

#### `schema_tables_only.sql` (8.8 KB)
Schema for main data tables only (excludes migrations and locks).

### Sample Data (JSON Format)

#### `operators.json` (3.1 KB)
All 15 operators in JSON array format. Each record includes:
- id (UUID)
- name
- operator_number
- address
- timestamps

#### `wells_sample.json` (8.4 KB)
Sample of 15 wells with core attributes:
- id, well_id, well_name, api_number
- location (latitude, longitude, county, field, state)
- status, depth_ft, completion_date
- description

**Note:** This export excludes the vector embeddings (384 dimensions) to keep file size manageable.

#### `production_sample.json` (5.1 KB)
Sample of 20 production history records showing:
- well_id (foreign key to wells)
- production_date, production_month
- oil_bbl, gas_mcf, water_bbl volumes

#### `valuations_sample.json` (4.8 KB)
Sample of 10 well valuations with:
- well_id (foreign key)
- NPV calculations (npv_usd)
- market_value_usd, discount_pct
- Economic assumptions (oil_price_usd, discount_rate, royalty_rate)
- Reserves estimates and confidence scores

### CSV Exports

#### `operators.csv` (1.9 KB)
All operators in CSV format with headers. Suitable for Excel/Google Sheets.

#### `wells_sample.csv` (161 bytes)
Partial wells export (appears truncated from earlier export attempt).

## Database Statistics

| Table | Row Count | Description |
|-------|-----------|-------------|
| operators | 15 | Oil & gas operators |
| wells | 25 | Oil well records |
| production_history | 432 | Monthly production data |
| valuations | 25 | Well valuations (1 per well) |
| well_narratives | 0 | AI-generated narratives (empty) |

## Data Relationships

```
operators (1) ──< (N) wells
    ↓
wells (1) ──< (N) production_history
wells (1) ── (1) valuations
wells (1) ──< (N) well_narratives
```

## Key Features in Exported Data

### Vector Embeddings
The `wells` table includes a `vector(384)` column for semantic similarity search using the all-MiniLM-L6-v2 Sentence Transformer model. These embeddings are:
- Generated server-side (Python)
- Indexed with HNSW for fast similarity queries
- Used for finding similar wells by characteristics

### Indexes
- **HNSW Vector Index**: `idx_wells_embedding` for sub-10ms semantic search
- **B-tree Indexes**: On operator_id, status, county for fast filtering
- **Time-series Index**: On production_history(well_id, production_month)

### Triggers
All tables have automatic `updated_at` timestamp triggers.

## Usage Notes

1. **SQL Imports**: Use the full `sample_data.sql` for complete data restoration
2. **JSON Data**: Ideal for application testing and integration
3. **CSV Data**: Use for spreadsheet analysis and visualization
4. **Schema Files**: Use to recreate database structure without data

## Limitations

- Well embeddings not included in JSON exports (too large)
- Well narratives table is currently empty (AI generation not yet run)
- Some wells may have incomplete production history
- Valuations use sample economic assumptions

## Next Steps

To populate the well_narratives table with AI-generated content:
```bash
cd backend
npm run generate-narratives  # (if script exists)
```

To update vector embeddings:
```bash
cd backend
npm run generate-embeddings  # (if script exists)
```
