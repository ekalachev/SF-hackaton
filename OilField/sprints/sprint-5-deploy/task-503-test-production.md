# Task 503: End-to-End Local Deployment Testing

## References
- `docs/MVP_SCOPE.md` - Section "Success Criteria" lines 579-607
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Demo flow lines 1965-1976

## Objective
Verify all features work in local Docker deployment.

## Prerequisites
- [ ] PostgreSQL container running (docker-compose ps postgres)
- [ ] Backend container running (docker-compose ps backend)
- [ ] Frontend accessible at http://localhost:5173 (dev) or http://localhost:8080 (production)
- [ ] Database migrations completed
- [ ] Database seeds loaded

## Acceptance Criteria
- [ ] Map loads with 20+ wells
- [ ] Wells color-coded correctly (green/yellow/red)
- [ ] Click well → modal opens
- [ ] Production chart displays
- [ ] Valuation cards show correct data
- [ ] "Find Similar" button works
- [ ] AI report generation works
- [ ] No console errors
- [ ] Mobile responsive (test with browser dev tools)
- [ ] All 8 Playwright MCP automated tests pass
- [ ] Playwright test artifacts collected (screenshots, console logs, network logs)

## Verification Steps

### 1. Backend API Testing
```bash
# Test backend health
curl http://localhost:3001/health

# Test wells endpoint
curl http://localhost:3001/api/wells | jq '.wells | length'
# Should return 20+

# Test specific well
curl http://localhost:3001/api/wells/<well-id> | jq '.well.api_number'

# Test valuation endpoint
curl http://localhost:3001/api/wells/<well-id>/valuation | jq '.valuation.npv_usd'

# Test similar wells
curl http://localhost:3001/api/wells/<well-id>/similar | jq '.similarWells | length'
# Should return up to 5 wells

# Test AI narrative (should be cached after first call)
curl http://localhost:3001/api/wells/<well-id>/narrative | jq '.cached'

# Test AI report generation
curl -X POST http://localhost:3001/api/wells/<well-id>/generate-report | jq '.report' | head -20
```

### 2. Frontend User Journey Testing

Visit **http://localhost:5173** (dev) or **http://localhost:8080** (production)

#### Step 1: Map Loads
- [ ] Map displays Texas region
- [ ] 20+ well markers visible
- [ ] Wells color-coded: green (healthy), yellow (declining), red (problematic)
- [ ] Map controls work (zoom, pan)

#### Step 2: Well Selection
- [ ] Click on a green well marker
- [ ] Modal/detail panel opens
- [ ] Well name and API number display
- [ ] Location data shows

#### Step 3: Production Chart
- [ ] Production chart renders
- [ ] Chart shows historical production data
- [ ] Axes labeled correctly
- [ ] Tooltips work on hover

#### Step 4: Valuation Data
- [ ] NPV card displays value
- [ ] IRR card displays percentage
- [ ] Payback period card displays months
- [ ] Economic assumptions shown

#### Step 5: Similar Wells
- [ ] "Find Similar Wells" button visible
- [ ] Click button triggers loading
- [ ] Similar wells panel appears
- [ ] 5 wells listed with similarity scores
- [ ] Match reasons displayed (AI-generated)
- [ ] Emerald theme applied to AI features

#### Step 6: AI Report
- [ ] "Generate AI Investment Report" button visible
- [ ] Click button shows loading state (3-5 seconds)
- [ ] Report generates successfully
- [ ] Markdown formatting renders correctly
- [ ] Report contains: Executive Summary, Well Overview, Production Analysis, Economic Valuation, Investment Recommendation, Risk Factors

#### Step 7: Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] No errors (red messages)
- [ ] API calls successful (200 status codes in Network tab)

#### Step 8: Mobile Responsiveness
- [ ] Open DevTools Device Toolbar (Cmd+Shift+M / Ctrl+Shift+M)
- [ ] Test iPhone 12 Pro viewport
- [ ] Test iPad viewport
- [ ] UI adapts correctly
- [ ] All features accessible

### 3. Database Verification
```bash
# Check database contains wells
docker-compose exec postgres psql -U oilfield -d oilfield -c "SELECT COUNT(*) FROM wells;"
# Should return 20+

# Check valuations exist
docker-compose exec postgres psql -U oilfield -d oilfield -c "SELECT COUNT(*) FROM valuations;"

# Check narratives cache
docker-compose exec postgres psql -U oilfield -d oilfield -c "SELECT well_id, LENGTH(narrative), created_at FROM well_narratives LIMIT 5;"
```

### 4. Container Health Check
```bash
# All containers running
docker-compose ps

# Check logs for errors
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error
docker-compose logs postgres | grep -i error

# Check resource usage
docker stats --no-stream
```

## Manual Test Scenarios

### Scenario A: Happy Path
1. Open http://localhost:5173
2. Click any green well
3. Verify all data loads
4. Generate AI report
5. Close modal
6. Click another well
7. Find similar wells
8. Click on a similar well

### Scenario B: Error Handling
1. Stop backend: `docker-compose stop backend`
2. Try to load well details (should show error)
3. Start backend: `docker-compose start backend`
4. Retry (should work)

### Scenario C: Performance
1. Measure initial page load time (<3 seconds)
2. Measure well click → modal open (<500ms)
3. Measure AI report generation (3-5 seconds)
4. Check narrative caching (2nd call <100ms)

## Automated Testing with Playwright MCP

### Overview
Use Microsoft Playwright MCP server (available in Claude Code) for automated browser testing to verify all features work correctly in the deployed environment.

### Prerequisites for Playwright Testing
- [ ] Playwright MCP server available in Claude Code environment
- [ ] Frontend accessible at http://localhost:5173 or http://localhost:8080
- [ ] Backend running at http://localhost:3001
- [ ] Database seeded with test data

### Automated Test Suite

#### Test 1: Initial Page Load and Map Rendering
```
Objective: Verify the map loads correctly with well markers

Steps:
1. Navigate to http://localhost:5173
2. Take snapshot to verify page structure
3. Wait for map to load (look for canvas element or map container)
4. Verify no console errors
5. Take screenshot for visual verification
6. Check network requests show successful API calls to /api/wells

Expected Results:
- Page loads without errors
- Map container visible
- Wells data fetched successfully
- Multiple well markers rendered on map
```

#### Test 2: Well Selection and Modal Display
```
Objective: Verify clicking a well opens the detail modal

Steps:
1. Navigate to http://localhost:5173
2. Wait for map to load
3. Take snapshot to find well markers
4. Click on first green well marker
5. Wait for modal to appear
6. Verify modal contains:
   - Well name
   - API number
   - Location data
   - Production chart
7. Take screenshot of open modal
8. Check console for errors

Expected Results:
- Modal opens on well click
- Well details displayed correctly
- Production chart renders
- No console errors
```

#### Test 3: Valuation Cards Display
```
Objective: Verify valuation data cards render correctly

Steps:
1. Navigate to well detail modal (from Test 2)
2. Take snapshot to identify valuation cards
3. Verify NPV card exists and shows dollar amount
4. Verify IRR card exists and shows percentage
5. Verify Payback Period card shows months
6. Take screenshot of valuation section

Expected Results:
- All three valuation cards visible
- Values formatted correctly (currency, percentage, time)
- Cards have proper styling
```

#### Test 4: Similar Wells Feature
```
Objective: Verify "Find Similar Wells" functionality

Steps:
1. Navigate to well detail modal
2. Take snapshot to find "Find Similar" button
3. Click "Find Similar Wells" button
4. Wait for loading indicator
5. Wait for similar wells panel to appear
6. Verify 5 similar wells listed
7. Verify similarity scores displayed
8. Verify AI-generated match reasons shown
9. Verify emerald theme applied
10. Take screenshot of similar wells panel

Expected Results:
- Similar wells panel appears
- Up to 5 wells listed
- Similarity percentages shown
- Match reasons displayed
- Emerald color theme visible
```

#### Test 5: AI Report Generation
```
Objective: Verify AI investment report generation works

Steps:
1. Navigate to well detail modal
2. Take snapshot to find report button
3. Click "Generate AI Investment Report" button
4. Verify loading state appears
5. Wait for report generation (up to 10 seconds)
6. Verify report appears with markdown formatting
7. Verify report sections present:
   - Executive Summary
   - Well Overview
   - Production Analysis
   - Economic Valuation
   - Investment Recommendation
   - Risk Factors
8. Take screenshot of generated report
9. Check console for errors

Expected Results:
- Report generates successfully
- Markdown formatted correctly
- All required sections present
- No console errors during generation
```

#### Test 6: Mobile Responsiveness
```
Objective: Verify UI adapts correctly to mobile viewports

Steps:
1. Resize browser to iPhone 12 Pro dimensions (390x844)
2. Navigate to http://localhost:5173
3. Take screenshot of mobile view
4. Verify map renders correctly
5. Click on a well marker
6. Verify modal adapts to mobile screen
7. Resize to iPad dimensions (810x1080)
8. Take screenshot of tablet view
9. Verify UI remains functional

Expected Results:
- UI adapts to mobile viewport
- All features accessible on mobile
- Modal displays correctly on small screens
- No horizontal scrolling
```

#### Test 7: Error Handling
```
Objective: Verify application handles backend errors gracefully

Steps:
1. Navigate to http://localhost:5173
2. Stop backend: docker-compose stop backend
3. Try to click on a well
4. Verify error message displayed
5. Take screenshot of error state
6. Restart backend: docker-compose start backend
7. Reload page
8. Verify app recovers and works correctly

Expected Results:
- Error message shown when backend unavailable
- App doesn't crash
- App recovers when backend restarts
- No unhandled errors in console
```

#### Test 8: Network Request Verification
```
Objective: Verify all API calls succeed with correct status codes

Steps:
1. Navigate to http://localhost:5173
2. Monitor network requests
3. Click on a well
4. Click "Find Similar Wells"
5. Click "Generate AI Report"
6. Verify all requests:
   - GET /api/wells → 200
   - GET /api/wells/:id → 200
   - GET /api/wells/:id/valuation → 200
   - GET /api/wells/:id/similar → 200
   - POST /api/wells/:id/generate-report → 200
   - GET /api/wells/:id/narrative → 200

Expected Results:
- All API calls return 200 status
- No failed requests
- Response times acceptable
```

### Playwright MCP Test Execution Workflow

1. **Setup Phase**
   - Ensure all Docker containers running
   - Verify database seeded with test data
   - Clear browser cache and localStorage

2. **Execution Phase**
   - Run each test sequentially
   - Take snapshots before interactions
   - Take screenshots for visual verification
   - Monitor console for errors
   - Capture network requests

3. **Verification Phase**
   - Review all screenshots
   - Verify no console errors across all tests
   - Confirm all features working as expected
   - Document any failures or issues

4. **Cleanup Phase**
   - Close browser
   - Save test artifacts (screenshots, logs)
   - Document test results

### Test Artifacts to Collect

- **Screenshots**:
  - `01-initial-page-load.png`
  - `02-well-modal-open.png`
  - `03-valuation-cards.png`
  - `04-similar-wells-panel.png`
  - `05-ai-report.png`
  - `06-mobile-view.png`
  - `07-tablet-view.png`
  - `08-error-state.png`

- **Console Logs**:
  - Capture all console messages
  - Filter and review error messages
  - Verify no critical errors

- **Network Logs**:
  - List of all API requests
  - Response status codes
  - Response times

### Playwright Test Success Criteria
- [ ] All 8 automated tests pass
- [ ] No console errors during test execution
- [ ] All API calls return 200 status codes
- [ ] Screenshots show correct UI rendering
- [ ] Mobile/tablet views render correctly
- [ ] Error handling works as expected
- [ ] All test artifacts collected and reviewed

## Success Criteria Checklist
- [ ] All API endpoints respond correctly
- [ ] Frontend loads without errors
- [ ] Map displays all wells
- [ ] Well details modal works
- [ ] Production charts render
- [ ] Valuations display correctly
- [ ] Similar wells feature works
- [ ] AI report generation works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] All 8 Playwright MCP automated tests executed and passed
- [ ] Test artifacts reviewed and validated

## Troubleshooting Common Issues

### Map doesn't load
- Check VITE_MAPBOX_TOKEN is set
- Check browser console for Mapbox errors
- Verify internet connection (Mapbox tiles need external access)

### API calls fail
- Verify backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`
- Verify CORS settings allow localhost:5173

### AI features don't work
- Check Claude CLI is installed on host machine
- Verify backend can spawn child processes
- Check backend logs for Claude service errors

### Database issues
- Run migrations: `docker-compose exec backend npm run migrate:latest`
- Run seeds: `docker-compose exec backend npm run seed`
- Check PostgreSQL: `docker-compose exec postgres psql -U oilfield -d oilfield`

## Time Estimate
35 minutes (comprehensive manual + automated Playwright testing)
