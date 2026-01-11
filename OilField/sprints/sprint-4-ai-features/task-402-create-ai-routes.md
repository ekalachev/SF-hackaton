# Task 402: Create AI API Routes

## References
- `docs/CLAUDE_CLI_INTEGRATION.md` - Section "API Routes" lines 698-814
- `docs/PGVECTOR_INTEGRATION.md` - API endpoints lines 91-199

## Objective
Add routes for AI report generation and well narratives.

## Acceptance Criteria
- [ ] `src/routes/ai.routes.ts` per CLAUDE_CLI_INTEGRATION.md lines 700-814
- [ ] POST /api/wells/:id/generate-report endpoint
- [ ] GET /api/wells/:id/narrative endpoint with caching
- [ ] Error handling for Claude CLI failures
- [ ] Returns markdown formatted response

## Verification
```bash
curl -X POST http://localhost:3001/api/wells/<id>/generate-report | jq '.report'
# Should return full markdown report
curl http://localhost:3001/api/wells/<id>/narrative | jq '.narrative'
```

## Time Estimate
15 minutes (Agent 1, Hour 2:45-3:00)
