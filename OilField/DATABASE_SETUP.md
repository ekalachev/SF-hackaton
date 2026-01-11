# Database Setup - OilField Project

## Overview
PostgreSQL 16 with pgvector extension for semantic similarity search and vector operations.

## Quick Start

### 1. Start the Database
```bash
docker compose up -d
```

### 2. Verify Database is Running
```bash
docker ps | grep oilfield-postgres
```

### 3. Connect to Database
```bash
# Using psql from the container
docker exec -it oilfield-postgres psql -U oilfield -d oilfield

# Using psql from host (if psql is installed)
psql -h localhost -p 5434 -U oilfield -d oilfield
# Password: oilfield_dev
```

## Connection Details

- **Host**: localhost
- **Port**: 5434 (mapped from container's 5432)
- **Database**: oilfield
- **User**: oilfield
- **Password**: oilfield_dev
- **Connection URL**: postgresql://oilfield:oilfield_dev@localhost:5434/oilfield

## Extensions Enabled

### pgvector (v0.8.1)
Vector similarity search for AI-powered well recommendations.

**Test pgvector:**
```sql
-- Create test table with vector column
CREATE TABLE test_embeddings (
  id serial PRIMARY KEY,
  name text,
  embedding vector(384)  -- 384 dimensions for all-MiniLM-L6-v2 model
);

-- Insert test vectors
INSERT INTO test_embeddings (name, embedding)
VALUES ('well_1', ARRAY[0.1, 0.2, 0.3, ...]::real[]);

-- Find similar vectors using cosine distance
SELECT name, embedding <=> '[0.1, 0.2, 0.3, ...]'::vector as distance
FROM test_embeddings
ORDER BY distance
LIMIT 5;

-- Create HNSW index for fast similarity search
CREATE INDEX ON test_embeddings USING hnsw (embedding vector_cosine_ops);
```

### PostGIS
**Status**: Not available in current image (pgvector/pgvector:pg16)

**Note**: PostGIS is optional for this project. If needed, switch to postgis/postgis:16-3.4 image or install PostGIS manually.

## Docker Management

### Stop Database
```bash
docker compose down
```

### Stop and Remove All Data
```bash
docker compose down -v
```

### View Logs
```bash
docker logs oilfield-postgres
```

### View Container Stats
```bash
docker stats oilfield-postgres
```

## Database Initialization

The database is automatically initialized with the `scripts/init-db.sql` script on first run:

1. Creates pgvector extension
2. Attempts to create PostGIS extension (gracefully fails if not available)
3. Verifies extensions are installed

## Troubleshooting

### Port Already in Use
If port 5434 is already in use, edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "5435:5432"  # Change 5434 to any available port
```

### Container Won't Start
Check logs for errors:
```bash
docker logs oilfield-postgres
```

### Can't Connect to Database
1. Verify container is running: `docker ps | grep oilfield-postgres`
2. Check health status: `docker inspect oilfield-postgres | grep Health -A 10`
3. Verify port mapping: `docker port oilfield-postgres`

### Reset Database
Remove volume and restart:
```bash
docker compose down -v
docker compose up -d
```

## Development Workflow

### Create .env File
Copy the example and customize if needed:
```bash
cp .env.example .env
```

### Run Migrations (Coming Soon)
```bash
# Backend migrations will be added in Task 004
cd backend
npm run migrate
```

### Seed Data (Coming Soon)
```bash
# Data seeding will be added in Task 007
cd backend
npm run seed
```

## Performance Notes

- **Vector Index Type**: HNSW (Hierarchical Navigable Small World)
  - Optimized for similarity search
  - Sub-10ms queries on 1000+ wells
  - Trade-off: Slightly slower inserts, much faster queries

- **Vector Operations**:
  - `<->` Euclidean distance (L2)
  - `<#>` Negative inner product
  - `<=>` Cosine distance (recommended for semantic search)

## Next Steps

1. Install Knex.js and create migration scripts (Task 004)
2. Define database schema for wells, operators, valuations (Task 004)
3. Seed database with RRC data (Task 007)
4. Generate embeddings for semantic search (Task 008)

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [PGVECTOR_INTEGRATION.md](docs/PGVECTOR_INTEGRATION.md) - Semantic search implementation details
