# Task 202: Create Database Seed Scripts

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Data Processing Pipeline" lines 1581-1632

## Objective
Create Knex seed scripts to populate database from processed JSON.

## Acceptance Criteria
- [ ] Seed script reads `data/processed/operators.json` and `wells.json`
- [ ] Seeds operators table
- [ ] Seeds wells table with embeddings
- [ ] Seeds production_history table
- [ ] Seeds valuations table
- [ ] All foreign keys maintained
- [ ] Seed runs idempotently (can run multiple times)

## Verification
```bash
cd backend && npm run seed
psql -d oilfield -c "SELECT COUNT(*) FROM wells;"  # Should be 20-30
psql -d oilfield -c "SELECT COUNT(*) FROM production_history;"
psql -d oilfield -c "SELECT embedding IS NOT NULL FROM wells LIMIT 1;"  # Should be true
```

## Time Estimate
15 minutes (Agent 3, Hour 1:45-2:00)
