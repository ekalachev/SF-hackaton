# OilField Hackathon Project - Requirements & Technical Analysis

**Version:** 1.0 Enriched
**Date:** 2025-10-31
**Status:** Requirements Phase
**Sponsor:** Pytheas Energy

---

## Executive Summary

### Project Convergence Analysis
After analyzing both raw requirements sources, we have **two complementary concepts** that can be merged into a powerful unified solution:

1. **OilTwin Protocol** - Digital twin infrastructure with oracle network and tokenization
2. **MatureWell Valuation Engine** - AI-powered acquisition tool for underperforming wells

**Recommended Approach:** Build **MatureWell as the flagship application of the OilTwin Protocol infrastructure**, creating a complete ecosystem for well acquisition, tokenization, and transparent operation.

---

## 1. Unified Problem Statement

### Current Industry Pain Points
1. **Opacity in Production Reporting** - No verifiable single source of truth for well performance
2. **Limited Liquidity** - Small operators struggle to monetize assets or access working capital
3. **Fragmented ESG Verification** - No standardized, transparent emission tracking
4. **Inefficient Well Valuation** - Manual processes for identifying underperforming assets
5. **High Barriers to Investment** - Retail investors excluded from oil field opportunities
6. **Information Asymmetry** - Large players have access to data that small operators don't

### Proposed Solution Architecture
**A three-layer system:**

```
┌─────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER: MatureWell Valuation Engine             │
│  - AI-powered well analysis & acquisition recommendations   │
│  - Interactive map with opportunity visualization           │
│  - Automated bid generation & NPV calculations              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER: OilTwin Protocol                     │
│  - Digital Twin Registry (ERC-721 NFTs)                     │
│  - Production-Backed Tokens (PBTs)                          │
│  - Multi-source Oracle Network                              │
│  - Valuation & Risk Models                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  DATA LAYER: Public & Private Data Sources                  │
│  - EIA, BOEM, Texas Railroad Commission                     │
│  - Chainlink Price Feeds, NASA FIRMS                        │
│  - Pytheas Energy Registry                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Architecture Deep Dive

### 2.1 Digital Twin Registry (Smart Contract Layer)

**Purpose:** Each physical well becomes an immutable, verifiable digital twin

**Smart Contract: `TwinRegistry.sol`**
```solidity
// Core Entities (Design Pattern: Entity-Component System)
- WellTwin (ERC-721 NFT)
  - wellId: string (e.g., "TX-2438")
  - operator: address
  - location: Coordinates
  - metadata: IPFS hash
  - status: enum (Active, Depleted, Plugged)
  - esgScore: uint256
  - createdAt: timestamp
```

**Technical Considerations:**
- Use **ERC-721** for uniqueness, not ERC-1155 (each well is unique)
- Store large metadata (production history) on **IPFS** to save gas
- Implement **access control** (OpenZeppelin AccessControl) for operator permissions
- Consider **EIP-2535 Diamond Pattern** for upgradeability if complex features needed

**Challenges & Solutions:**
| Challenge | Risk | Solution |
|-----------|------|----------|
| Gas costs for frequent updates | High | Batch oracle updates; use events for history |
| Metadata mutability | Medium | IPFS + on-chain hash; emit MetadataUpdated events |
| Operator verification | High | KYC oracle integration; multi-sig for critical ops |

---

### 2.2 Oracle Network Architecture

**Design Pattern:** Multi-Oracle Consensus with Fallback Mechanisms

**Oracle Hub Structure:**
```
OracleHub (Coordinator Contract)
├── ProductionOracle (Daily)
│   ├── Primary: EIA API via Chainlink External Adapter
│   └── Fallback: Texas RRC direct scraper
├── PriceOracle (Real-time)
│   ├── Primary: Chainlink WTI Feed
│   └── Fallback: Pytheas Energy price index
├── ESGOracle (Daily)
│   ├── NASA FIRMS satellite data
│   └── EPA methane monitoring
├── ReserveOracle (Weekly)
│   └── AI model predictions (custom adapter)
└── KYCOracle (Static)
    └── DID verification service
```

**Technical Implementation:**
- **Chainlink Functions** for custom API calls (no need for separate node)
- **Push vs Pull:** Price feeds (pull), Production data (push via scheduled jobs)
- **Consensus:** Require 2/3 oracle agreement for production updates
- **Data Attestation:** Each oracle signs data with private key

**Challenges & Solutions:**
| Challenge | Risk | Solution |
|-----------|------|----------|
| API rate limits | Medium | Cache frequent queries; use WebSocket where possible |
| Data latency | Medium | Set acceptable windows (1hr for production, 1min for price) |
| Oracle manipulation | High | Multi-source consensus; stake/slash mechanism for oracles |
| Downtime handling | Medium | Grace periods; use last known good value with timestamp |

---

### 2.3 AI Valuation Engine

**Purpose:** Predict remaining reserves and fair market value of underperforming wells

**Model Architecture:**
```
Input Features:
- Historical production time series (24-36 months)
- Well depth, formation type, completion date
- Nearby well performance (spatial correlation)
- Current oil prices & forecasts
- Operating expenses & royalty rates

Model: Hybrid Approach
├── Decline Curve Analysis (DCA)
│   └── Arps Hyperbolic/Exponential models
├── ML Ensemble
│   ├── XGBoost for feature importance
│   ├── LSTM for time series prediction
│   └── Random Forest for uncertainty quantification
└── NPV Calculator
    └── Discounted cash flow with risk-adjusted rates
```

**Technical Stack:**
- **Python**: scikit-learn, XGBoost, TensorFlow/PyTorch (LSTM)
- **Deployment**: FastAPI service or AWS Lambda
- **On-chain Bridge**: Chainlink External Adapter or Functions

**Challenges & Solutions:**
| Challenge | Risk | Solution |
|-----------|------|----------|
| Data quality (missing/noisy) | High | Imputation strategies; outlier detection; confidence scores |
| Model explainability | Medium | SHAP values for feature importance; publish methodology |
| Overfitting to specific basins | Medium | Train on diverse geographic regions; regularization |
| Real-time inference cost | Low | Pre-compute weekly; cache results; only recompute on request |

---

### 2.4 Production-Backed Tokens (PBT)

**Design Pattern:** Asset-Backed Security Token with Dynamic Supply

**Token Mechanics:**
```solidity
contract ProductionBackedToken is ERC20 {
  // 1 PBT = 1 barrel of verified production

  Minting:
  - Triggered by ProductionOracle confirmed data
  - Minted to well owner's address
  - Max supply = proven reserves estimate

  Burning:
  - On physical delivery or sale
  - When well is plugged/abandoned

  Transfers:
  - Restricted to KYC-verified addresses (ERC1404)
  - Subject to transfer fees (0.1% to oracle pool)
}
```

**Technical Considerations:**
- Use **ERC-1404** (Security Token) for regulatory compliance
- Implement **transfer restrictions** with whitelist
- Consider **ERC-2981** for royalty fees to operators
- **Liquidity:** AMM pool on Uniswap V3 with narrow ranges

**Challenges & Solutions:**
| Challenge | Risk | Solution |
|-----------|------|----------|
| Regulatory compliance | VERY HIGH | Legal review; restrict to accredited investors initially |
| Token-barrel mismatch | Medium | Periodic audits; oracle-verified burn events |
| Liquidity fragmentation | Medium | Pool multiple wells' PBTs into index tokens |
| Price discovery | Medium | Peg to spot oil price with discount based on well quality |

---

## 3. Data Sources & Integration Strategy

### 3.1 Primary Data Sources

**1. Texas Railroad Commission (Priority: HIGH)**
- **API:** https://www.rrc.texas.gov/resource-center/research/data-sets-available-for-download/
- **Data:** Well production (monthly), permits, completion data
- **Format:** CSV downloads, no real-time API
- **Integration:** Scheduled ETL job (daily), store in PostgreSQL
- **Challenge:** No official REST API - requires web scraping or file parsing

**2. EIA Open Data API (Priority: HIGH)**
- **API:** https://www.eia.gov/opendata/
- **Data:** Field-level production, state aggregates, crude prices
- **Format:** REST API, JSON responses
- **Rate Limit:** 5000 calls/hour (register for API key)
- **Integration:** Direct Chainlink External Adapter

**3. BOEM Offshore Wells (Priority: MEDIUM)**
- **API:** https://www.data.boem.gov/
- **Data:** Gulf of Mexico production, lease info
- **Format:** ArcGIS REST API, GeoJSON
- **Integration:** Spatial queries for offshore wells

**4. Chainlink Price Feeds (Priority: CRITICAL)**
- **Feed:** WTI Crude Oil / USD (existing feed on mainnet)
- **Network:** Ethereum mainnet or Arbitrum/Optimism for lower gas
- **Update Frequency:** Every price deviation >0.5%
- **Integration:** Direct contract call

**5. NASA FIRMS (Priority: MEDIUM - ESG feature)**
- **API:** https://firms.modaps.eosdis.nasa.gov/api/
- **Data:** Active fire detection (flaring events)
- **Format:** REST API, CSV/JSON/Shapefile
- **Integration:** Daily batch job, flag wells with flaring events

### 3.2 Data Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  INGESTION LAYER                                            │
│  - Scheduled jobs (cron/Airflow)                            │
│  - Real-time WebSocket listeners (price feeds)              │
│  - Web scrapers (RRC, if needed)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PROCESSING LAYER                                           │
│  - Data validation & cleaning (Pandas/Spark)                │
│  - Feature engineering for ML models                        │
│  - Time-series aggregation                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STORAGE LAYER                                              │
│  - PostgreSQL (structured well data)                        │
│  - TimescaleDB extension (production time series)           │
│  - Redis (cache for frequent queries)                       │
│  - IPFS (immutable metadata snapshots)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ORACLE LAYER                                               │
│  - Chainlink node or Functions                              │
│  - Sign & submit data to smart contracts                    │
└─────────────────────────────────────────────────────────────┘
```

**Technical Stack:**
- **ETL:** Python (pandas, requests, BeautifulSoup for scraping)
- **Orchestration:** Apache Airflow or simple cron jobs (hackathon: cron)
- **Database:** PostgreSQL 14+ with TimescaleDB extension
- **Cache:** Redis for API response caching
- **Queue:** RabbitMQ for async oracle updates (optional)

---

## 4. Frontend Dashboard Requirements

### 4.1 Core Screens

**Screen 1: Map View (Primary Interface)**
```
Interactive Map (Leaflet or Mapbox GL)
├── Well Markers (color-coded by valuation score)
│   ├── Green: Undervalued (>20% discount)
│   ├── Yellow: Fair value (±20%)
│   └── Red: Overvalued (>20% premium)
├── Heatmap Layer (production density)
├── Filters
│   ├── Production range (bbl/day)
│   ├── ESG score threshold
│   ├── Valuation score
│   └── Basin/County
└── Click Handler → Well Detail Modal
```

**Screen 2: Well Detail View**
```
Well Twin Dashboard
├── Identity Section
│   ├── Well ID, Operator, Location
│   ├── Digital Twin NFT (image + OpenSea link)
│   └── Status badge
├── Production Metrics
│   ├── Current rate (bbl/day)
│   ├── Cumulative production chart
│   ├── Decline curve projection
│   └── Remaining reserves estimate
├── Financial Analysis
│   ├── AI Valuation (NPV)
│   ├── Current market price (if tokenized)
│   ├── ROI projection chart
│   └── Acquisition bid calculator
├── ESG Scorecard
│   ├── Carbon intensity
│   ├── Methane emissions
│   ├── Flaring events (map overlay)
│   └── ESG badge NFT
└── Oracle Status
    ├── Last update timestamps
    ├── Data source indicators
    └── Consensus agreement %
```

**Screen 3: Portfolio View (for logged-in operators)**
```
My Wells Dashboard
├── Aggregate Metrics
│   ├── Total production (bbl/day)
│   ├── Portfolio NAV
│   ├── Average ESG score
│   └── PBT token supply
├── Well List (sortable table)
└── Actions
    ├── Mint PBT tokens
    ├── Request valuation update
    └── Transfer ownership
```

**Screen 4: Token Trading (DeFi Integration)**
```
PBT Marketplace
├── Active PBT pools (by well)
├── Price charts (token/USD)
├── Liquidity depth
└── Buy/Sell interface (Uniswap widget)
```

### 4.2 Technical Stack (Frontend)

**Recommended Stack:**
```
Framework: React 18 + TypeScript
├── UI Library: shadcn/ui or Material-UI
├── State: Zustand or Jotai (lighter than Redux)
├── Forms: React Hook Form + Zod validation
├── Charts: Recharts or Visx
├── Maps: Mapbox GL JS or Leaflet + React-Leaflet
├── Web3: wagmi + viem (modern alternative to ethers.js)
├── Styling: Tailwind CSS
└── Build: Vite (faster than CRA)
```

**Key Libraries:**
- `@rainbow-me/rainbowkit` - Wallet connection UI
- `@tanstack/react-query` - Data fetching & caching
- `framer-motion` - Animations
- `date-fns` - Date formatting
- `numeral` - Number formatting

**Challenges & Solutions:**
| Challenge | Risk | Solution |
|-----------|------|----------|
| Map performance (1000+ wells) | Medium | Clustering (supercluster), virtualization, WebGL layers |
| Web3 UX complexity | High | Abstract blockchain details; show USD values; explain gas |
| Real-time updates | Medium | WebSocket for prices; polling for production (low freq) |
| Mobile responsiveness | Low | Tailwind breakpoints; separate mobile map view |

---

## 5. Backend Architecture

### 5.1 Service Design

**Microservices vs Monolith:** Start with **modular monolith** (easier for hackathon), design for future service extraction

```
API Gateway (Express/FastAPI)
├── /api/wells
│   ├── GET /wells (list with filters)
│   ├── GET /wells/:id (detail)
│   ├── POST /wells/:id/valuate (trigger AI)
│   └── GET /wells/:id/twin (NFT metadata)
├── /api/oracles
│   ├── GET /oracles/status
│   └── POST /oracles/update (webhook from Chainlink)
├── /api/tokens
│   ├── GET /tokens/pbt/:wellId
│   └── POST /tokens/mint (operator only)
├── /api/portfolio (authenticated)
│   └── GET /portfolio/:address
└── /api/valuations
    ├── GET /valuations/:wellId
    └── GET /valuations/opportunities (undervalued wells)
```

**Technical Stack:**
```
Language: TypeScript (Node.js) or Python
├── Framework: Express.js (TS) or FastAPI (Python)
├── ORM: Prisma (TS) or SQLAlchemy (Python)
├── Validation: Zod (TS) or Pydantic (Python)
├── Auth: JWT + Web3 signature verification
├── Jobs: Bull (TS) or Celery (Python)
└── Testing: Jest/Vitest (TS) or pytest (Python)
```

**Recommendation for Hackathon:**
- **TypeScript + Express + Prisma** - Full-stack type safety, shared types with frontend
- **Python + FastAPI** - Better for ML integration, but requires type duplication

### 5.2 Database Schema

**PostgreSQL Schema (simplified):**
```sql
-- Wells table
CREATE TABLE wells (
  id UUID PRIMARY KEY,
  well_id VARCHAR(50) UNIQUE NOT NULL, -- "TX-2438"
  operator_address VARCHAR(42), -- Ethereum address
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20),
  formation VARCHAR(100),
  completion_date DATE,
  twin_nft_token_id BIGINT,
  esg_score DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production data (time series)
CREATE TABLE production (
  id UUID PRIMARY KEY,
  well_id UUID REFERENCES wells(id),
  date DATE NOT NULL,
  oil_bbl DECIMAL(12, 2),
  gas_mcf DECIMAL(12, 2),
  water_bbl DECIMAL(12, 2),
  days_produced INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(well_id, date)
);

-- Convert to hypertable (TimescaleDB)
SELECT create_hypertable('production', 'date');

-- Valuations (AI model outputs)
CREATE TABLE valuations (
  id UUID PRIMARY KEY,
  well_id UUID REFERENCES wells(id),
  valuation_date TIMESTAMPTZ NOT NULL,
  npv_usd DECIMAL(15, 2),
  remaining_reserves_bbl DECIMAL(15, 2),
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  model_version VARCHAR(20),
  features JSONB, -- Store input features
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oracle updates (audit trail)
CREATE TABLE oracle_updates (
  id UUID PRIMARY KEY,
  oracle_type VARCHAR(50), -- "production", "price", "esg"
  well_id UUID REFERENCES wells(id) NULL,
  data JSONB,
  signature VARCHAR(132), -- Oracle's signed hash
  block_number BIGINT,
  tx_hash VARCHAR(66),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PBT tokens
CREATE TABLE pbt_tokens (
  id UUID PRIMARY KEY,
  well_id UUID REFERENCES wells(id),
  token_address VARCHAR(42),
  total_supply DECIMAL(18, 8),
  price_usd DECIMAL(10, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_wells_location ON wells USING GIST (
  ll_to_earth(latitude, longitude)
); -- For spatial queries

CREATE INDEX idx_production_well_date ON production (well_id, date DESC);
CREATE INDEX idx_valuations_well_date ON valuations (well_id, valuation_date DESC);
CREATE INDEX idx_oracle_type_time ON oracle_updates (oracle_type, created_at DESC);
```

---

## 6. Smart Contract Architecture

### 6.1 Contract Design

**Contracts Overview:**
```
TwinRegistry.sol (ERC-721)
├── Manages well digital twins
├── Access control for operators
└── Metadata URI (IPFS)

ProductionBackedToken.sol (ERC-20/ERC-1404)
├── Minting logic (oracle-triggered)
├── Transfer restrictions (KYC)
└── Burn mechanism

OracleHub.sol
├── Aggregates oracle data
├── Consensus mechanism
└── Emit events for off-chain listeners

ValuationOracle.sol (Chainlink consumer)
├── Request AI valuations
├── Receive Chainlink callback
└── Store on-chain attestations

WellMarketplace.sol
├── Buy/sell well twins (NFTs)
├── Automated bidding logic
└── Escrow for transactions
```

### 6.2 Deployment Strategy

**Blockchain Selection:**
| Network | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| Ethereum Mainnet | Most secure, Chainlink support | High gas costs | Production only |
| Polygon | Low fees, EVM-compatible | Less decentralized | **RECOMMENDED (Hackathon)** |
| Arbitrum | Lower fees than mainnet, secure | Newer ecosystem | Good alternative |
| Avalanche | Fast finality | Less tooling | If sponsor requires |
| Testnet (Sepolia) | Free, easy testing | Not real demo | **Use for development** |

**Hackathon Recommendation:**
- Deploy to **Polygon Mumbai testnet** (free faucet)
- Use **Chainlink on Polygon** (supported)
- Prepare **Sepolia** backup if Mumbai issues

### 6.3 Smart Contract Security Considerations

**Critical Vulnerabilities to Address:**
1. **Reentrancy:** Use OpenZeppelin's `ReentrancyGuard`
2. **Oracle Manipulation:** Multi-source consensus, time-weighted averages
3. **Access Control:** Use `AccessControl` or `Ownable`, not custom logic
4. **Integer Overflow:** Use Solidity 0.8+ (built-in checks)
5. **Front-running:** Use commit-reveal for sensitive operations

**Recommended Tools:**
- **Hardhat** for development (better DX than Truffle)
- **OpenZeppelin Contracts** for standard implementations
- **Slither** for static analysis (run before deploy)
- **Hardhat Gas Reporter** to optimize gas usage

---

## 7. AI/ML Model Details

### 7.1 Decline Curve Analysis (DCA)

**Mathematical Models:**
```python
# Arps Hyperbolic Decline
q(t) = q_i / (1 + b * D_i * t)^(1/b)

Where:
- q(t) = production rate at time t
- q_i = initial production rate
- D_i = initial decline rate
- b = hyperbolic exponent (0 = exponential, 1 = harmonic)
```

**Implementation:**
```python
from scipy.optimize import curve_fit
import numpy as np

def hyperbolic_decline(t, q_i, D_i, b):
    return q_i / (1 + b * D_i * t) ** (1 / b)

# Fit to historical data
params, _ = curve_fit(
    hyperbolic_decline,
    time_days,
    production_bbl,
    p0=[1000, 0.01, 0.5]  # Initial guesses
)

# Forecast future production
future_time = np.arange(365, 365*5)  # Next 5 years
forecast = hyperbolic_decline(future_time, *params)
```

### 7.2 Machine Learning Enhancement

**Feature Engineering:**
```python
Features (per well):
├── Time-series features
│   ├── Rolling averages (7, 30, 90 days)
│   ├── Trend (linear regression slope)
│   ├── Volatility (std dev of production)
│   └── Days since peak production
├── Well attributes
│   ├── Depth (ft)
│   ├── Lateral length (ft)
│   ├── Number of frac stages
│   └── Formation type (one-hot encoded)
├── Economic features
│   ├── Current WTI price
│   ├── Price volatility (30-day)
│   └── Operating cost estimate
└── Spatial features
    ├── Distance to nearest well
    ├── Avg production of nearby wells (5km radius)
    └── Basin/county embeddings
```

**Model Training Pipeline:**
```python
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit

# Train-test split (temporal)
tscv = TimeSeriesSplit(n_splits=5)

# Model
model = xgb.XGBRegressor(
    objective='reg:squarederror',
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    early_stopping_rounds=50
)

# Train with cross-validation
for train_idx, val_idx in tscv.split(X):
    model.fit(
        X[train_idx], y[train_idx],
        eval_set=[(X[val_idx], y[val_idx])],
        verbose=False
    )

# Feature importance (for explainability)
import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
```

### 7.3 NPV Calculation

**Discounted Cash Flow:**
```python
def calculate_npv(
    production_forecast: np.ndarray,  # bbl/day for each month
    oil_price: float,  # $/bbl
    operating_cost: float,  # $/bbl
    royalty_rate: float = 0.25,
    discount_rate: float = 0.10,  # 10% annually
    tax_rate: float = 0.21
):
    monthly_discount = (1 + discount_rate) ** (1/12) - 1

    npv = 0
    for month, production in enumerate(production_forecast):
        # Revenue
        revenue = production * 30 * oil_price  # Assuming 30 days/month

        # Costs
        costs = production * 30 * operating_cost

        # Net after royalties
        net_revenue = (revenue - costs) * (1 - royalty_rate)

        # After tax
        cash_flow = net_revenue * (1 - tax_rate)

        # Discount to present value
        npv += cash_flow / (1 + monthly_discount) ** month

    return npv
```

**Sensitivity Analysis:**
```python
# Monte Carlo simulation for uncertainty
import scipy.stats as stats

def npv_monte_carlo(base_params, n_simulations=1000):
    results = []

    for _ in range(n_simulations):
        # Sample from distributions
        oil_price = stats.norm.rvs(
            loc=base_params['oil_price'],
            scale=base_params['oil_price'] * 0.15  # 15% volatility
        )

        production = production_forecast * stats.norm.rvs(
            loc=1.0,
            scale=0.10,  # 10% production uncertainty
            size=len(production_forecast)
        )

        npv = calculate_npv(production, oil_price, **other_params)
        results.append(npv)

    return {
        'mean': np.mean(results),
        'p10': np.percentile(results, 10),
        'p50': np.percentile(results, 50),
        'p90': np.percentile(results, 90)
    }
```

---

## 8. Implementation Roadmap (24-Hour Hackathon)

### Phase 1: Setup & Data (Hours 0-4)

**Hour 0-1: Environment Setup**
- [ ] Initialize Git repository
- [ ] Set up monorepo structure (frontend/backend/contracts)
- [ ] Install dependencies (Node, Python, Hardhat)
- [ ] Configure environment variables (.env files)
- [ ] Set up PostgreSQL + TimescaleDB (Docker Compose)

**Hour 1-2: Data Acquisition**
- [ ] Download sample data from Texas RRC (1 county, 100 wells)
- [ ] Parse CSV into PostgreSQL database
- [ ] Create seed data for 10 demo wells
- [ ] Set up mock oracle data generator (JSON files)

**Hour 2-4: Smart Contracts (Core)**
- [ ] Deploy TwinRegistry.sol (minimal ERC-721)
- [ ] Deploy simple PBT token (ERC-20, no restrictions yet)
- [ ] Deploy OracleHub.sol (manual updates, no Chainlink yet)
- [ ] Mint 10 well twins on testnet
- [ ] Verify contracts on block explorer

### Phase 2: Backend & AI (Hours 4-10)

**Hour 4-6: API Development**
- [ ] Set up Express/FastAPI server
- [ ] Create Prisma schema, run migration
- [ ] Implement GET /wells endpoint with filters
- [ ] Implement GET /wells/:id with production data
- [ ] Add CORS, error handling

**Hour 6-8: AI Model (Simplified)**
- [ ] Implement Arps DCA fitting function
- [ ] Train simple XGBoost model on sample data
- [ ] Create /valuate endpoint (triggers model)
- [ ] Store valuation results in database
- [ ] Add confidence scores

**Hour 8-10: Oracle Integration**
- [ ] Set up Chainlink Price Feed reader (WTI)
- [ ] Create mock production oracle (scheduled job)
- [ ] Implement webhook to receive oracle updates
- [ ] Trigger PBT minting based on production data
- [ ] Emit events, log to database

### Phase 3: Frontend (Hours 10-18)

**Hour 10-12: Dashboard Foundation**
- [ ] Create React app with Vite + TypeScript
- [ ] Set up Tailwind CSS, shadcn/ui
- [ ] Implement wallet connection (RainbowKit)
- [ ] Create layout with header, sidebar

**Hour 12-14: Map Interface**
- [ ] Integrate Mapbox GL JS
- [ ] Plot wells as markers (lat/lng from DB)
- [ ] Color code markers by valuation score
- [ ] Add click handler to show well popup
- [ ] Implement basic filters (production range)

**Hour 14-16: Well Detail View**
- [ ] Create modal/page for well details
- [ ] Display production chart (Recharts)
- [ ] Show AI valuation results
- [ ] Display digital twin NFT (OpenSea metadata)
- [ ] Add "Generate Bid" button

**Hour 16-18: Polish & Integration**
- [ ] Connect frontend to backend API (React Query)
- [ ] Implement real-time price updates (WebSocket or polling)
- [ ] Add loading states, error handling
- [ ] Responsive design for mobile
- [ ] Add ESG scorecard section

### Phase 4: Demo Prep (Hours 18-24)

**Hour 18-20: Testing & Bug Fixes**
- [ ] End-to-end test: view well → trigger valuation → see results
- [ ] Test wallet connection, transaction signing
- [ ] Fix critical bugs
- [ ] Optimize database queries (add indexes)
- [ ] Test on different browsers

**Hour 20-22: Demo Scenario**
- [ ] Identify 3 undervalued wells for demo
- [ ] Pre-load production data, run AI model
- [ ] Create demo video (screen recording)
- [ ] Prepare 1-minute pitch script
- [ ] Set up demo account with test funds

**Hour 22-24: Presentation Materials**
- [ ] Create pitch deck (8-10 slides)
  - Problem, Solution, Architecture, Demo, Team
- [ ] Update README with screenshots
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Deploy backend to Railway/Render
- [ ] Create GitHub repo with clean README
- [ ] Practice pitch (under 5 minutes)

---

## 9. Risk Analysis & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Data API downtime** | Medium | High | Cache recent data; use mock data generator |
| **Smart contract bug** | Low | Critical | Use OpenZeppelin; limit scope; don't handle real funds |
| **AI model inaccuracy** | High | Medium | Show confidence scores; label as "beta"; compare to DCA |
| **Gas cost spikes** | Medium | Medium | Use L2 (Polygon); batch transactions; optimize contract |
| **Chainlink oracle delay** | Low | Medium | Set acceptable latency windows; use cached prices |
| **Database performance** | Low | Low | Index properly; use TimescaleDB compression |
| **CORS/auth issues** | Medium | Low | Test early; use well-known libraries |

### Business/Demo Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| **Judges don't understand oil field** | Medium | High | Simple analogies; visual aids; clear pitch |
| **Internet failure during demo** | Low | Critical | Pre-record video; use local demo mode |
| **Time overrun (can't finish)** | High | High | Prioritize core features; have fallback scope |
| **Team coordination issues** | Medium | Medium | Clear task assignment; daily standups |
| **Regulatory concerns raised** | Low | Medium | Acknowledge; position as "proof of concept" |

### Scope Management

**Must-Have (Core Demo):**
- ✅ Map with 10+ wells
- ✅ Click well → see production chart
- ✅ AI valuation displayed
- ✅ Digital twin NFT visible
- ✅ 1 live oracle update during demo

**Should-Have (Time Permitting):**
- PBT token minting shown
- ESG score calculated
- Multiple oracle sources
- Wallet-connected portfolio view

**Nice-to-Have (Post-Hackathon):**
- Full Chainlink integration
- Transfer restrictions (ERC-1404)
- Secondary market (Uniswap pool)
- Mobile app

---

## 10. Competitive Analysis

### Existing Solutions in Energy + Blockchain

**1. Power Ledger** (Energy trading, not oil)
- **Focus:** Renewable energy P2P trading
- **Differentiation:** We focus on oil/gas, not renewables; production verification

**2. WePower** (Energy tokenization)
- **Focus:** Green energy tokenization
- **Differentiation:** We target fossil fuels (realistic for Pytheas); AI valuation

**3. Energy Web Chain** (EW-DOS)
- **Focus:** Decentralized operating system for energy
- **Differentiation:** We're application-specific, not infrastructure

**4. Traditional Well Valuation Software** (Aucerna, MOSAIC, PHDWin)
- **Focus:** Desktop software for engineers
- **Differentiation:** Blockchain transparency; retail access; real-time oracles

**5. Pytheas Energy (Sponsor's Current Process)**
- **Focus:** Manual well acquisition; spreadsheet analysis
- **Differentiation:** We automate their workflow; add blockchain transparency

**Our Unique Value Proposition:**
> "The only solution that combines AI well valuation, blockchain transparency, and production tokenization specifically for mature oil & gas assets."

---

## 11. Go-to-Market Strategy (Post-Hackathon)

### Phase 1: Pilot (Months 0-3)
- **Target:** Pytheas Energy (sponsor)
- **Scope:** 50 wells in one Texas basin
- **Goal:** Validate AI model accuracy vs. actual acquisition performance
- **Metrics:** Model error <15%, time savings >60%

### Phase 2: Regional Expansion (Months 3-9)
- **Target:** Small independent operators in Texas/Oklahoma
- **Scope:** 500 wells
- **Goal:** Prove tokenization value (faster liquidity)
- **Metrics:** Token trading volume, liquidity premium

### Phase 3: Platform (Months 9-18)
- **Target:** Institutional investors, retail via Coinbase
- **Scope:** Multi-state, 5000+ wells
- **Goal:** Become the standard for RWA oil tokenization
- **Metrics:** TVL, number of operators, ESG transparency score

### Revenue Model
1. **Transaction Fees:** 0.5% on PBT trades
2. **Valuation API:** $50/well for AI valuation report
3. **Operator Subscriptions:** $500/month for portfolio management
4. **Data Licensing:** Sell aggregated (anonymized) production data

---

## 12. Technical Debt & Future Improvements

### Known Shortcuts for Hackathon

**1. Security**
- ⚠️ No formal security audit
- ⚠️ Simple access control (not multi-sig)
- ⚠️ Oracle data not cryptographically signed (just trusted)
- **Future:** Audit by CertiK/Trail of Bits; implement Chainlink OCR

**2. Scalability**
- ⚠️ No caching layer (Redis)
- ⚠️ API not rate-limited
- ⚠️ Database queries not optimized for 10k+ wells
- **Future:** Add Redis; implement GraphQL for flexible queries; partition DB

**3. Data Quality**
- ⚠️ Using old/incomplete public datasets
- ⚠️ No data validation pipelines
- ⚠️ Missing data handling is simplistic
- **Future:** Partner with data providers; implement Airflow ETL; anomaly detection

**4. AI Model**
- ⚠️ Simple model (no ensemble, no LSTM)
- ⚠️ Not retrained over time
- ⚠️ Limited feature engineering
- **Future:** MLOps pipeline (MLflow); A/B testing; online learning

**5. Compliance**
- ⚠️ No legal review of security token structure
- ⚠️ KYC not implemented (just placeholder)
- ⚠️ No accredited investor verification
- **Future:** Work with securities lawyer; integrate KYC provider (Persona, Onfido)

---

## 13. Key Performance Indicators (KPIs)

### Demo Success Metrics
- [ ] **Functionality:** All core features work without crashes
- [ ] **Performance:** Map loads <2s, well detail <1s
- [ ] **Visual Appeal:** Professional UI, smooth animations
- [ ] **Clarity:** Judges understand the concept in <1 minute
- [ ] **Wow Factor:** Live oracle update or token mint during demo

### Judging Criteria Alignment

**Impact & Relevance (Weight: 30%)**
- ✅ Solves real problem (Pytheas's acquisition workflow)
- ✅ Addressable market ($16M+ in recent acquisitions)
- ✅ Clear value proposition (transparency + liquidity)

**Technical Innovation (Weight: 30%)**
- ✅ Novel combination: AI + Blockchain + Oracles + RWA
- ✅ ZK proofs (optional) for privacy-preserving valuations
- ✅ Advanced use of Chainlink (beyond price feeds)

**Feasibility & Scalability (Weight: 20%)**
- ✅ Working MVP in 24 hours
- ✅ Clear path to production (partner with Pytheas)
- ✅ Scalable architecture (L2, indexed data)

**Presentation & Collaboration (Weight: 20%)**
- ✅ Clear pitch deck
- ✅ Live demo (not just slides)
- ✅ Team coordination (if applicable)
- ✅ Code quality (TypeScript, tests)

---

## 14. Team Roles & Responsibilities (If Applicable)

### Recommended Team Structure (3-4 people)

**Role 1: Full-Stack/Smart Contracts Lead**
- Deploy and test smart contracts (Hardhat)
- Set up Chainlink integration
- Backend API development
- **Skills:** Solidity, TypeScript, Node.js

**Role 2: Frontend/UX Lead**
- Build React dashboard
- Implement map interface (Mapbox)
- Design UI/UX
- **Skills:** React, TypeScript, Tailwind, design

**Role 3: Data/AI Lead**
- Source and clean well data
- Train AI valuation model
- Set up database schema
- **Skills:** Python, ML (scikit-learn, XGBoost), SQL

**Role 4: Product/Pitch Lead (Optional)**
- Define user stories
- Create pitch deck
- Coordinate demo flow
- **Skills:** Product management, presentation, domain knowledge

**If Solo:** Focus on simplified stack (all TypeScript, mock AI with simple DCA, use existing Chainlink feeds).

---

## 15. Appendix: Technical Specifications

### 15.1 Environment Variables

**Backend `.env`:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/oilfield
REDIS_URL=redis://localhost:6379

# Blockchain
ALCHEMY_API_KEY=<your_key>
PRIVATE_KEY=<deployer_wallet>
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/<key>

# APIs
EIA_API_KEY=ru76sdTSNwSTOxucFf8JN53q5ht7NGA4NuLnfCrR
MAPBOX_TOKEN=<mapbox_token>

# Auth
JWT_SECRET=<random_string>
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:3001
VITE_CHAIN_ID=80001  # Polygon Mumbai
VITE_WALLET_CONNECT_PROJECT_ID=<project_id>
VITE_MAPBOX_TOKEN=<mapbox_token>
```

**Contracts `.env`:**
```bash
PRIVATE_KEY=<deployer_wallet>
POLYGONSCAN_API_KEY=<for_verification>
ALCHEMY_API_KEY=<your_key>
```

### 15.1.1 API Credentials

**EIA Open Data API Key:**
```
Key: ru76sdTSNwSTOxucFf8JN53q5ht7NGA4NuLnfCrR
Documentation: www.eia.gov/developer
```

This key provides access to:
- Field-level production data
- State-level aggregates
- Crude oil prices
- Rate Limit: 5000 calls/hour

**EIA Crude Reserves and Production API:**
```
URL: https://api.eia.gov/category/?api_key=ru76sdTSNwSTOxucFf8JN53q5ht7NGA4NuLnfCrR&category_id=714758
Category ID: 714758 (Crude Reserves and Production)
```

This endpoint provides:
- Crude oil reserves data
- Production statistics by field/region
- Historical production trends
- Reserve estimates and forecasts

**Texas Railroad Commission (RRC) Data:**
```
URL: https://www.rrc.state.tx.us/resource-center/research/research-queries/
```

This resource provides:
- Well production data (monthly)
- Well permits and completion data
- Operator information
- Lease and field data
- Drilling permits
- Format: CSV downloads and online queries (no official REST API)

**Chainlink Price Feeds:**
```
URL: https://docs.chain.link/data-feeds/price-feeds
```

This provides:
- WTI Crude Oil / USD price feeds
- Brent Crude Oil / USD price feeds
- Real-time market data
- Decentralized oracle network
- Available on multiple networks (Ethereum, Polygon, Arbitrum, etc.)
- Update frequency: Based on price deviation thresholds

### 15.2 API Endpoints (Full Spec)

**Base URL:** `http://localhost:3001/api`

```yaml
GET /wells
  Query params:
    - limit: number (default 100)
    - offset: number (default 0)
    - minProduction: number (bbl/day)
    - maxProduction: number (bbl/day)
    - minESG: number (0-100)
    - county: string
    - status: enum (active, plugged, depleted)
  Response:
    {
      "wells": [
        {
          "id": "uuid",
          "wellId": "TX-2438",
          "operator": "0xABC...",
          "latitude": 32.5,
          "longitude": -99.8,
          "currentProduction": 1050,
          "esgScore": 78,
          "valuationScore": 1.23,  # >1 = undervalued
          "nftTokenId": 42
        }
      ],
      "total": 1234,
      "hasMore": true
    }

GET /wells/:id
  Response:
    {
      "well": { /* full well object */ },
      "production": [
        { "date": "2024-10-01", "oil_bbl": 1050, "gas_mcf": 2100 }
      ],
      "valuation": {
        "npv": 2500000,
        "remainingReserves": 180000,
        "confidence": 0.87,
        "lastUpdated": "2024-10-31T12:00:00Z"
      },
      "esg": {
        "carbonIntensity": 25.3,  # kg CO2/bbl
        "flaringEvents": 2,
        "lastFlaringDate": "2024-09-15"
      }
    }

POST /wells/:id/valuate
  Auth: JWT token (operator only)
  Response:
    {
      "valuation": { /* valuation object */ },
      "jobId": "uuid"  # For async polling if needed
    }

GET /oracles/status
  Response:
    {
      "oracles": [
        {
          "type": "production",
          "status": "active",
          "lastUpdate": "2024-10-31T11:45:00Z",
          "latency_ms": 1200,
          "agreement_pct": 100
        }
      ]
    }

POST /oracles/update
  Auth: Oracle signature
  Body:
    {
      "wellId": "TX-2438",
      "type": "production",
      "data": { "oil_bbl": 1050 },
      "timestamp": "2024-10-31T12:00:00Z",
      "signature": "0xABC..."
    }
  Response:
    { "success": true, "blockNumber": 12345678 }

GET /tokens/pbt/:wellId
  Response:
    {
      "tokenAddress": "0xDEF...",
      "totalSupply": 180000,
      "priceUSD": 75.50,
      "liquidityUSD": 125000,
      "holders": 23
    }

POST /tokens/mint
  Auth: JWT + operator signature
  Body:
    {
      "wellId": "TX-2438",
      "amount": 1050,
      "productionDate": "2024-10-30"
    }
  Response:
    { "txHash": "0x123...", "newSupply": 181050 }

GET /portfolio/:address
  Auth: JWT (signed by :address)
  Response:
    {
      "wells": [ /* array of well objects */ ],
      "aggregateMetrics": {
        "totalProduction": 8500,  # bbl/day
        "portfolioNAV": 18500000,
        "avgESG": 82,
        "totalPBTSupply": 2100000
      }
    }

GET /valuations/opportunities
  Query params:
    - minDiscount: number (default 0.2 = 20%)
    - limit: number
  Response:
    {
      "opportunities": [
        {
          "well": { /* well object */ },
          "discount": 0.35,  # 35% undervalued
          "estimatedROI": 2.4,  # 240% return
          "confidence": 0.91
        }
      ]
    }
```

### 15.3 Smart Contract Interfaces

**TwinRegistry.sol:**
```solidity
interface ITwinRegistry {
  struct WellMetadata {
    string wellId;
    string operator;
    uint256 latitude;  // Stored as int (lat * 1e6)
    uint256 longitude;
    WellStatus status;
    uint256 esgScore;
  }

  enum WellStatus { Active, Depleted, Plugged }

  function mintTwin(
    address to,
    string memory wellId,
    string memory metadataURI
  ) external returns (uint256 tokenId);

  function updateMetadata(
    uint256 tokenId,
    string memory newMetadataURI
  ) external;

  function getWellMetadata(uint256 tokenId)
    external view returns (WellMetadata memory);

  event TwinMinted(uint256 indexed tokenId, string wellId, address operator);
  event MetadataUpdated(uint256 indexed tokenId, string metadataURI);
}
```

**OracleHub.sol:**
```solidity
interface IOracleHub {
  struct OracleData {
    uint256 timestamp;
    uint256 value;
    address oracle;
    bytes signature;
  }

  function submitProductionData(
    string memory wellId,
    uint256 production,  // in bbl * 1e2 (for 2 decimals)
    bytes memory signature
  ) external;

  function getLatestProduction(string memory wellId)
    external view returns (uint256 production, uint256 timestamp);

  function registerOracle(address oracle) external;

  event ProductionUpdated(
    string indexed wellId,
    uint256 production,
    uint256 timestamp,
    address oracle
  );
}
```

---

## 16. Final Thoughts & Recommendations

### What Makes This Project Hackathon-Winning

**1. Clear Problem-Solution Fit**
- Pytheas Energy literally does this (acquiring underperforming wells)
- We're building their next acquisition tool
- Measurable ROI (time saved, better valuations)

**2. Technical Sophistication**
- Multi-disciplinary: AI + Blockchain + Oracles + Real-world data
- Not just a "put X on blockchain" - actual novel architecture
- Demonstrates understanding of energy industry

**3. Demo-Friendly**
- Visual (map with color-coded wells)
- Interactive (click, see valuation, generate bid)
- Live element (oracle update or token mint)
- Easy to explain to non-technical judges

**4. Scalability Story**
- Starts with 100 wells (MVP)
- Scales to 10,000+ wells (regional)
- Scales to entire US (100k+ wells)
- Clear business model for sustainability

### Critical Success Factors

**DO:**
- ✅ Focus on ONE user journey: "Find undervalued well → See valuation → Generate bid"
- ✅ Use real data (even if small sample)
- ✅ Make the map beautiful and interactive
- ✅ Show live oracle update during demo
- ✅ Explain WHY blockchain (transparency, tokenization, not just hype)

**DON'T:**
- ❌ Try to implement every feature (scope creep)
- ❌ Over-engineer (keep it simple for 24h)
- ❌ Ignore frontend UX (judges see the UI first)
- ❌ Forget the pitch (great tech + bad pitch = lose)
- ❌ Assume judges know oil & gas (explain simply)

### The Winning Pitch (1 Minute)

> "Pytheas Energy just acquired $16 million in underperforming oil wells. But finding these opportunities is slow and opaque.
>
> **OilTwin** turns every oil well into a verifiable digital twin on blockchain. Our AI analyzes production data and predicts which wells are undervalued. Oracles verify real-time production. And operators can tokenize their barrels for instant liquidity.
>
> [SHOW MAP] Here's Texas. Green wells are undervalued. Click this one. [DEMO] Our AI says it's worth $2.5 million, but the owner might sell for $1.8M. That's a 40% discount.
>
> [SHOW ORACLE UPDATE] Watch this: our Chainlink oracle just updated production data. The digital twin updates in real-time.
>
> **For Pytheas:** Automate your acquisition pipeline.
> **For operators:** Turn barrels into tradable tokens.
> **For investors:** Access transparent energy yields.
>
> We're making oil fields as easy to invest in as stocks. Thank you."

---

## 17. Next Steps (Post-Requirements)

### Immediate Actions
1. **Confirm Tech Stack** - Decide: TypeScript vs Python backend, which blockchain
2. **Data Acquisition** - Download Texas RRC data for 1 county (start small)
3. **Design Review** - Sketch wireframes for map + well detail views
4. **Team Kickoff** - If team, assign roles; if solo, prioritize ruthlessly

### Pre-Hackathon Prep (Do This Week)
- [ ] Set up development environment (Node, Python, PostgreSQL, Hardhat)
- [ ] Create accounts: Alchemy, Mapbox, EIA API
- [ ] Download sample well data, explore in spreadsheet
- [ ] Sketch database schema
- [ ] List exact contracts to deploy (keep it minimal)
- [ ] Identify 3 wells to use for demo

### During Hackathon
- **Hour 0:** Run setup scripts, confirm environment works
- **Hour 1-4:** Focus on data + smart contracts (foundation)
- **Hour 5-12:** Build backend + AI (core logic)
- **Hour 13-18:** Frontend (what judges see)
- **Hour 19-24:** Testing + demo prep + pitch

### Post-Hackathon (If You Win/Want to Continue)
- Week 1: Clean up code, deploy to mainnet/Polygon
- Week 2: Reach out to Pytheas for pilot discussion
- Month 1: Expand dataset to 500 wells, improve AI model
- Month 3: Beta test with 2-3 small operators
- Month 6: Raise pre-seed round ($500k) for full buildout

---

## Conclusion

This is a **highly ambitious but achievable** project for a 24-hour hackathon. The key is:
1. **Ruthless prioritization** - Core demo > polish
2. **Real data** - Even small sample beats mock data
3. **Visual impact** - Map + live updates are memorable
4. **Clear value prop** - Solves Pytheas's exact problem

You have a **strong competitive advantage**:
- Perfect sponsor alignment (Pytheas Energy)
- Multi-track fit (AI + Blockchain + Oracles + RWA)
- Real industry problem with measurable ROI
- Demo-friendly (not just smart contracts)

**Confidence Level:** If you execute on the 24h plan above, this is a **top 3 finish** project, likely **winner** if demo goes smoothly.

Good luck! 🚀

---

**Document Version:** 1.0 Enriched
**Last Updated:** 2025-10-31
**Next Review:** After team sync / tech stack decision
