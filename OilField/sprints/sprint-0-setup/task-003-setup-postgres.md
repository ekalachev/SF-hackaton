# Task 003: Setup PostgreSQL with pgvector

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Database Schema" lines 88-397
- `docs/PGVECTOR_INTEGRATION.md` - Section "Database Schema Addition" lines 52-62

## Objective
Verify PostgreSQL is running with pgvector extension enabled.

## Acceptance Criteria
- [ ] PostgreSQL running in Docker (verify with `docker ps`)
- [ ] Can connect to database
- [ ] pgvector extension available
- [ ] PostGIS extension available (optional)

## Verification
```sql
-- Connect to postgres
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT * FROM pg_extension WHERE extname IN ('vector', 'postgis');
```

## Time Estimate
5 minutes (Agent 1, Hour 0:15-0:20)
