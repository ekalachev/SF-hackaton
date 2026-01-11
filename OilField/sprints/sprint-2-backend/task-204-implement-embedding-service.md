# Task 204: Implement Embedding Service

## References
- `docs/PGVECTOR_INTEGRATION.md` - Section "Embedding Generation Service" lines 206-331
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "12.2 Embedding Generation" lines 1018-1040

## Objective
Create service to generate embeddings via Python script.

## Acceptance Criteria
- [ ] `src/services/embeddingService.ts` per PGVECTOR_INTEGRATION.md lines 209-331
- [ ] Python script initialization per lines 227-245
- [ ] Method: `generateWellDescription()` per lines 251-266
- [ ] Method: `generateEmbedding()` calls Python per lines 272-280
- [ ] Returns 384-dim vector array
- [ ] Error handling for Python execution

## Verification
```typescript
const service = new EmbeddingService(db);
const desc = service.generateWellDescription(well);
const embedding = await service.generateEmbedding(desc);
assert(embedding.length === 384);
assert(typeof embedding[0] === 'number');
```

## Time Estimate
20 minutes (Agent 1, Hour 1:10-1:30)
