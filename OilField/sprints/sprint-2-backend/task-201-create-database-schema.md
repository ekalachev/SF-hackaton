# Task 201: Create Database Schema

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Database Schema" lines 88-397
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "4. Database Schema" lines 318-398

## Objective
Create Knex migration with complete database schema including pgvector.

## Acceptance Criteria
- [ ] Knex configured per TECHNICAL_EXECUTION_PLAN.md lines 408-410
- [ ] Migration file created with schema from lines 92-397
- [ ] Tables: operators, wells, production_history, valuations, well_narratives
- [ ] pgvector extension enabled
- [ ] HNSW index on wells.embedding per line 344
- [ ] Triggers for location update and timestamps
- [ ] Migration runs successfully

## Verification
```bash
cd backend && npm run migrate
psql -d oilfield -c "\dt"  # Should list all tables
psql -d oilfield -c "SELECT * FROM pg_indexes WHERE indexname LIKE '%embedding%';"
```

## Time Estimate
20 minutes (Agent 1, Hour 0:20-0:40)
