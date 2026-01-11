# OilField Data Pipeline - Embeddings Generation

This directory contains Python tools for generating semantic embeddings for oil well data using Sentence Transformers.

## Overview

We use **Sentence Transformers** (`all-MiniLM-L6-v2`) to generate 384-dimension vector embeddings for oil wells. This enables:
- Semantic similarity search
- Natural language querying
- AI-powered well recommendations

### Why Sentence Transformers?
- **100% FREE** - No API costs
- **Fast** - Local processing, no network latency
- **No API Keys** - Zero configuration needed
- **Better for semantic search** - Specifically designed for similarity tasks
- **Smaller vectors** - 384 dimensions vs OpenAI's 1536 (4x smaller = faster queries)

## Setup Instructions

### Prerequisites
- Python 3.10 or higher (tested with Python 3.12.2)
- 1GB disk space (for model download)

### Installation

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

3. Test the installation:
```bash
python test_embeddings.py
```

You should see output confirming:
- ✅ Model loads successfully
- ✅ Embeddings are 384 dimensions
- ✅ Similarity calculations work correctly
- ✅ Batch processing is efficient

## Dependencies

The `requirements.txt` includes:
- `sentence-transformers` - Core ML library for embeddings
- `torch` - PyTorch backend
- `transformers` - Hugging Face transformers
- `numpy` - Numerical computing
- `pandas` - Data manipulation
- `psycopg2-binary` - PostgreSQL connectivity
- `tqdm` - Progress bars

## Model Information

### all-MiniLM-L6-v2
- **Dimensions:** 384
- **Parameters:** 22.7M
- **Training:** 1B+ sentence pairs
- **Performance:** SOTA for semantic similarity
- **Download size:** ~90MB (cached locally after first use)

### First Run
The model will download automatically on first use (~30 seconds). Subsequent runs use the cached model instantly.

## Usage Examples

### Basic Embedding Generation
```python
from sentence_transformers import SentenceTransformer

# Load model (cached after first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embedding
text = "Oil well in Eagle Ford with 45 bbl/day production"
embedding = model.encode(text)

# Result: numpy array with 384 dimensions
assert len(embedding) == 384
```

### Batch Processing
```python
# Process multiple wells efficiently
wells = [
    "Oil well TX-001 in Eagle Ford...",
    "Oil well TX-002 in Permian Basin...",
    # ... more wells
]

embeddings = model.encode(wells, show_progress_bar=True)
# Result: (N, 384) numpy array
```

### Similarity Calculation
```python
import numpy as np

# Calculate cosine similarity
similarity = np.dot(embedding1, embedding2) / (
    np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
)
```

## Performance

Based on testing:
- **Single embedding:** ~10ms per well
- **Batch processing:** ~50 wells in 0.5 seconds
- **Throughput:** ~100 wells/second

Compare to OpenAI API:
- OpenAI: 200-500ms per request + network latency
- Ours: 10ms per embedding, no network needed

## Testing

Run the comprehensive test suite:
```bash
python test_embeddings.py
```

Tests include:
1. Model loading
2. Embedding generation
3. Dimension verification (384)
4. Similarity calculations
5. Batch processing performance

## Integration with PostgreSQL

Embeddings will be stored in PostgreSQL using the `pgvector` extension:

```sql
-- Store embeddings
ALTER TABLE wells ADD COLUMN embedding vector(384);

-- Create index for fast similarity search
CREATE INDEX idx_wells_embedding ON wells
  USING hnsw (embedding vector_cosine_ops);

-- Find similar wells
SELECT * FROM wells
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;
```

## Next Steps

1. ✅ Python environment setup (completed)
2. ✅ Model verification (completed)
3. Generate embeddings for seed data
4. Integrate with backend API
5. Create similarity search endpoints

## Troubleshooting

### Model won't download
- Check internet connection (needed for first download only)
- Verify Hugging Face Hub is accessible
- Try: `rm -rf ~/.cache/huggingface/` and retry

### Import errors
- Ensure virtual environment is activated
- Reinstall: `pip install -r requirements.txt --force-reinstall`

### Out of memory
- Reduce batch size in `model.encode()`
- Use `convert_to_numpy=True` to save memory

## Resources

- [Sentence Transformers Documentation](https://www.sbert.net/)
- [all-MiniLM-L6-v2 Model Card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## License

MIT License - See project root for details
