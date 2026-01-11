# 🎯 pgvector Integration - Semantic Search for Oil Wells

## Overview
This document details the pgvector integration that enables **AI-powered semantic similarity search** across oil wells. This is a KILLER demo feature that sets us apart from traditional well valuation tools.

---

## What It Enables

### Core Features
1. **"Find Similar Wells"** - Given a well, find others with similar characteristics
2. **Natural Language Search** - "Find undervalued wells in Eagle Ford with declining production"
3. **AI Recommendations** - Smart suggestions based on user's viewing history
4. **Production Pattern Matching** - Find wells with similar decline curves

### Demo Impact
- ✨ **Visual WOW**: Click well → "Similar Wells" panel slides in with 5 relevant wells
- ✨ **Voice Search**: "Show me wells like this one" → instant results
- ✨ **Intelligence**: Goes beyond filters - understands semantics
- ✨ **Differentiator**: No other oil field tool has this

---

## Technical Architecture

### Vector Embeddings Strategy

**What We Embed:**
Each well gets a 384-dimension vector (Sentence Transformers `all-MiniLM-L6-v2` - **FREE!**) representing:
```
Well description =
  "Oil well {well_name} in {county} County, {state}. " +
  "Located in {formation} formation. " +
  "Current production: {current_oil_bbl_day} bbl/day. " +
  "Status: {status}. " +
  "Valuation: {valuation_discount_pct}% {undervalued|overvalued}. " +
  "Decline rate: {decline_rate_annual}% annually. " +
  "Cumulative production: {cumulative_oil_bbl} barrels. " +
  "Operator: {operator_name}. " +
  "Tags: {tags_joined}."
```

**Example:**
```text
"Oil well Smith County Well 47A in Smith County, TX. Located in Eagle Ford Shale formation.
Current production: 45 bbl/day. Status: active. Valuation: 34% undervalued.
Decline rate: 18% annually. Cumulative production: 180000 barrels.
Operator: Independent Oil Co. Tags: undervalued, opportunity, declining."
```

### Database Schema Addition

```sql
-- Add to wells table
ALTER TABLE wells ADD COLUMN embedding vector(384);
ALTER TABLE wells ADD COLUMN embedding_model VARCHAR(50) DEFAULT 'all-MiniLM-L6-v2';
ALTER TABLE wells ADD COLUMN embedding_updated_at TIMESTAMPTZ;

-- Create HNSW index for fast similarity search
CREATE INDEX idx_wells_embedding ON wells
  USING hnsw (embedding vector_cosine_ops);
```

### Similarity Search Query

```sql
-- Find top 5 similar wells to a given well
SELECT
  w.id,
  w.well_id,
  w.well_name,
  w.current_oil_bbl_day,
  w.valuation_discount_pct,
  1 - (w.embedding <=> target.embedding) as similarity
FROM wells w
CROSS JOIN (
  SELECT embedding FROM wells WHERE id = $1
) target
WHERE w.id != $1  -- Exclude the target well itself
ORDER BY w.embedding <=> target.embedding
LIMIT 5;
```

**Performance:**
- HNSW index enables sub-10ms queries on 1000+ wells
- Cosine similarity (`<=>`) finds semantically related wells
- Returns similarity score (0-1, higher = more similar)

---

## API Endpoints

### 1. Get Similar Wells

**GET /api/wells/:id/similar**

Find wells similar to a specific well.

```typescript
Query Params:
  limit?: number (default 5, max 20)
  minSimilarity?: number (default 0.7, range 0-1)
  excludeOperator?: boolean (default false) // Exclude same operator

Response: 200 OK
{
  "targetWell": {
    "id": "uuid",
    "wellId": "TX-2438",
    "wellName": "Smith County Well 47A"
  },
  "similarWells": [
    {
      "well": {
        "id": "uuid",
        "wellId": "TX-3521",
        "wellName": "Smith County Well 52B",
        "operator": "Independent Oil Co",
        "location": { "county": "Smith", "latitude": 32.45, "longitude": -95.31 },
        "production": {
          "currentOilBblDay": 48,
          "cumulativeOilBbl": 175000
        },
        "valuation": {
          "npvUsd": 1920000,
          "discountPct": 31,
          "confidence": 0.85
        }
      },
      "similarity": 0.94,
      "matchReasons": [
        "Similar production rate (48 vs 45 bbl/day)",
        "Same formation (Eagle Ford)",
        "Both undervalued (31% vs 34%)",
        "Same county (Smith)"
      ]
    },
    // ... 4 more wells
  ]
}
```

### 2. Semantic Search (Natural Language)

**POST /api/search/semantic**

Search wells using natural language queries.

```typescript
Body:
{
  "query": "find undervalued wells in Eagle Ford with declining production",
  "limit"?: number (default 10),
  "filters"?: {
    "county"?: string,
    "status"?: string,
    "minProduction"?: number,
    "maxProduction"?: number
  }
}

Response: 200 OK
{
  "query": "find undervalued wells in Eagle Ford with declining production",
  "queryEmbedding": [0.023, -0.154, ...], // For debugging
  "results": [
    {
      "well": { /* full well object */ },
      "relevanceScore": 0.89,
      "matchedCriteria": [
        "Formation: Eagle Ford ✓",
        "Valuation: 34% undervalued ✓",
        "Production trend: Declining 18%/year ✓"
      ]
    }
  ],
  "totalResults": 8,
  "searchTime": "12ms"
}
```

### 3. Get Well Recommendations

**GET /api/recommendations/:userId** (Future)

Personalized well recommendations based on viewing history.

```typescript
Response: 200 OK
{
  "recommendations": [
    {
      "well": { /* full well object */ },
      "score": 0.92,
      "reason": "Similar to wells you recently viewed"
    }
  ]
}
```

---

## Backend Implementation

### Embedding Generation Service

```typescript
// src/services/embeddingService.ts

import { Knex } from 'knex';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

export class EmbeddingService {
  private pythonScript = '/tmp/generate_embedding.py';

  constructor(private db: Knex) {
    this.initializePythonScript();
  }

  /**
   * Initialize Python script for embeddings (runs once)
   */
  private async initializePythonScript() {
    const script = `
import sys
import json
from sentence_transformers import SentenceTransformer

# Load model (cached after first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Read text from stdin
text = sys.stdin.read()

# Generate embedding
embedding = model.encode(text).tolist()

# Output as JSON
print(json.dumps(embedding))
`;
    await writeFile(this.pythonScript, script);
  }

  /**
   * Generate text description for a well (to be embedded)
   */
  generateWellDescription(well: Well): string {
    const status = well.status;
    const valuationCategory = well.valuation_discount_pct >= 20 ? 'undervalued' :
                              well.valuation_discount_pct <= -20 ? 'overvalued' : 'fairly valued';

    return [
      `Oil well ${well.well_name} in ${well.county} County, ${well.state}.`,
      `Located in ${well.formation || 'unspecified'} formation.`,
      `Current production: ${well.current_oil_bbl_day} bbl/day.`,
      `Status: ${status}.`,
      `Valuation: ${Math.abs(well.valuation_discount_pct)}% ${valuationCategory}.`,
      `Decline rate: ${(well.decline_rate_annual * 100).toFixed(1)}% annually.`,
      `Cumulative production: ${well.cumulative_oil_bbl.toLocaleString()} barrels.`,
      `Operator: ${well.operator_name}.`,
      well.tags?.length ? `Tags: ${well.tags.join(', ')}.` : ''
    ].filter(Boolean).join(' ');
  }

  /**
   * Generate embedding vector for a well using FREE Sentence Transformers
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Call Python script to generate embedding
    const { stdout } = await execAsync(
      `echo "${text.replace(/"/g, '\\"')}" | python3 ${this.pythonScript}`
    );

    // Parse JSON output
    const embedding = JSON.parse(stdout.trim());
    return embedding;
  }

  /**
   * Update embedding for a single well
   */
  async updateWellEmbedding(wellId: string): Promise<void> {
    // Get well data
    const well = await this.db('wells')
      .where({ id: wellId })
      .first();

    if (!well) {
      throw new Error(`Well ${wellId} not found`);
    }

    // Generate description
    const description = this.generateWellDescription(well);

    // Generate embedding
    const embedding = await this.generateEmbedding(description);

    // Update database
    await this.db('wells')
      .where({ id: wellId })
      .update({
        embedding: JSON.stringify(embedding), // pgvector accepts JSON
        embedding_model: 'all-MiniLM-L6-v2',
        embedding_updated_at: this.db.fn.now()
      });
  }

  /**
   * Batch update embeddings for all wells
   */
  async updateAllEmbeddings(): Promise<void> {
    const wells = await this.db('wells').select('*');

    console.log(`Updating embeddings for ${wells.length} wells...`);

    for (const well of wells) {
      try {
        await this.updateWellEmbedding(well.id);
        console.log(`✓ Updated embedding for ${well.well_id}`);
      } catch (error) {
        console.error(`✗ Failed to update ${well.well_id}:`, error);
      }
    }

    console.log('✅ All embeddings updated!');
  }
}
```

### Similarity Search Service

```typescript
// src/services/similarityService.ts

import { Knex } from 'knex';

export class SimilarityService {
  constructor(private db: Knex) {}

  /**
   * Find similar wells using vector similarity
   */
  async findSimilarWells(
    wellId: string,
    options: {
      limit?: number;
      minSimilarity?: number;
      excludeOperator?: boolean;
    } = {}
  ): Promise<Array<{ well: Well; similarity: number }>> {
    const { limit = 5, minSimilarity = 0.7, excludeOperator = false } = options;

    const query = this.db('wells as w')
      .select([
        'w.*',
        this.db.raw(`1 - (w.embedding <=> target.embedding) as similarity`)
      ])
      .crossJoin(
        this.db('wells as target')
          .select('embedding', 'operator_id')
          .where('id', wellId)
          .as('target')
      )
      .where('w.id', '!=', wellId);

    if (excludeOperator) {
      query.whereRaw('w.operator_id != target.operator_id');
    }

    const results = await query
      .having(this.db.raw('1 - (w.embedding <=> target.embedding)'), '>=', minSimilarity)
      .orderByRaw('w.embedding <=> target.embedding')
      .limit(limit);

    return results.map(row => ({
      well: row,
      similarity: row.similarity
    }));
  }

  /**
   * Semantic search using natural language query
   */
  async semanticSearch(
    queryText: string,
    options: {
      limit?: number;
      filters?: {
        county?: string;
        status?: string;
        minProduction?: number;
      };
    } = {}
  ): Promise<Array<{ well: Well; relevanceScore: number }>> {
    const { limit = 10, filters = {} } = options;

    // Generate embedding for query
    const embeddingService = new EmbeddingService(this.db);
    const queryEmbedding = await embeddingService.generateEmbedding(queryText);

    let query = this.db('wells')
      .select([
        '*',
        this.db.raw(`1 - (embedding <=> ?::vector) as relevance_score`, [
          JSON.stringify(queryEmbedding)
        ])
      ]);

    // Apply filters
    if (filters.county) {
      query = query.where('county', filters.county);
    }
    if (filters.status) {
      query = query.where('status', filters.status);
    }
    if (filters.minProduction) {
      query = query.where('current_oil_bbl_day', '>=', filters.minProduction);
    }

    const results = await query
      .orderByRaw(`embedding <=> ?::vector`, [JSON.stringify(queryEmbedding)])
      .limit(limit);

    return results.map(row => ({
      well: row,
      relevanceScore: row.relevance_score
    }));
  }

  /**
   * Generate match reasons (why wells are similar)
   */
  generateMatchReasons(targetWell: Well, similarWell: Well): string[] {
    const reasons: string[] = [];

    // Production similarity
    const prodDiff = Math.abs(targetWell.current_oil_bbl_day - similarWell.current_oil_bbl_day);
    if (prodDiff < 10) {
      reasons.push(
        `Similar production rate (${similarWell.current_oil_bbl_day} vs ${targetWell.current_oil_bbl_day} bbl/day)`
      );
    }

    // Same formation
    if (targetWell.formation === similarWell.formation && targetWell.formation) {
      reasons.push(`Same formation (${targetWell.formation})`);
    }

    // Valuation similarity
    const targetUndervalued = targetWell.valuation_discount_pct >= 20;
    const similarUndervalued = similarWell.valuation_discount_pct >= 20;
    if (targetUndervalued && similarUndervalued) {
      reasons.push(
        `Both undervalued (${similarWell.valuation_discount_pct}% vs ${targetWell.valuation_discount_pct}%)`
      );
    }

    // Same county
    if (targetWell.county === similarWell.county) {
      reasons.push(`Same county (${targetWell.county})`);
    }

    // Similar decline rate
    if (targetWell.decline_rate_annual && similarWell.decline_rate_annual) {
      const declineDiff = Math.abs(targetWell.decline_rate_annual - similarWell.decline_rate_annual);
      if (declineDiff < 0.05) {
        reasons.push(
          `Similar decline rate (${(similarWell.decline_rate_annual * 100).toFixed(1)}%/year)`
        );
      }
    }

    return reasons;
  }
}
```

### API Routes

```typescript
// src/routes/similarity.routes.ts

import { Router } from 'express';
import { SimilarityService } from '../services/similarityService';
import { db } from '../config/database';

const router = Router();
const similarityService = new SimilarityService(db);

/**
 * GET /api/wells/:id/similar
 * Find wells similar to a specific well
 */
router.get('/wells/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const minSimilarity = parseFloat(req.query.minSimilarity as string) || 0.7;
    const excludeOperator = req.query.excludeOperator === 'true';

    // Get target well
    const targetWell = await db('wells').where({ id }).first();
    if (!targetWell) {
      return res.status(404).json({ error: 'Well not found' });
    }

    // Find similar wells
    const results = await similarityService.findSimilarWells(id, {
      limit,
      minSimilarity,
      excludeOperator
    });

    // Generate match reasons
    const similarWells = results.map(({ well, similarity }) => ({
      well,
      similarity: Math.round(similarity * 100) / 100,
      matchReasons: similarityService.generateMatchReasons(targetWell, well)
    }));

    res.json({
      targetWell: {
        id: targetWell.id,
        wellId: targetWell.well_id,
        wellName: targetWell.well_name
      },
      similarWells
    });
  } catch (error) {
    console.error('Error finding similar wells:', error);
    res.status(500).json({ error: 'Failed to find similar wells' });
  }
});

/**
 * POST /api/search/semantic
 * Semantic search using natural language
 */
router.post('/search/semantic', async (req, res) => {
  try {
    const { query, limit, filters } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const startTime = Date.now();

    const results = await similarityService.semanticSearch(query, {
      limit,
      filters
    });

    const searchTime = Date.now() - startTime;

    res.json({
      query,
      results: results.map(({ well, relevanceScore }) => ({
        well,
        relevanceScore: Math.round(relevanceScore * 100) / 100
      })),
      totalResults: results.length,
      searchTime: `${searchTime}ms`
    });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Failed to perform semantic search' });
  }
});

export default router;
```

---

## Frontend Integration

### Similar Wells Panel Component

```typescript
// src/components/wells/SimilarWellsPanel.tsx

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface SimilarWellsPanelProps {
  wellId: string;
}

export function SimilarWellsPanel({ wellId }: SimilarWellsPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['similar-wells', wellId],
    queryFn: () => fetch(`/api/wells/${wellId}/similar?limit=5`).then(r => r.json())
  });

  if (isLoading) {
    return <div className="animate-pulse">Finding similar wells...</div>;
  }

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          Similar Wells
          <Badge variant="outline" className="ml-auto">AI-Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.similarWells.map((item: any) => (
          <div
            key={item.well.id}
            className="p-4 rounded-lg border border-slate-700 hover:border-emerald-500/50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-white">{item.well.wellName}</h4>
                <p className="text-sm text-slate-400">{item.well.wellId}</p>
              </div>
              <Badge variant="secondary">
                {(item.similarity * 100).toFixed(0)}% match
              </Badge>
            </div>

            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {item.well.production.currentOilBblDay} bbl/day
              </Badge>
              <Badge
                variant={item.well.valuation.discountPct > 20 ? 'default' : 'secondary'}
                className="text-xs"
              >
                {item.well.valuation.discountPct}% {item.well.valuation.discountPct > 0 ? 'undervalued' : 'overvalued'}
              </Badge>
            </div>

            <div className="space-y-1">
              {item.matchReasons.map((reason: string, idx: number) => (
                <p key={idx} className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                  {reason}
                </p>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Semantic Search Bar

```typescript
// src/components/search/SemanticSearchBar.tsx

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles } from 'lucide-react';

export function SemanticSearchBar({ onResults }: { onResults: (wells: any[]) => void }) {
  const [query, setQuery] = useState('');

  const search = useMutation({
    mutationFn: (query: string) =>
      fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 })
      }).then(r => r.json()),
    onSuccess: (data) => {
      onResults(data.results.map((r: any) => r.well));
    }
  });

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Try: 'undervalued wells in Eagle Ford with high production'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search.mutate(query)}
          className="pl-10"
        />
      </div>
      <Button
        onClick={() => search.mutate(query)}
        disabled={!query || search.isPending}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {search.isPending ? 'Searching...' : 'AI Search'}
      </Button>
    </div>
  );
}
```

---

## Data Pipeline Integration

### Generate Embeddings in Data Processing

```python
# Add to scripts/process_rrc_data.py

from sentence_transformers import SentenceTransformer
from typing import List

class RRCDataProcessor:
    # ... existing code ...

    def __init__(self, input_dir: Path, output_dir: Path):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)

        # Load embedding model (FREE!)
        print("Loading Sentence Transformer model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded!")

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using FREE Sentence Transformers"""
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()

    def generate_well_description(self, well: dict) -> str:
        """Generate natural language description of a well"""
        status = well.get('status', 'active')
        discount = well.get('discount_pct', 0)
        valuation_category = 'undervalued' if discount >= 20 else 'overvalued' if discount <= -20 else 'fairly valued'

        return (
            f"Oil well {well['well_name']} in {well['county']} County, {well.get('state', 'TX')}. "
            f"Located in {well.get('formation', 'unspecified')} formation. "
            f"Current production: {well.get('current_oil_bbl_day', 0)} bbl/day. "
            f"Status: {status}. "
            f"Valuation: {abs(discount)}% {valuation_category}. "
            f"Decline rate: {well.get('decline_rate', 0)*100:.1f}% annually. "
            f"Cumulative production: {well.get('cumulative_oil_bbl', 0):,.0f} barrels. "
            f"Operator: {well.get('operator_name', 'Unknown')}."
        )

    def save_seed_data(self, wells: pd.DataFrame, operators: pd.DataFrame):
        """Enhanced version with embeddings"""
        wells_seed = []

        for idx, well in wells.iterrows():
            # Generate well description
            well_dict = well.to_dict()
            description = self.generate_well_description(well_dict)

            # Generate embedding
            print(f"Generating embedding for {well['well_id']}...")
            embedding = self.generate_embedding(description)

            wells_seed.append({
                # ... existing well data ...
                'embedding': embedding,
                'embeddingModel': 'all-MiniLM-L6-v2'
            })

        # Save to JSON
        with open(self.output_dir / 'wells_with_embeddings.json', 'w') as f:
            json.dump(wells_seed, f, indent=2, default=str)

        print(f"✅ Saved {len(wells_seed)} wells with embeddings!")
```

---

## Demo Script Enhancement

### Updated Demo Flow (90 seconds)

```
[0:00-0:15] Problem
"Pytheas Energy needs to find undervalued wells across Texas..."

[0:15-0:30] Solution
"OilTwin uses AI to identify opportunities..."

[0:30-0:50] Demo Part 1: Basic Map
"Here's our map. Green = undervalued. [CLICK well]
This well is 34% undervalued..."

[0:50-1:10] 🎯 Demo Part 2: THE KILLER FEATURE
"But here's where it gets interesting. [CLICK 'Find Similar']

Our AI instantly found 5 wells with similar characteristics.
Look - same formation, same production range, all undervalued.

This is semantic search powered by pgvector. It understands
context, not just keywords."

[1:10-1:30] Wrap Up
"Find undervalued wells. Get AI recommendations. Turn barrels into tokens.
That's OilTwin."
```

---

## Environment Variables

Add to `.env`:
```bash
# No API keys needed! Sentence Transformers run locally and are FREE!

# Just ensure Python dependencies are installed:
# pip install sentence-transformers

# pgvector is already in your Postgres
# No additional config needed!
```

---

## Performance Metrics

### Expected Performance
- **Embedding generation:** 50-100ms per well (one-time, runs locally!)
- **Similarity search:** 5-15ms for top 5 results
- **Semantic search:** 100-200ms (includes embedding + search)
- **Batch embedding:** ~50 wells in 5-8 seconds (local processing is FAST!)

### Cost Analysis
- **Embedding cost:** $0.00 (100% FREE!)
- **No API calls:** Everything runs locally
- **No rate limits:** Process as many wells as you want
- **No API keys needed:** Zero configuration
- **Actually FASTER than OpenAI API!** (No network latency)

---

## Success Criteria

### Must Have (3-hour timeline)
- ✅ Embeddings generated for all wells
- ✅ Vector index created
- ✅ GET /api/wells/:id/similar endpoint working
- ✅ SimilarWellsPanel component in UI
- ✅ Demo shows 5 similar wells with match reasons

### Should Have (if time permits)
- ✅ POST /api/search/semantic endpoint
- ✅ Semantic search bar in UI
- ✅ Match reasons displayed

### Nice to Have (stretch)
- Similarity score visualization
- "More like this" button on each result
- Search history

---

## Agent Task Updates

### Agent 1 (Backend) - Add 15 minutes
**New tasks:**
- Install Python + `sentence-transformers` package (FREE!)
- Implement EmbeddingService (calls Python script)
- Implement SimilarityService
- Add similarity routes
- Test vector similarity queries

### Agent 3 (Data) - Add 10 minutes
**New tasks:**
- Install `sentence-transformers` Python package (FREE!)
- Generate embeddings for all wells (runs locally, fast!)
- Include embeddings in seed JSON
- Verify vector index created

### Agent 2 (Frontend) - Add 10 minutes
**New tasks:**
- Create SimilarWellsPanel component
- Add "Find Similar" button to WellDetailModal
- [Optional] Create SemanticSearchBar

**Total additional time:** 35 minutes out of 270 effective hours = **EASY**

---

## Why This Wins

1. **Technical Innovation:** pgvector + OpenAI embeddings = cutting edge
2. **Visual Impact:** "Find Similar Wells" panel is instantly impressive
3. **Real AI:** Not fake "AI" - actual semantic understanding
4. **Differentiator:** No competitor has this
5. **Sponsor Appeal:** Pytheas can find wells they'd never discover manually

---

**This feature alone could win the hackathon. Let's ship it! 🚀**
