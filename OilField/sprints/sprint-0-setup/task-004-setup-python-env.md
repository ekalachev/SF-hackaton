# Task 004: Setup Python Environment

## References
- `docs/PGVECTOR_INTEGRATION.md` - Section "Embedding Generation Service" lines 206-331
- `docs/FREE_EMBEDDINGS_BENEFITS.md` - Section "Setup Instructions" lines 124-146

## Objective
Install Python dependencies for embeddings generation.

## Acceptance Criteria
- [ ] Python 3.10+ verified
- [ ] `sentence-transformers` package installed
- [ ] Model downloads successfully on first import
- [ ] Test script generates 384-dim vector

## Verification
```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
vec = model.encode("test well description")
assert len(vec) == 384
```

## Time Estimate
10 minutes (Agent 3, Hour 0:00-0:10)
