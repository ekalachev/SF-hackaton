# OilField - Technical Execution Plan
## 3-Hour Build with 3 Parallel AI Agents (30x Speed)

**Date:** 2025-10-31
**Timeline:** 3 hours (effective: 270 work hours)
**Team:** Solo + 3 AI Agents (Backend, Frontend, Data)
**Start Time:** T+1 hour
**Infrastructure:** PostgreSQL with pgvector (Docker, already running)
**🚀 KILLER FEATURE:** Semantic search with pgvector for AI-powered well recommendations

---

## Executive Summary

### Capacity Analysis
```
3 agents × 3 hours × 30x speed = 270 effective work hours

This is MORE than enough to build:
- Production-grade backend API with semantic search
- Beautiful, polished frontend with AI recommendations
- Complete data pipeline with real data + embeddings
- Full database schema with pgvector integration
- Deployment-ready application
- 🎯 AI-powered "Find Similar Wells" feature (KILLER DEMO!)
```

### Build Strategy
**Parallel Development:**
- Agent 1 (Backend): API + Database
- Agent 2 (Frontend): React App + UI
- Agent 3 (Data): Texas RRC data + Seeding

**Critical Path:** 90 minutes
**Polish Time:** 90 minutes
**Buffer:** 30 minutes

---

## 🏗️ Architecture Overview

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  - Mapbox GL map with well markers                          │
│  - Well detail modal with charts                            │
│  - Valuation display & bid calculator                       │
│  - 🎯 "Find Similar Wells" (semantic search UI)             │
│  - AI-powered recommendations                               │
│  - Responsive, animated, beautiful                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND API (Express + TS)                  │
│  - GET  /api/wells (list with filters)                      │
│  - GET  /api/wells/:id (detail + production history)        │
│  - GET  /api/wells/:id/valuation (AI valuation)            │
│  - POST /api/wells/:id/valuate (trigger re-valuation)      │
│  - GET  /api/opportunities (undervalued wells)              │
│  - 🎯 GET  /api/wells/:id/similar (semantic search!)        │
│  - 🎯 POST /api/search/semantic (natural language query)    │
│  - GET  /api/price/wti (current WTI price)                  │
│  - POST /api/blockchain/mint-twin (future: mint NFT)        │
│  - POST /api/blockchain/mint-pbt (future: mint tokens)      │
└─────────────────────────────────────────────────────────────┘
                            ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│         DATABASE (PostgreSQL + pgvector in Docker)          │
│  - wells (master table + embedding vector column)           │
│  - production_history (time series)                         │
│  - valuations (AI model outputs)                            │
│  - operators (well owners)                                  │
│  - blockchain_twins (future: NFT tracking)                  │
│  - 🎯 pgvector extension for semantic similarity search     │
└─────────────────────────────────────────────────────────────┘
                            ↑ ETL
┌─────────────────────────────────────────────────────────────┐
│                DATA SOURCES (Texas RRC)                     │
│  - Production data (monthly, CSV)                           │
│  - Well permits & completion                                │
│  - Operator information                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema (PostgreSQL)

### Complete Schema with Future Blockchain Support

```sql
-- Enable PostGIS for spatial queries (optional but nice)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 🎯 Enable pgvector for semantic search (KILLER FEATURE!)
CREATE EXTENSION IF NOT EXISTS vector;

-- Operators table
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  operator_number VARCHAR(50) UNIQUE,
  wallet_address VARCHAR(42), -- Future: Ethereum address
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wells master table
CREATE TABLE wells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  well_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "TX-2438" or API number
  well_name VARCHAR(255),
  api_number VARCHAR(50) UNIQUE, -- Official API number

  -- Operator
  operator_id UUID REFERENCES operators(id),
  operator_name VARCHAR(255), -- Denormalized for performance

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- PostGIS for spatial queries
  county VARCHAR(100),
  state VARCHAR(2) DEFAULT 'TX',
  field_name VARCHAR(255),

  -- Well attributes
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, plugged, depleted
  well_type VARCHAR(50), -- oil, gas, injection
  completion_date DATE,
  spud_date DATE,
  total_depth_ft INTEGER,
  lateral_length_ft INTEGER,
  formation VARCHAR(100),

  -- Production snapshot (current values)
  current_oil_bbl_day DECIMAL(10, 2),
  current_gas_mcf_day DECIMAL(10, 2),
  cumulative_oil_bbl DECIMAL(15, 2),
  cumulative_gas_mcf DECIMAL(15, 2),
  last_production_date DATE,
  peak_oil_bbl_day DECIMAL(10, 2),
  peak_date DATE,

  -- Decline analysis
  decline_rate_annual DECIMAL(5, 4), -- e.g., 0.18 = 18%/year
  decline_type VARCHAR(20), -- exponential, hyperbolic, harmonic
  b_factor DECIMAL(5, 3), -- Arps b-factor (0-1)

  -- Valuation snapshot (latest)
  latest_valuation_usd DECIMAL(15, 2),
  market_value_usd DECIMAL(15, 2),
  valuation_discount_pct DECIMAL(5, 2), -- Positive = undervalued
  remaining_reserves_bbl DECIMAL(15, 2),
  valuation_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  last_valuation_date TIMESTAMPTZ,

  -- Blockchain (future)
  nft_token_id BIGINT,
  nft_contract_address VARCHAR(42),
  nft_minted_at TIMESTAMPTZ,
  pbt_contract_address VARCHAR(42),
  pbt_total_supply DECIMAL(18, 8),

  -- Metadata
  tags TEXT[], -- e.g., ['undervalued', 'opportunity', 'declining']
  notes TEXT,

  -- 🎯 Semantic Search (pgvector)
  embedding vector(384), -- Sentence Transformers all-MiniLM-L6-v2 (384 dimensions, FREE!)
  embedding_model VARCHAR(50) DEFAULT 'all-MiniLM-L6-v2',
  embedding_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production history (time series)
CREATE TABLE production_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID REFERENCES wells(id) ON DELETE CASCADE,

  -- Time period
  production_date DATE NOT NULL,
  production_month DATE NOT NULL, -- First day of month (for grouping)
  days_produced INTEGER,

  -- Production volumes
  oil_bbl DECIMAL(12, 2),
  gas_mcf DECIMAL(12, 2),
  water_bbl DECIMAL(12, 2),
  condensate_bbl DECIMAL(12, 2),

  -- Rates (derived)
  oil_bbl_day DECIMAL(10, 2), -- oil_bbl / days_produced
  gas_mcf_day DECIMAL(10, 2),

  -- Data quality
  data_source VARCHAR(50) DEFAULT 'texas_rrc',
  is_estimated BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(well_id, production_date)
);

-- Valuations (AI model outputs)
CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID REFERENCES wells(id) ON DELETE CASCADE,

  -- Valuation results
  valuation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  npv_usd DECIMAL(15, 2) NOT NULL,
  market_value_usd DECIMAL(15, 2),
  discount_pct DECIMAL(5, 2), -- (market - npv) / market * 100

  -- Reserves forecast
  remaining_reserves_bbl DECIMAL(15, 2),
  eur_bbl DECIMAL(15, 2), -- Estimated Ultimate Recovery
  reserves_p10_bbl DECIMAL(15, 2), -- Pessimistic
  reserves_p50_bbl DECIMAL(15, 2), -- Most likely
  reserves_p90_bbl DECIMAL(15, 2), -- Optimistic

  -- Economic assumptions
  oil_price_usd DECIMAL(8, 2), -- WTI price used
  operating_cost_per_bbl DECIMAL(6, 2),
  discount_rate DECIMAL(5, 4), -- e.g., 0.10 = 10%
  royalty_rate DECIMAL(5, 4),

  -- Model metadata
  model_version VARCHAR(20) DEFAULT 'dca-v1',
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  calculation_time_ms INTEGER,

  -- Input features (for explainability)
  features JSONB,

  -- Recommendations
  recommended_bid_usd DECIMAL(15, 2),
  expected_roi DECIMAL(5, 2), -- e.g., 0.40 = 40%
  payback_years DECIMAL(4, 2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blockchain twins (future integration)
CREATE TABLE blockchain_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID REFERENCES wells(id) ON DELETE CASCADE,

  -- NFT details
  chain_id INTEGER NOT NULL, -- 80001 = Polygon Mumbai
  contract_address VARCHAR(42) NOT NULL,
  token_id BIGINT NOT NULL,

  -- Metadata
  metadata_uri TEXT, -- IPFS URI
  metadata_hash VARCHAR(66), -- IPFS hash

  -- Ownership
  owner_address VARCHAR(42) NOT NULL,
  minted_by VARCHAR(42),
  minted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Transactions
  mint_tx_hash VARCHAR(66),
  last_transfer_tx_hash VARCHAR(66),
  last_transfer_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chain_id, contract_address, token_id)
);

-- PBT tokens (future)
CREATE TABLE pbt_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  well_id UUID REFERENCES wells(id) ON DELETE CASCADE,

  -- Token details
  chain_id INTEGER NOT NULL,
  contract_address VARCHAR(42) NOT NULL,

  -- Supply
  total_supply DECIMAL(18, 8),
  circulating_supply DECIMAL(18, 8),
  max_supply DECIMAL(18, 8), -- Based on reserves

  -- Pricing
  price_usd DECIMAL(10, 4),
  market_cap_usd DECIMAL(15, 2),

  -- Liquidity
  liquidity_pool_address VARCHAR(42),
  liquidity_usd DECIMAL(12, 2),

  -- Stats
  holders_count INTEGER,
  transactions_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chain_id, contract_address)
);

-- Oracle updates (future)
CREATE TABLE oracle_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  oracle_type VARCHAR(50) NOT NULL, -- production, price, esg, reserves
  well_id UUID REFERENCES wells(id),

  -- Data
  data JSONB NOT NULL,
  value DECIMAL(18, 8), -- Numeric value for indexing

  -- Attestation
  oracle_address VARCHAR(42),
  signature TEXT,

  -- Blockchain
  chain_id INTEGER,
  block_number BIGINT,
  tx_hash VARCHAR(66),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_wells_location ON wells USING GIST (location);
CREATE INDEX idx_wells_status ON wells (status);
CREATE INDEX idx_wells_operator ON wells (operator_id);
CREATE INDEX idx_wells_valuation_discount ON wells (valuation_discount_pct DESC);
CREATE INDEX idx_wells_current_production ON wells (current_oil_bbl_day DESC);

-- 🎯 Vector similarity search index (HNSW for fast approximate search)
CREATE INDEX idx_wells_embedding ON wells USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_production_well_date ON production_history (well_id, production_date DESC);
CREATE INDEX idx_production_month ON production_history (production_month);

CREATE INDEX idx_valuations_well ON valuations (well_id, valuation_date DESC);
CREATE INDEX idx_valuations_discount ON valuations (discount_pct DESC);

CREATE INDEX idx_blockchain_twins_well ON blockchain_twins (well_id);
CREATE INDEX idx_blockchain_twins_owner ON blockchain_twins (owner_address);

-- Trigger for updating wells.location from lat/lng
CREATE OR REPLACE FUNCTION update_well_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wells_location_trigger
  BEFORE INSERT OR UPDATE OF latitude, longitude ON wells
  FOR EACH ROW
  EXECUTE FUNCTION update_well_location();

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wells_updated_at_trigger
  BEFORE UPDATE ON wells
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER operators_updated_at_trigger
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER blockchain_twins_updated_at_trigger
  BEFORE UPDATE ON blockchain_twins
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER pbt_tokens_updated_at_trigger
  BEFORE UPDATE ON pbt_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
```

---

## 🔌 Backend API Specification

### Tech Stack
```yaml
Runtime: Node.js 20 LTS
Language: TypeScript 5.3
Framework: Express.js 4.18
Database: PostgreSQL 14+ (Docker)
Query Builder: Knex.js 3.0 (migrations + queries)
Validation: Zod 3.22
CORS: cors 2.8.5
Env: dotenv 16.3
HTTP Client: axios 1.6 (for external APIs)
Testing: Vitest (if time permits)
```

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # Knex config
│   │   └── env.ts              # Env validation with Zod
│   ├── db/
│   │   ├── migrations/         # Knex migrations
│   │   │   └── 001_initial_schema.ts
│   │   └── seeds/              # Seed data
│   │       ├── 001_operators.ts
│   │       ├── 002_wells.ts
│   │       └── 003_production.ts
│   ├── models/                 # Type definitions
│   │   ├── Well.ts
│   │   ├── Production.ts
│   │   ├── Valuation.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── wells.routes.ts
│   │   ├── valuations.routes.ts
│   │   ├── blockchain.routes.ts  # Future endpoints
│   │   └── index.ts
│   ├── services/
│   │   ├── wellService.ts      # Business logic
│   │   ├── valuationService.ts # DCA calculations
│   │   ├── priceService.ts     # WTI price (mock or real)
│   │   └── blockchainService.ts # Future: blockchain calls
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── validators.ts
│   └── server.ts               # Express app
├── package.json
├── tsconfig.json
├── knexfile.ts
└── .env
```

### API Endpoints (Complete Spec)

#### 1. Wells Endpoints

**GET /api/wells**
```typescript
Query Params:
  limit?: number (default 100, max 500)
  offset?: number (default 0)
  minProduction?: number (bbl/day)
  maxProduction?: number (bbl/day)
  minDiscount?: number (percentage, e.g., 20)
  county?: string
  status?: 'active' | 'plugged' | 'depleted'
  sortBy?: 'production' | 'discount' | 'valuation'
  sortOrder?: 'asc' | 'desc'

Response: 200 OK
{
  "wells": [
    {
      "id": "uuid",
      "wellId": "TX-2438",
      "wellName": "Smith County Well 47A",
      "apiNumber": "42-423-12345",
      "operator": {
        "id": "uuid",
        "name": "Independent Oil Co"
      },
      "location": {
        "latitude": 32.4487,
        "longitude": -95.3010,
        "county": "Smith",
        "field": "East Texas"
      },
      "status": "active",
      "production": {
        "currentOilBblDay": 45,
        "currentGasMcfDay": 90,
        "cumulativeOilBbl": 180000,
        "lastProductionDate": "2024-09-30",
        "peakOilBblDay": 250,
        "peakDate": "2022-03-15"
      },
      "valuation": {
        "npvUsd": 1850000,
        "marketValueUsd": 2800000,
        "discountPct": 34,
        "confidence": 0.89
      },
      "nftTokenId": null,
      "tags": ["undervalued", "opportunity"]
    }
  ],
  "total": 234,
  "limit": 100,
  "offset": 0,
  "hasMore": true
}
```

**GET /api/wells/:id**
```typescript
Path Params:
  id: string (UUID or wellId)

Response: 200 OK
{
  "well": {
    // ... full well object from above
    "completionDate": "2021-05-12",
    "totalDepthFt": 8500,
    "lateralLengthFt": 5200,
    "formation": "Eagle Ford Shale",
    "declineRate": 0.18,
    "declineType": "hyperbolic",
    "bFactor": 0.5
  },
  "productionHistory": [
    {
      "date": "2024-09",
      "oilBbl": 1350,
      "gasMcf": 2700,
      "waterBbl": 450,
      "daysProduced": 30,
      "oilBblDay": 45,
      "gasMcfDay": 90
    },
    // ... last 24 months
  ],
  "latestValuation": {
    "valuationDate": "2024-10-31T12:00:00Z",
    "npvUsd": 1850000,
    "marketValueUsd": 2800000,
    "discountPct": 34,
    "remainingReservesBbl": 85000,
    "eurBbl": 265000,
    "confidence": 0.89,
    "recommendedBidUsd": 2000000,
    "expectedRoi": 0.40,
    "paybackYears": 3.2,
    "assumptions": {
      "oilPriceUsd": 75.50,
      "operatingCostPerBbl": 18.50,
      "discountRate": 0.10,
      "royaltyRate": 0.25
    }
  },
  "operator": {
    "id": "uuid",
    "name": "Independent Oil Co",
    "operatorNumber": "123456",
    "contactEmail": "info@indyoil.com"
  }
}

Error: 404 Not Found
{
  "error": "Well not found",
  "wellId": "TX-2438"
}
```

**GET /api/wells/:id/valuation**
```typescript
Path Params:
  id: string (UUID or wellId)

Query Params:
  includeHistory?: boolean (default false)

Response: 200 OK
{
  "current": {
    // ... latest valuation object
  },
  "history": [ // if includeHistory=true
    {
      "valuationDate": "2024-09-30T12:00:00Z",
      "npvUsd": 1920000,
      "discountPct": 31
    }
  ]
}
```

**POST /api/wells/:id/valuate**
```typescript
Path Params:
  id: string (UUID or wellId)

Body:
{
  "oilPriceUsd"?: number (override current price)
  "discountRate"?: number (override default 0.10)
}

Response: 202 Accepted (if async) or 200 OK (if sync)
{
  "jobId": "uuid", // if async
  "valuation": {
    // ... newly computed valuation
  }
}

Error: 400 Bad Request
{
  "error": "Invalid parameters",
  "details": [...]
}
```

#### 2. Opportunities Endpoint

**GET /api/opportunities**
```typescript
Query Params:
  minDiscount?: number (default 20)
  minConfidence?: number (default 0.7)
  limit?: number (default 20)

Response: 200 OK
{
  "opportunities": [
    {
      "well": {
        // ... well object
      },
      "valuation": {
        // ... valuation object
      },
      "score": 8.5, // Composite score (discount × confidence)
      "reason": "Undervalued by 34% with high confidence"
    }
  ],
  "total": 15
}
```

#### 3. Price Endpoint

**GET /api/price/wti**
```typescript
Response: 200 OK
{
  "price": 75.50,
  "currency": "USD",
  "unit": "bbl",
  "timestamp": "2024-10-31T14:30:00Z",
  "source": "chainlink" // or "mock"
}
```

#### 4. Blockchain Endpoints (Future-Ready)

**POST /api/blockchain/mint-twin**
```typescript
Body:
{
  "wellId": "TX-2438",
  "ownerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "metadataUri": "ipfs://..."
}

Response: 202 Accepted
{
  "jobId": "uuid",
  "status": "pending",
  "estimatedTime": "30 seconds"
}

// Later: GET /api/blockchain/jobs/:jobId
Response: 200 OK
{
  "status": "completed",
  "nftTokenId": 42,
  "txHash": "0x...",
  "blockNumber": 12345678
}
```

**POST /api/blockchain/mint-pbt**
```typescript
Body:
{
  "wellId": "TX-2438",
  "amount": 1050, // barrels to tokenize
  "productionDate": "2024-10-30"
}

Response: 202 Accepted
{
  "jobId": "uuid",
  "status": "pending"
}
```

**GET /api/blockchain/twins/:wellId**
```typescript
Response: 200 OK
{
  "nft": {
    "tokenId": 42,
    "contractAddress": "0x...",
    "ownerAddress": "0x...",
    "metadataUri": "ipfs://...",
    "mintedAt": "2024-10-01T12:00:00Z"
  },
  "pbt": {
    "contractAddress": "0x...",
    "totalSupply": 180000,
    "priceUsd": 75.50,
    "holders": 23
  }
}

Error: 404 Not Found
{
  "error": "No blockchain twin found for this well"
}
```

### Valuation Service (DCA Implementation)

```typescript
// src/services/valuationService.ts

import { Knex } from 'knex';

interface DCASolver {
  qi: number;    // Initial production rate
  di: number;    // Initial decline rate
  b: number;     // Hyperbolic exponent
  type: 'exponential' | 'hyperbolic' | 'harmonic';
}

interface ValuationInputs {
  wellId: string;
  oilPriceUsd?: number;
  operatingCostPerBbl?: number;
  discountRate?: number;
  royaltyRate?: number;
}

interface ValuationResult {
  npvUsd: number;
  remainingReservesBbl: number;
  eurBbl: number;
  confidence: number;
  recommendedBidUsd: number;
  expectedRoi: number;
  paybackYears: number;
  forecastMonths: number[];
  forecastBbl: number[];
}

export class ValuationService {
  constructor(private db: Knex) {}

  async valuateWell(inputs: ValuationInputs): Promise<ValuationResult> {
    // 1. Get production history
    const productionHistory = await this.getProductionHistory(inputs.wellId);

    // 2. Fit decline curve
    const dcaParams = this.fitDeclineCurve(productionHistory);

    // 3. Forecast future production
    const forecast = this.forecastProduction(dcaParams, 60); // 5 years

    // 4. Get current WTI price
    const oilPrice = inputs.oilPriceUsd || await this.getCurrentWTIPrice();

    // 5. Calculate NPV
    const npv = this.calculateNPV(forecast, {
      oilPrice,
      operatingCost: inputs.operatingCostPerBbl || 18.50,
      discountRate: inputs.discountRate || 0.10,
      royaltyRate: inputs.royaltyRate || 0.25
    });

    // 6. Calculate metrics
    const remainingReserves = forecast.reduce((sum, bbl) => sum + bbl, 0);
    const confidence = this.calculateConfidence(productionHistory, dcaParams);
    const recommendedBid = npv * 1.08; // 8% premium over NPV
    const marketValue = await this.estimateMarketValue(inputs.wellId);
    const expectedRoi = marketValue ? (marketValue - recommendedBid) / recommendedBid : 0;

    return {
      npvUsd: npv,
      remainingReservesBbl: remainingReserves,
      eurBbl: remainingReserves + await this.getCumulativeProduction(inputs.wellId),
      confidence,
      recommendedBidUsd: recommendedBid,
      expectedRoi,
      paybackYears: this.calculatePayback(forecast, oilPrice, inputs.operatingCostPerBbl || 18.50),
      forecastMonths: Array.from({ length: forecast.length }, (_, i) => i),
      forecastBbl: forecast
    };
  }

  private fitDeclineCurve(history: Array<{ date: Date; oilBbl: number }>): DCASolver {
    // Simple exponential decline for MVP
    // In production: use scipy curve_fit equivalent or ML model

    const productions = history.map(h => h.oilBbl);
    const qi = Math.max(...productions); // Peak production

    // Estimate decline rate from production trend
    const recentProduction = productions.slice(-12); // Last year
    const avgRecent = recentProduction.reduce((a, b) => a + b) / recentProduction.length;
    const di = (qi - avgRecent) / qi; // Annual decline rate

    return {
      qi,
      di: Math.max(0.05, Math.min(0.50, di)), // Clamp between 5-50%
      b: 0.5, // Default hyperbolic
      type: 'hyperbolic'
    };
  }

  private forecastProduction(params: DCASolver, months: number): number[] {
    const forecast: number[] = [];

    for (let t = 0; t < months; t++) {
      let q: number;
      const years = t / 12;

      if (params.type === 'exponential' || params.b === 0) {
        // Exponential: q(t) = qi * exp(-di * t)
        q = params.qi * Math.exp(-params.di * years);
      } else if (params.type === 'harmonic' || params.b === 1) {
        // Harmonic: q(t) = qi / (1 + di * t)
        q = params.qi / (1 + params.di * years);
      } else {
        // Hyperbolic: q(t) = qi / (1 + b * di * t)^(1/b)
        q = params.qi / Math.pow(1 + params.b * params.di * years, 1 / params.b);
      }

      // Monthly production = daily rate * 30
      forecast.push(Math.max(0, q * 30));
    }

    return forecast;
  }

  private calculateNPV(
    monthlyProduction: number[],
    params: {
      oilPrice: number;
      operatingCost: number;
      discountRate: number;
      royaltyRate: number;
    }
  ): number {
    const monthlyDiscountRate = Math.pow(1 + params.discountRate, 1 / 12) - 1;
    const taxRate = 0.21; // 21% corporate tax

    let npv = 0;

    for (let month = 0; month < monthlyProduction.length; month++) {
      const production = monthlyProduction[month];

      // Revenue
      const revenue = production * params.oilPrice;

      // Operating costs
      const opex = production * params.operatingCost;

      // Net revenue after royalties
      const netRevenue = (revenue - opex) * (1 - params.royaltyRate);

      // After tax cash flow
      const cashFlow = netRevenue * (1 - taxRate);

      // Discount to present value
      const pv = cashFlow / Math.pow(1 + monthlyDiscountRate, month);

      npv += pv;
    }

    return npv;
  }

  private calculateConfidence(
    history: Array<{ date: Date; oilBbl: number }>,
    dcaParams: DCASolver
  ): number {
    // Confidence based on:
    // 1. Data completeness (more months = higher confidence)
    // 2. Production stability (lower variance = higher confidence)
    // 3. Decline curve fit quality

    const dataQuality = Math.min(1.0, history.length / 24); // 24 months ideal

    const productions = history.map(h => h.oilBbl);
    const mean = productions.reduce((a, b) => a + b) / productions.length;
    const variance = productions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / productions.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    const stability = Math.max(0, 1 - coefficientOfVariation);

    // Simple weighted average
    const confidence = 0.6 * dataQuality + 0.4 * stability;

    return Math.round(confidence * 100) / 100;
  }

  private calculatePayback(
    monthlyProduction: number[],
    oilPrice: number,
    operatingCost: number
  ): number {
    const monthlyNetRevenue = monthlyProduction.map(
      prod => (prod * (oilPrice - operatingCost)) * 0.75 * 0.79 // After royalties and tax
    );

    let cumulative = 0;
    for (let month = 0; month < monthlyNetRevenue.length; month++) {
      cumulative += monthlyNetRevenue[month];

      // When cumulative revenue equals NPV (simplified)
      if (cumulative >= monthlyNetRevenue.reduce((a, b) => a + b) * 0.4) {
        return Math.round((month / 12) * 10) / 10; // Years, 1 decimal
      }
    }

    return 10; // Default if payback is very long
  }

  private async getProductionHistory(wellId: string): Promise<Array<{ date: Date; oilBbl: number }>> {
    const history = await this.db('production_history')
      .select('production_date as date', 'oil_bbl as oilBbl')
      .where({ well_id: wellId })
      .orderBy('production_date', 'desc')
      .limit(36); // Last 3 years

    return history;
  }

  private async getCumulativeProduction(wellId: string): Promise<number> {
    const result = await this.db('wells')
      .select('cumulative_oil_bbl')
      .where({ id: wellId })
      .first();

    return result?.cumulative_oil_bbl || 0;
  }

  private async getCurrentWTIPrice(): Promise<number> {
    // TODO: Integrate Chainlink price feed or use cached value
    return 75.50; // Mock for now
  }

  private async estimateMarketValue(wellId: string): Promise<number | null> {
    // For MVP: use a simple multiple of NPV
    // In production: use comparable sales, industry multiples, etc.
    const valuation = await this.db('valuations')
      .select('npv_usd')
      .where({ well_id: wellId })
      .orderBy('valuation_date', 'desc')
      .first();

    return valuation ? valuation.npv_usd * 1.5 : null; // 1.5x NPV as market value
  }
}
```

---

## 🎨 Frontend Specification

### Tech Stack
```yaml
Framework: React 18.2
Language: TypeScript 5.3
Build Tool: Vite 5.0
Styling: Tailwind CSS 3.4
UI Components: shadcn/ui (Radix UI primitives)
Icons: Lucide React
Map: Mapbox GL JS 3.0 (primary) + Leaflet 1.9 (fallback)
Map React: react-map-gl (Mapbox) or react-leaflet
Charts: Recharts 2.10
Animation: Framer Motion 10.0
Number Animation: react-countup 6.5
State Management: Zustand 4.4 (lightweight)
Data Fetching: TanStack Query 5.0 (React Query)
HTTP Client: Axios 1.6
Forms: React Hook Form 7.48 + Zod
Date Handling: date-fns 2.30
Number Formatting: numeral 2.0.6
```

### Project Structure
```
frontend/
├── public/
│   ├── favicon.ico
│   └── well-marker.svg
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ... (20+ components)
│   │   ├── map/
│   │   │   ├── MapView.tsx            # Main map component
│   │   │   ├── WellMarker.tsx         # Custom marker
│   │   │   ├── MarkerCluster.tsx      # Clustering
│   │   │   └── MapControls.tsx        # Zoom, filters
│   │   ├── wells/
│   │   │   ├── WellDetailModal.tsx    # Main modal
│   │   │   ├── ProductionChart.tsx    # Time series chart
│   │   │   ├── ValuationCard.tsx      # NPV display
│   │   │   ├── BidCalculator.tsx      # Bid generation
│   │   │   └── WellBadge.tsx          # Status badges
│   │   ├── dashboard/
│   │   │   ├── OpportunitiesList.tsx
│   │   │   ├── SummaryStats.tsx
│   │   │   └── TopWells.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Layout.tsx
│   ├── hooks/
│   │   ├── useWells.ts         # React Query hook
│   │   ├── useWellDetail.ts
│   │   ├── useOpportunities.ts
│   │   └── useMapbox.ts
│   ├── lib/
│   │   ├── api.ts              # Axios instance
│   │   ├── utils.ts            # Utility functions
│   │   ├── constants.ts
│   │   └── types.ts
│   ├── store/
│   │   └── appStore.ts         # Zustand store
│   ├── styles/
│   │   └── globals.css         # Tailwind imports
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

### Key Components Specification

#### MapView.tsx
```typescript
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useWells } from '@/hooks/useWells';
import { WellDetailModal } from '@/components/wells/WellDetailModal';

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);

  const { data: wells, isLoading } = useWells({
    limit: 500 // Load all for map
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-99.9, 31.5], // Center of Texas
      zoom: 6
    });

    map.current.on('load', () => {
      addWellsLayer();
    });

    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (wells && map.current) {
      updateWellMarkers(wells);
    }
  }, [wells]);

  function addWellsLayer() {
    // Add GeoJSON source for wells
    map.current?.addSource('wells', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Cluster circles
    map.current?.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'wells',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#10b981', 20,  // Green for small clusters
          '#f59e0b', 50,  // Amber for medium
          '#ef4444'       // Red for large
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, 20,
          30, 50,
          40
        ]
      }
    });

    // Individual well markers
    map.current?.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'wells',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'valuationCategory'],
          'undervalued', '#10b981',  // Green
          'fair', '#f59e0b',         // Amber
          'overvalued', '#ef4444',   // Red
          '#94a3b8'                  // Gray default
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Click handler
    map.current?.on('click', 'unclustered-point', (e) => {
      if (e.features && e.features[0].properties) {
        setSelectedWellId(e.features[0].properties.id);
      }
    });

    // Hover cursor
    map.current?.on('mouseenter', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current?.on('mouseleave', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }

  function updateWellMarkers(wells: Well[]) {
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: wells.map(well => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [well.location.longitude, well.location.latitude]
        },
        properties: {
          id: well.id,
          wellId: well.wellId,
          name: well.wellName,
          valuationCategory: getValuationCategory(well.valuation.discountPct),
          discountPct: well.valuation.discountPct,
          currentProduction: well.production.currentOilBblDay
        }
      }))
    };

    const source = map.current?.getSource('wells') as mapboxgl.GeoJSONSource;
    source?.setData(geojson);
  }

  function getValuationCategory(discountPct: number): string {
    if (discountPct >= 20) return 'undervalued';
    if (discountPct <= -20) return 'overvalued';
    return 'fair';
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />

      {selectedWellId && (
        <WellDetailModal
          wellId={selectedWellId}
          onClose={() => setSelectedWellId(null)}
        />
      )}
    </div>
  );
}
```

#### ProductionChart.tsx
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ProductionChartProps {
  history: Array<{
    date: string;
    oilBbl: number;
    oilBblDay: number;
  }>;
}

export function ProductionChart({ history }: ProductionChartProps) {
  const data = history
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: format(new Date(item.date), 'MMM yyyy'),
      production: item.oilBblDay
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8' }}
        />
        <YAxis
          stroke="#94a3b8"
          tick={{ fill: '#94a3b8' }}
          label={{ value: 'bbl/day', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px'
          }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Line
          type="monotone"
          dataKey="production"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 📁 Data Agent Specification

### Responsibilities
1. Download Texas RRC production data
2. Parse and clean CSV files
3. Create operators and wells seed data
4. Generate production history
5. Run DCA valuations
6. Seed PostgreSQL database

### Texas RRC Data Sources
```yaml
Primary Source:
  URL: https://www.rrc.state.tx.us/resource-center/research/data-sets-available-for-download/

Key Datasets:
  1. Oil & Gas Production Data (monthly)
     - Filename: og_production_YYYY.csv
     - Fields: API, Operator, Oil BBL, Gas MCF, Date

  2. Well Directory
     - Filename: wells.csv
     - Fields: API, Well Name, Latitude, Longitude, County, Depth

  3. Operator List
     - Filename: operators.csv
     - Fields: Operator Number, Name, Address

Download Strategy:
  - Focus on 5 major producing counties (Smith, Midland, Webb, Karnes, Reeves)
  - Last 24 months of production data (2023-2024)
  - 200-500 wells total (expanded for better AI demonstrations)
  - Maximum 500 MB total data size
  - Geographic diversity across East Texas, Permian Basin, and Eagle Ford
```

### Data Processing Pipeline

```python
# scripts/process_rrc_data.py

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from scipy.optimize import curve_fit
import json
from pathlib import Path

class RRCDataProcessor:
    def __init__(self, input_dir: Path, output_dir: Path):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)

    def process_all(self):
        print("📥 Loading RRC data...")
        operators = self.load_operators()
        wells = self.load_wells()
        production = self.load_production()

        print("🧹 Cleaning data...")
        wells_clean = self.clean_wells(wells)
        production_clean = self.clean_production(production)

        print("🔗 Joining datasets...")
        wells_with_production = self.join_data(wells_clean, production_clean, operators)

        print("📊 Generating valuations...")
        wells_with_valuations = self.generate_valuations(wells_with_production)

        print("💾 Saving seed data...")
        self.save_seed_data(wells_with_valuations, operators)

        print("✅ Data processing complete!")

    def load_operators(self) -> pd.DataFrame:
        # Load operators CSV
        df = pd.read_csv(self.input_dir / 'operators.csv')
        return df

    def load_wells(self) -> pd.DataFrame:
        # Load wells directory
        df = pd.read_csv(self.input_dir / 'wells.csv')

        # Filter to target counties
        target_counties = ['Smith', 'Midland', 'Webb']
        df = df[df['County'].isin(target_counties)]

        # Filter to active oil wells
        df = df[df['Status'] == 'ACTIVE']
        df = df[df['WellType'] == 'OIL']

        # Sample if too many
        if len(df) > 100:
            df = df.sample(n=100, random_state=42)

        return df

    def load_production(self) -> pd.DataFrame:
        # Load last 24 months of production
        dfs = []
        for year in [2023, 2024]:
            file_path = self.input_dir / f'og_production_{year}.csv'
            if file_path.exists():
                dfs.append(pd.read_csv(file_path))

        df = pd.concat(dfs, ignore_index=True)
        return df

    def clean_wells(self, df: pd.DataFrame) -> pd.DataFrame:
        # Standardize column names
        df = df.rename(columns={
            'API': 'api_number',
            'WellName': 'well_name',
            'Latitude': 'latitude',
            'Longitude': 'longitude',
            'County': 'county',
            'TotalDepth': 'total_depth_ft',
            'LateralLength': 'lateral_length_ft',
            'Formation': 'formation',
            'CompletionDate': 'completion_date'
        })

        # Remove wells without coordinates
        df = df.dropna(subset=['latitude', 'longitude'])

        # Validate coordinates (Texas bounds)
        df = df[(df['latitude'] >= 25.8) & (df['latitude'] <= 36.5)]
        df = df[(df['longitude'] >= -106.6) & (df['longitude'] <= -93.5)]

        return df

    def clean_production(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.rename(columns={
            'API': 'api_number',
            'ProductionDate': 'production_date',
            'OilBBL': 'oil_bbl',
            'GasMCF': 'gas_mcf',
            'WaterBBL': 'water_bbl',
            'DaysProduced': 'days_produced'
        })

        # Convert date
        df['production_date'] = pd.to_datetime(df['production_date'])

        # Remove invalid production
        df = df[df['oil_bbl'] >= 0]
        df = df[df['days_produced'] > 0]

        # Calculate daily rates
        df['oil_bbl_day'] = df['oil_bbl'] / df['days_produced']
        df['gas_mcf_day'] = df['gas_mcf'] / df['days_produced']

        return df

    def join_data(self, wells: pd.DataFrame, production: pd.DataFrame, operators: pd.DataFrame) -> pd.DataFrame:
        # Join wells with production history
        wells_with_prod = wells.merge(
            production.groupby('api_number').agg({
                'oil_bbl': 'sum',
                'oil_bbl_day': 'last',
                'production_date': 'max'
            }).rename(columns={
                'oil_bbl': 'cumulative_oil_bbl',
                'oil_bbl_day': 'current_oil_bbl_day',
                'production_date': 'last_production_date'
            }),
            on='api_number',
            how='left'
        )

        # Add production history as nested data
        wells_with_prod['production_history'] = wells_with_prod['api_number'].apply(
            lambda api: production[production['api_number'] == api]
                .sort_values('production_date', ascending=False)
                .head(24)
                .to_dict('records')
        )

        return wells_with_prod

    def generate_valuations(self, wells: pd.DataFrame) -> pd.DataFrame:
        valuations = []

        for idx, well in wells.iterrows():
            history = pd.DataFrame(well['production_history'])

            if len(history) < 6:
                continue  # Skip wells with insufficient data

            # Fit decline curve
            dca_params = self.fit_decline_curve(history)

            # Forecast production
            forecast = self.forecast_production(dca_params, months=60)

            # Calculate NPV
            npv = self.calculate_npv(forecast, oil_price=75.50)

            # Estimate market value (1.5x NPV for demo)
            market_value = npv * 1.5

            # Calculate discount
            discount_pct = ((market_value - npv) / market_value) * 100

            # Confidence score
            confidence = min(1.0, len(history) / 24) * 0.9  # Penalize sparse data

            valuations.append({
                'api_number': well['api_number'],
                'npv_usd': round(npv, 2),
                'market_value_usd': round(market_value, 2),
                'discount_pct': round(discount_pct, 2),
                'remaining_reserves_bbl': round(sum(forecast), 2),
                'confidence': round(confidence, 2),
                'recommended_bid_usd': round(npv * 1.08, 2),
                'expected_roi': round((market_value - npv * 1.08) / (npv * 1.08), 2),
                'dca_params': dca_params
            })

        valuation_df = pd.DataFrame(valuations)
        wells = wells.merge(valuation_df, on='api_number', how='left')

        return wells

    def fit_decline_curve(self, history: pd.DataFrame) -> dict:
        """Simple exponential decline for MVP"""
        history = history.sort_values('production_date')

        # Get production rates
        rates = history['oil_bbl_day'].values
        qi = np.max(rates)

        # Estimate decline rate
        if len(rates) > 12:
            recent_avg = np.mean(rates[-12:])
            di = (qi - recent_avg) / qi
        else:
            di = 0.15  # Default 15% decline

        di = np.clip(di, 0.05, 0.50)  # Clamp between 5-50%

        return {
            'qi': float(qi),
            'di': float(di),
            'b': 0.5,
            'type': 'hyperbolic'
        }

    def forecast_production(self, params: dict, months: int) -> list:
        """Forecast using hyperbolic decline"""
        forecast = []
        qi = params['qi']
        di = params['di']
        b = params['b']

        for t in range(months):
            years = t / 12

            if b == 0:
                # Exponential
                q = qi * np.exp(-di * years)
            elif b == 1:
                # Harmonic
                q = qi / (1 + di * years)
            else:
                # Hyperbolic
                q = qi / ((1 + b * di * years) ** (1 / b))

            # Monthly production = daily rate * 30
            forecast.append(max(0, q * 30))

        return forecast

    def calculate_npv(self, monthly_production: list, oil_price: float) -> float:
        """Calculate NPV with simple assumptions"""
        discount_rate = 0.10  # 10% annual
        monthly_discount = (1 + discount_rate) ** (1/12) - 1
        operating_cost = 18.50  # $/bbl
        royalty_rate = 0.25
        tax_rate = 0.21

        npv = 0

        for month, production in enumerate(monthly_production):
            revenue = production * oil_price
            opex = production * operating_cost
            net_revenue = (revenue - opex) * (1 - royalty_rate)
            cash_flow = net_revenue * (1 - tax_rate)
            pv = cash_flow / ((1 + monthly_discount) ** month)
            npv += pv

        return npv

    def save_seed_data(self, wells: pd.DataFrame, operators: pd.DataFrame):
        """Save as JSON for easy seeding"""

        # Operators seed
        operators_seed = operators.to_dict('records')
        with open(self.output_dir / 'operators.json', 'w') as f:
            json.dump(operators_seed, f, indent=2, default=str)

        # Wells seed (with production history and valuations)
        wells_seed = []
        for idx, well in wells.iterrows():
            wells_seed.append({
                'wellId': f"TX-{well['api_number'][-4:]}",
                'apiNumber': well['api_number'],
                'wellName': well['well_name'],
                'operator': well.get('operator_name', 'Independent Oil Co'),
                'location': {
                    'latitude': float(well['latitude']),
                    'longitude': float(well['longitude']),
                    'county': well['county'],
                    'state': 'TX'
                },
                'status': 'active',
                'attributes': {
                    'completionDate': str(well.get('completion_date', '')),
                    'totalDepthFt': int(well.get('total_depth_ft', 0)) if pd.notna(well.get('total_depth_ft')) else None,
                    'lateralLengthFt': int(well.get('lateral_length_ft', 0)) if pd.notna(well.get('lateral_length_ft')) else None,
                    'formation': well.get('formation', '')
                },
                'production': {
                    'currentOilBblDay': float(well.get('current_oil_bbl_day', 0)),
                    'cumulativeOilBbl': float(well.get('cumulative_oil_bbl', 0)),
                    'lastProductionDate': str(well.get('last_production_date', ''))
                },
                'valuation': {
                    'npvUsd': float(well.get('npv_usd', 0)),
                    'marketValueUsd': float(well.get('market_value_usd', 0)),
                    'discountPct': float(well.get('discount_pct', 0)),
                    'remainingReservesBbl': float(well.get('remaining_reserves_bbl', 0)),
                    'confidence': float(well.get('confidence', 0)),
                    'recommendedBidUsd': float(well.get('recommended_bid_usd', 0)),
                    'expectedRoi': float(well.get('expected_roi', 0))
                },
                'productionHistory': well['production_history'][:24],  # Last 24 months
                'dcaParams': well.get('dca_params', {})
            })

        with open(self.output_dir / 'wells.json', 'w') as f:
            json.dump(wells_seed, f, indent=2, default=str)

        print(f"📊 Saved {len(wells_seed)} wells to {self.output_dir / 'wells.json'}")
        print(f"👥 Saved {len(operators_seed)} operators to {self.output_dir / 'operators.json'}")

if __name__ == '__main__':
    processor = RRCDataProcessor(
        input_dir=Path('data/raw'),
        output_dir=Path('data/processed')
    )
    processor.process_all()
```

---

## ⚡ Agent Task Distribution (3-Hour Timeline)

### Agent 1: Backend Developer
**Timeline:** 0:00 - 3:00 (90 effective hours)
**Priority:** HIGH

**Phase 1 (0:00-0:30, 15 eff hrs):** Setup
- ✅ Initialize Node.js project
- ✅ Install dependencies (Express, Knex, Zod, etc.)
- ✅ Configure TypeScript
- ✅ Set up Knex + PostgreSQL connection
- ✅ Create migration files
- ✅ Run migrations

**Phase 2 (0:30-1:30, 30 eff hrs):** Core API
- ✅ Implement WellService
- ✅ Implement ValuationService (DCA)
- ✅ Create routes: /api/wells, /api/wells/:id
- ✅ Create routes: /api/wells/:id/valuation
- ✅ Create route: /api/opportunities
- ✅ Add CORS, error handling
- ✅ Test all endpoints

**Phase 3 (1:30-2:30, 30 eff hrs):** Advanced Features
- ✅ Implement price service (mock WTI)
- ✅ Add blockchain-ready endpoints (stubs)
- ✅ Optimize queries (indexes)
- ✅ Add request validation (Zod)
- ✅ Add logging

**Phase 4 (2:30-3:00, 15 eff hrs):** Polish & Deploy
- ✅ Write seed scripts
- ✅ Test end-to-end
- ✅ Deploy to Railway/Render
- ✅ Create .env.example
- ✅ Document API

### Agent 2: Frontend Developer
**Timeline:** 0:00 - 3:00 (90 effective hours)
**Priority:** CRITICAL (this is what wins)

**Phase 1 (0:00-0:30, 15 eff hrs):** Setup
- ✅ Create Vite + React + TS project
- ✅ Install dependencies (Tailwind, shadcn, Mapbox, etc.)
- ✅ Set up Tailwind config
- ✅ Install shadcn/ui components
- ✅ Create basic layout

**Phase 2 (0:30-1:30, 30 eff hrs):** Map Interface
- ✅ Implement MapView component
- ✅ Integrate Mapbox GL JS
- ✅ Add well markers with clustering
- ✅ Color-code by valuation
- ✅ Add click handlers
- ✅ Add hover tooltips
- ✅ Implement filters panel

**Phase 3 (1:30-2:30, 30 eff hrs):** Well Detail
- ✅ Create WellDetailModal
- ✅ Implement ProductionChart (Recharts)
- ✅ Create ValuationCard
- ✅ Build BidCalculator
- ✅ Add animations (Framer Motion)
- ✅ Responsive design

**Phase 4 (2:30-3:00, 15 eff hrs):** Polish
- ✅ Add loading states
- ✅ Error handling UI
- ✅ Optimize performance
- ✅ Test on mobile
- ✅ Deploy to Vercel
- ✅ Create demo flow

### Agent 3: Data Engineer
**Timeline:** 0:00 - 2:00 (60 effective hours)
**Priority:** BLOCKING (others need this data)

**Phase 1 (0:00-0:30, 15 eff hrs):** Data Acquisition
- ✅ Download Texas RRC datasets
  - Production data (2023-2024)
  - Wells directory
  - Operators list
- ✅ Create data/ directory structure
- ✅ Verify data quality

**Phase 2 (0:30-1:00, 15 eff hrs):** Data Processing
- ✅ Write Python processing script
- ✅ Clean and filter wells (50-100)
- ✅ Join production history
- ✅ Generate DCA parameters
- ✅ Calculate valuations
- ✅ Create JSON seed files

**Phase 3 (1:00-1:30, 15 eff hrs):** Database Seeding
- ✅ Write Knex seed scripts
- ✅ Seed operators
- ✅ Seed wells
- ✅ Seed production history
- ✅ Seed valuations
- ✅ Verify data integrity

**Phase 4 (1:30-2:00, 15 eff hrs):** Validation & Handoff
- ✅ Verify API returns correct data
- ✅ Check map displays wells correctly
- ✅ Create sample queries for testing
- ✅ Document data sources
- ✅ **DONE - joins other agents for polish**

**After 2:00:** Data agent assists with:
- Testing
- Documentation
- Deployment verification
- Demo data curation

---

## 📦 Deployment Strategy

### Frontend Deployment (Vercel)
```bash
# From frontend/
npm run build
vercel --prod

# Auto-deploy on git push (configure in Vercel dashboard)
```

**Environment Variables (Vercel):**
```
VITE_API_URL=https://oilfield-api.railway.app
VITE_MAPBOX_TOKEN=<your_token>
```

### Backend Deployment (Railway)
```bash
# From backend/
# Create railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}

# Deploy
railway up
```

**Environment Variables (Railway):**
```
DATABASE_URL=<railway_postgres_url>
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://oilfield.vercel.app
```

### Database (Railway PostgreSQL)
- Provisioned automatically with Railway
- Connection string injected as DATABASE_URL
- Run migrations: `npm run migrate:prod`
- Run seeds: `npm run seed:prod`

---

## ✅ Pre-Flight Checklist (T-minus 1 hour)

### Environment Verification
- [ ] PostgreSQL running in Docker (`docker ps | grep postgres`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Python 3.10+ installed (for data processing) (`python --version`)
- [ ] Git configured
- [ ] VS Code with extensions ready

### Accounts & Tokens
- [ ] Mapbox account + API token obtained
- [ ] Vercel account ready
- [ ] Railway account ready
- [ ] GitHub repository accessible

### Data Sources
- [ ] Texas RRC website accessible
- [ ] Sample CSV files identified
- [ ] Download URLs confirmed

### Agent Briefings
- [ ] Agent 1 (Backend) briefing document ready
- [ ] Agent 2 (Frontend) briefing document ready
- [ ] Agent 3 (Data) briefing document ready

---

## 🎯 Success Criteria

### Must Have (3 hours)
- [x] Map displays 50+ Texas wells
- [x] Wells color-coded by valuation
- [x] Click well → modal opens
- [x] Production chart displays
- [x] Valuation shows (NPV, discount, ROI)
- [x] Bid calculator works
- [x] Backend API functional
- [x] Database seeded with real data
- [x] Deployed to production URLs

### Should Have (if time permits)
- [ ] Smooth animations
- [ ] Filter panel functional
- [ ] Dashboard view
- [ ] Mobile responsive
- [ ] Loading states
- [ ] Error handling

### Nice to Have (stretch goals)
- [ ] Leaflet fallback implemented
- [ ] Blockchain endpoint stubs working
- [ ] Demo mode toggle
- [ ] Dark/light mode
- [ ] Performance optimizations

---

## 🚨 Contingency Plans

### If Mapbox Fails
**Fallback:** Leaflet + OpenStreetMap
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

<MapContainer center={[31.5, -99.9]} zoom={6}>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />
  {wells.map(well => (
    <Marker position={[well.lat, well.lng]} key={well.id}>
      <Popup>{well.name}</Popup>
    </Marker>
  ))}
</MapContainer>
```

### If Texas RRC Data Unavailable
**Fallback:** Generate synthetic data
```python
import random
from faker import Faker

fake = Faker()

def generate_synthetic_wells(count=50):
    wells = []
    for i in range(count):
        wells.append({
            'wellId': f'TX-{1000+i}',
            'apiNumber': f'42-{random.randint(100,500)}-{random.randint(10000,99999)}',
            'wellName': f'{fake.city()} Well {i+1}',
            'latitude': random.uniform(29.0, 34.0),
            'longitude': random.uniform(-104.0, -96.0),
            'currentOilBblDay': random.randint(20, 200),
            'npvUsd': random.randint(500000, 5000000),
            'discountPct': random.randint(-30, 50)
        })
    return wells
```

### If PostgreSQL Issues
**Fallback:** SQLite in-memory
```typescript
// Change DATABASE_URL
DATABASE_URL=sqlite::memory:

// Or file-based
DATABASE_URL=sqlite:./oilfield.db
```

### If Time Running Out
**Priority order:**
1. Map with markers (must have)
2. Well detail modal (must have)
3. Production chart (must have)
4. Valuation display (must have)
5. Everything else (nice to have)

**Emergency scope cut:**
- Remove: Dashboard, filters, animations
- Keep: Map + modal + basic chart

---

## 📞 Communication Protocol

### Agent Handoff Points
**Hour 1:**
- Data Agent → Backend Agent: JSON seed files ready
- Backend Agent → Frontend Agent: API specs finalized

**Hour 2:**
- Backend Agent: API deployed, share production URL
- Frontend Agent: Can start integration testing
- Data Agent: Assists with testing & validation

**Hour 3:**
- All agents: Focus on polish
- Final testing
- Demo preparation

### Status Updates
Every 30 minutes, each agent reports:
- ✅ Completed tasks
- 🔄 In-progress tasks
- 🚧 Blockers
- 📝 Next 30-min plan

---

## 🎬 Demo Preparation (Last 30 Minutes)

### Demo Flow
1. **Open:** Map view with all wells
2. **Filter:** Show only undervalued (green) wells
3. **Click:** Well with highest discount %
4. **Show:** Production chart, valuation, bid calculator
5. **Calculate:** Generate bid
6. **Close:** Quick tour of 2-3 more wells
7. **Pitch:** Value proposition

### Backup Plan
- Screen recording of full demo
- Screenshots of key screens
- PDF deck with architecture

---

**Ready to execute in T-minus 1 hour! 🚀**

---

**Document Version:** 1.0 Technical
**Status:** Ready to Execute
**Total Capacity:** 270 effective work hours
**Confidence:** VERY HIGH ✅
