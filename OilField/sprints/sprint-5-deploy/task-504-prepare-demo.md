# Task 504: Prepare Demo Presentation

## References
- `docs/MVP_SCOPE.md` - Section "Demo Script" lines 424-464
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Demo prep lines 1963-1976

## Objective
Prepare demo flow and materials for local deployment presentation.

## Prerequisites
- [ ] All containers running: `docker-compose ps`
- [ ] Frontend accessible at http://localhost:5173 (dev) or http://localhost:8080 (production)
- [ ] Backend API responding at http://localhost:3001
- [ ] Database seeded with well data
- [ ] Browser tested (Chrome/Firefox recommended)

## Acceptance Criteria
- [ ] Identify 3 "hero wells" with best visuals
- [ ] Demo script printed/memorized per MVP_SCOPE.md lines 426-464
- [ ] Backup video recording of demo (90 seconds)
- [ ] Screenshots of key screens captured
- [ ] Test demo flow 3 times without errors
- [ ] Prepare for Q&A (architecture, tech choices)
- [ ] Local environment stable and tested

## Demo Setup Steps

### 1. Identify Hero Wells
Query database to find best wells for demo:
```bash
# Find wells with good production
docker-compose exec postgres psql -U oilfield -d oilfield -c "
SELECT
  id,
  well_name,
  api_number,
  current_production_bbl_day,
  status
FROM wells
WHERE current_production_bbl_day > 40
  AND status = 'active'
ORDER BY current_production_bbl_day DESC
LIMIT 5;
"

# Check valuations for these wells
docker-compose exec postgres psql -U oilfield -d oilfield -c "
SELECT
  w.well_name,
  v.npv_usd,
  v.irr,
  v.payback_months
FROM wells w
JOIN valuations v ON w.id = v.well_id
WHERE w.current_production_bbl_day > 40
ORDER BY v.npv_usd DESC
LIMIT 5;
"
```

Select 3 wells with:
- High production rate (45+ bbl/day)
- Positive NPV ($1M+)
- Good IRR (>20%)
- Interesting location on map (well-distributed across Texas)

### 2. Pre-generate AI Content
Generate AI reports and narratives for hero wells BEFORE demo:
```bash
# Pre-generate reports for faster demo
for well_id in <hero-well-1-id> <hero-well-2-id> <hero-well-3-id>; do
  curl -X POST http://localhost:3001/api/wells/$well_id/generate-report
  curl http://localhost:3001/api/wells/$well_id/narrative
done
```

This ensures:
- Narratives are cached in database
- Reports generate quickly during demo
- No waiting during presentation

### 3. Create Backup Materials

#### Screenshots to Capture:
1. **Map View** - Full Texas map with all wells visible
2. **Well Detail Modal** - Hero well with production chart
3. **Valuation Cards** - NPV, IRR, Payback period
4. **Similar Wells Panel** - AI-powered similar wells with match reasons
5. **AI Report** - Generated investment report (first page)
6. **Mobile View** - Responsive design on phone screen

Save screenshots to `docs/demo/screenshots/`

#### Video Recording:
```bash
# Create demo directory
mkdir -p docs/demo

# Use QuickTime (Mac) or OBS Studio (cross-platform) to record:
# - Full 90-second demo run-through
# - Focus on smooth, confident delivery
# - Show all key features
# - Narrate with demo script

# Save as: docs/demo/oilfield-demo-90sec.mp4
```

### 4. Test Demo Flow

Run through complete demo 3 times:

#### Demo Flow (90 seconds):
1. **[0:00-0:15] Problem Statement**
   - Start at http://localhost:5173
   - Map view showing all Texas wells

2. **[0:15-0:30] Solution Overview**
   - Highlight AI-powered analysis
   - Point to color-coded wells (green = opportunity)

3. **[0:30-0:60] Live Demo**
   - Click green hero well #1
   - Show production chart
   - Highlight valuation: NPV, IRR
   - Click "Find Similar Wells"
   - Show AI-generated match reasons

4. **[0:60-0:75] AI Report**
   - Click "Generate AI Investment Report"
   - Show markdown-formatted report
   - Highlight investment recommendation

5. **[0:75-0:90] Impact Statement**
   - Close modal
   - Zoom out to show all wells
   - Conclude with vision

### 5. Prepare Q&A Responses

#### Technical Architecture:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 with pgvector extension
- **AI**: Claude API for natural language reports
- **Vector Search**: pgvector for similarity matching
- **Deployment**: Docker Compose (local), ready for cloud

#### Key Features:
- Real-time production data analysis
- AI-powered well similarity search
- Investment report generation
- Markdown formatting for reports
- RESTful API design
- Type-safe codebase (TypeScript)

#### Future Roadmap:
- Blockchain tokenization (Phase 2)
- Real-time data feeds
- Advanced ML models for production forecasting
- Mobile app
- Multi-user access control

## Verification Checklist

### Before Demo:
- [ ] All containers running and healthy
- [ ] Frontend loads in <2 seconds
- [ ] 3 hero wells identified and tested
- [ ] AI content pre-generated and cached
- [ ] Screenshots captured and organized
- [ ] Video backup recorded
- [ ] Demo script memorized
- [ ] Browser cleared of distractions (close other tabs)
- [ ] Internet connection stable (for Mapbox tiles)

### During Practice Runs:
- [ ] Run 1: Focus on timing (under 90 seconds)
- [ ] Run 2: Focus on smooth transitions
- [ ] Run 3: Focus on confident delivery

### Demo Success Criteria:
- [ ] Completed in under 90 seconds
- [ ] No errors or fumbling
- [ ] All features demonstrated:
  - Map view with color-coded wells
  - Well detail modal
  - Production chart
  - Valuation data
  - Similar wells (AI)
  - Investment report (AI)
- [ ] Clear, confident narrative
- [ ] Answers to Q&A prepared

## Demo Day Checklist

### 1 Hour Before:
- [ ] Start all containers: `docker-compose up -d`
- [ ] Verify health: `docker-compose ps`
- [ ] Test frontend: visit http://localhost:5173
- [ ] Test backend: `curl http://localhost:3001/api/wells`
- [ ] Check logs: `docker-compose logs`

### 30 Minutes Before:
- [ ] Clear browser cache
- [ ] Close unnecessary applications
- [ ] Set browser to fullscreen mode (F11)
- [ ] Mute notifications
- [ ] Have backup video ready

### 5 Minutes Before:
- [ ] Open http://localhost:5173 in browser
- [ ] Zoom map to show all Texas wells
- [ ] Take deep breath
- [ ] Review opening line

### After Demo:
- [ ] Save any feedback/questions
- [ ] Note what worked well
- [ ] Note what could improve
- [ ] Keep containers running for follow-up questions

## Troubleshooting

### If frontend doesn't load:
1. Check containers: `docker-compose ps`
2. Restart frontend: `docker-compose restart frontend`
3. Use backup video

### If API calls fail:
1. Check backend logs: `docker-compose logs backend`
2. Restart backend: `docker-compose restart backend`
3. Use backup video

### If AI features slow:
- AI content should be pre-cached (from step 2 above)
- If not cached, skip AI demo and focus on core features
- Use backup screenshots

### Complete Failure:
- Play backup video
- Use screenshots to walk through features
- Explain architecture from memory

## Time Estimate
30 minutes (setup + 3 practice runs)
