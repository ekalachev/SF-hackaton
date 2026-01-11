# Task 206: Create API Routes

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "API Endpoints" lines 457-738
- `docs/PGVECTOR_INTEGRATION.md` - Section "API Routes" lines 483-576

## Objective
Implement Express routes for wells and similarity search.

## Acceptance Criteria
- [ ] `src/routes/wells.routes.ts` with GET /api/wells, GET /api/wells/:id
- [ ] `src/routes/similarity.routes.ts` per PGVECTOR_INTEGRATION.md lines 485-576
- [ ] GET /api/wells/:id/similar endpoint
- [ ] POST /api/search/semantic endpoint
- [ ] Zod validation on all inputs
- [ ] Proper error responses (404, 400, 500)
- [ ] CORS configured

## Verification
```bash
curl http://localhost:3001/api/wells | jq '.wells | length'
curl http://localhost:3001/api/wells/<id> | jq '.well.wellId'
curl http://localhost:3001/api/wells/<id>/similar | jq '.similarWells | length'
```

## Time Estimate
25 minutes (Agent 1, Hour 1:55-2:20)
