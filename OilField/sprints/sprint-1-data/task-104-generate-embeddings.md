# Task 104: Generate Well Embeddings

## References
- `docs/PGVECTOR_INTEGRATION.md` - Section "Data Pipeline Integration" lines 712-781
- `docs/FREE_EMBEDDINGS_BENEFITS.md` - Complete document

## Objective
Generate 384-dim embeddings for all wells using Sentence Transformers.

## Acceptance Criteria
- [ ] Well description generator per PGVECTOR_INTEGRATION.md lines 740-755
- [ ] Sentence Transformers model loaded
- [ ] Embeddings generated for all wells
- [ ] Each embedding is 384 dimensions
- [ ] Embeddings added to `wells.json` with `embeddingModel: 'all-MiniLM-L6-v2'`

## Verification
```python
import json
with open('data/processed/wells.json') as f:
    wells = json.load(f)
assert all('embedding' in w for w in wells)
assert all(len(w['embedding']) == 384 for w in wells)
```

## Time Estimate
15 minutes (Agent 3, Hour 1:30-1:45)
