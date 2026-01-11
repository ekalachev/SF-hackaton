# Task 403: Create Similar Wells Panel Component

## References
- `docs/PGVECTOR_INTEGRATION.md` - Section "Similar Wells Panel Component" lines 583-657
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Similar panel lines 197

## Objective
Create UI panel showing AI-powered similar wells.

## Acceptance Criteria
- [ ] `src/components/wells/SimilarWellsPanel.tsx` per PGVECTOR_INTEGRATION.md lines 585-657
- [ ] Fetches from GET /api/wells/:id/similar
- [ ] Displays 5 similar wells with similarity scores
- [ ] Shows match reasons (formation, production, valuation)
- [ ] Click well to open its detail modal
- [ ] "AI-Powered" badge displayed
- [ ] Emerald theme styling

## Verification
- Panel loads when wellId provided
- Shows 5 wells with similarity percentages
- Match reasons displayed for each
- Clicking well opens new modal

## Time Estimate
25 minutes (Agent 2, Hour 2:40-3:05)
