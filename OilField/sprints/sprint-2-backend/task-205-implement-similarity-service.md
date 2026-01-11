# Task 205: Implement Similarity Service

## References
- `docs/PGVECTOR_INTEGRATION.md` - Section "Similarity Search Service" lines 335-479
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "12.1 Vector Similarity Query" lines 996-1016

## Objective
Create service for vector similarity search.

## Acceptance Criteria
- [ ] `src/services/similarityService.ts` per PGVECTOR_INTEGRATION.md lines 337-479
- [ ] Method: `findSimilarWells()` per lines 346-383
- [ ] Uses pgvector `<=>` operator for cosine similarity
- [ ] Method: `semanticSearch()` per lines 388-432
- [ ] Method: `generateMatchReasons()` per lines 437-479
- [ ] Returns similarity scores 0-1

## Verification
```typescript
const service = new SimilarityService(db);
const similar = await service.findSimilarWells(wellId, { limit: 5 });
assert(similar.length <= 5);
assert(similar[0].similarity >= 0 && similar[0].similarity <= 1);
```

## Time Estimate
25 minutes (Agent 1, Hour 1:30-1:55)
