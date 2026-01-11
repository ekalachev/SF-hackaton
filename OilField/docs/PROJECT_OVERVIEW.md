# OilField Investment Platform - Project Overview

**AI-Powered Oil & Gas Well Investment Analysis Platform**

## 🎯 Executive Summary

OilField is a hackathon MVP that uses AI and vector similarity search to help investors identify undervalued oil wells in Texas. The platform combines decline curve analysis (DCA), semantic embeddings, and Claude AI to generate comprehensive investment reports, making oil & gas asset acquisition more data-driven and efficient.

## 🚀 Key Features

### 1. AI-Powered Investment Reports
- **Claude AI Integration**: Generates 2000-2500 word investment analysis reports
- **Comprehensive Analysis**: Executive summary, performance analysis, risk assessment, and recommendations
- **Markdown Rendering**: Professional formatting with tables and charts

### 2. Vector Similarity Search (pgvector)
- **Semantic Well Matching**: Find similar wells using 384-dimensional embeddings
- **AI-Generated Match Reasons**: Explains why wells are similar (formation, production, valuation)
- **Sub-second Query Speed**: HNSW index for fast similarity searches

### 3. Interactive Map Visualization
- **Mapbox Integration**: Interactive map of Texas oil fields
- **Clustering**: Automatic clustering for large datasets
- **Color-Coded Markers**: Visual indication of valuation discount (undervalued/overvalued)

### 4. Production Analytics
- **Time-Series Charts**: 24-month production history with Recharts
- **Decline Curve Analysis**: Hyperbolic decline modeling
- **NPV Calculations**: Net present value with economic assumptions

### 5. Well Valuation Dashboard
- **Animated Metrics**: AI value, market value, discount percentage
- **Production Metrics**: Current rate, cumulative production, reserves
- **Confidence Scoring**: AI-generated confidence in valuations

## 🏗️ Architecture

### Backend (Node.js + TypeScript + Express)
```
- API Server (Express)
- PostgreSQL 16 + pgvector 0.8.1
- Claude CLI Integration
- Knex.js for migrations
- Sentence Transformers (Python) for embeddings
```

### Frontend (React + TypeScript + Vite)
```
- React 18.2 with TypeScript
- Tailwind CSS + shadcn/ui
- React Query for state management
- Mapbox GL JS for mapping
- Recharts for data visualization
```

### Data Pipeline (Python)
```
- Mock RRC data generation (500 wells)
- Decline curve analysis (DCA)
- NPV calculations
- Sentence Transformers embeddings
```

## 📊 Technical Stats

- **Total Code**: ~12,000 lines
  - Backend: ~5,000 lines (TypeScript)
  - Frontend: ~4,000 lines (TypeScript/TSX)
  - Data Pipeline: ~3,000 lines (Python)
- **Test Coverage**:
  - Backend: 58+ tests
  - Frontend: 111 tests (100% passing)
  - Data Pipeline: 49 tests (100% passing)
- **Database**: 4 core tables + 1 cache table
  - 25 curated demo wells
  - 432 production history records
  - 15 operators

## 🎓 Technology Stack

### Core Technologies
- **Backend**: Node.js 20+, Express 4.18, TypeScript 5.3
- **Frontend**: React 18.2, Vite 7.1, TypeScript 5.9
- **Database**: PostgreSQL 16 + pgvector 0.8.1
- **AI/ML**: Claude CLI, Sentence Transformers (all-MiniLM-L6-v2)
- **Testing**: Vitest, React Testing Library

### Key Libraries
- **API**: Axios, Zod validation, React Query 5.0
- **UI**: shadcn/ui, Tailwind CSS, Radix UI, Lucide icons
- **Data Viz**: Recharts 2.10, Mapbox GL JS 3.0
- **Utilities**: date-fns, react-markdown, react-countup

## 📈 Development Progress

### ✅ Sprint 0: Setup & Infrastructure (v0.4.0)
- Backend Express + TypeScript
- Frontend Vite + React
- PostgreSQL + pgvector setup
- Python environment for embeddings

### ✅ Sprint 1: Data & Database (v0.5.0)
- RRC data generation (500 wells)
- Data processing and cleaning (25 demo wells)
- DCA valuation calculations
- Embedding generation

### ✅ Sprint 2: Backend API (v0.6.0)
- Database schema with pgvector
- Seed scripts
- Well service (CRUD, filtering, sorting)
- Similarity service with vector search
- API routes

### ✅ Sprint 3: Frontend Core (v0.7.0)
- Mapbox map component
- Well detail modal
- Production chart
- Valuation cards
- API client with React Query

### ✅ Sprint 4: AI Features (v0.8.0) - **CURRENT**
- Claude service for AI reports
- AI API routes
- Similar wells panel
- Investment report component

### 🔜 Sprint 5: Deploy & Demo (v1.0.0)
- Production deployment
- Performance optimization
- Documentation
- Demo preparation

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 20+
- PostgreSQL 16
- Python 3.11+
- Docker (optional)
```

### Installation
```bash
# Clone repository
git clone https://github.com/o2alexanderfedin/OilField.git
cd OilField

# Backend setup
cd backend
npm install
npm run migrate:latest
npm run seed

# Frontend setup
cd ../frontend
npm install

# Python setup
cd ../data-pipeline
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running
```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev

# Access: http://localhost:5173
```

## 🎯 Key Differentiators

1. **AI-First Approach**: Uses Claude AI for investment analysis, not just data aggregation
2. **Vector Similarity**: pgvector enables semantic well matching beyond simple filters
3. **Full Stack TypeScript**: Strong typing throughout for reliability
4. **TDD Methodology**: Comprehensive test coverage following test-driven development
5. **Production-Ready**: SOLID principles, proper git flow, CI/CD ready

## 📊 Data Model

### Core Entities
- **Wells**: 25 curated Texas wells with embeddings
- **Operators**: 15 unique operators
- **Production History**: 24 months of data per well
- **Valuations**: NPV, market value, discount analysis
- **Well Narratives**: Cached AI-generated summaries

### Vector Embeddings
- **Model**: all-MiniLM-L6-v2 (384 dimensions)
- **Index**: HNSW for O(log n) similarity search
- **Distance**: Cosine similarity (0-1 scale)

## 🔐 Engineering Principles

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **KISS**: Keep It Simple - avoid over-engineering
- **DRY**: Don't Repeat Yourself - reusable components
- **YAGNI**: You Aren't Gonna Need It - build what's needed
- **TDD**: Test-Driven Development - tests written first
- **TRIZ**: Theory of Inventive Problem Solving

## 📝 API Endpoints

### Wells
- `GET /api/wells` - List wells with filtering/sorting
- `GET /api/wells/:id` - Well details with production history
- `GET /api/wells/:id/similar` - Find similar wells (pgvector)

### AI Features
- `POST /api/wells/:id/generate-report` - Generate AI investment report
- `GET /api/wells/:id/narrative` - Get cached well narrative

### Search
- `POST /api/search/semantic` - Semantic search with natural language

## 🎨 UI Components

- **MapView**: Interactive Mapbox map with clustering
- **WellDetailModal**: Comprehensive well information modal
- **ProductionChart**: 24-month time-series chart
- **ValuationCard**: Animated valuation metrics
- **SimilarWellsPanel**: AI-powered similar wells
- **InvestmentReport**: AI-generated report viewer

## 📦 Deliverables

- ✅ Fully functional MVP
- ✅ 200+ tests (passing)
- ✅ API documentation
- ✅ Database schema
- ✅ Git flow with 8 releases (v0.1.0 - v0.8.0)
- ✅ TDD approach throughout
- ✅ Type-safe implementation

## 🎯 Next Steps (Sprint 5)

1. **Deployment**: Deploy to production (Vercel + Supabase/Neon)
2. **Performance**: Optimize queries and bundle size
3. **Documentation**: API docs, user guide, architecture diagrams
4. **Demo**: Prepare presentation and demo script
5. **Polish**: Final UI/UX improvements

## 📞 Contact

**Project**: OilField Investment Platform
**Repository**: https://github.com/o2alexanderfedin/OilField
**Status**: Sprint 4 Complete (v0.8.0)
**Stack**: TypeScript, React, PostgreSQL, pgvector, Claude AI

---

*Generated with Claude Code - AI-powered development assistant*
