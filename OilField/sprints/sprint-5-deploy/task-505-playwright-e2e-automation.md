# Task 505: Playwright E2E Automated Testing

## References
- `sprints/sprint-5-deploy/task-503-test-production.md` - Manual and automated testing procedures
- `docs/MVP_SCOPE.md` - Section "Success Criteria" lines 579-607
- Microsoft Playwright MCP Documentation

## Objective
Execute comprehensive end-to-end automated testing using Microsoft Playwright MCP server to verify all application features work correctly in the deployed environment.

## Prerequisites
- [ ] All Docker containers running (postgres, backend, frontend or dev server)
- [ ] Frontend accessible at http://localhost:5173 (dev) or http://localhost:8080 (production)
- [ ] Backend API responding at http://localhost:3001
- [ ] Database seeded with test data (at least 20 wells)
- [ ] Playwright MCP server available in Claude Code environment
- [ ] Claude Code CLI tool installed and configured

## Acceptance Criteria
- [ ] All 8 automated E2E tests executed successfully
- [ ] No console errors captured during test execution
- [ ] All API network requests return 200 status codes
- [ ] Screenshots captured for all test scenarios
- [ ] Test artifacts organized and saved
- [ ] Test execution report generated
- [ ] Mobile and tablet responsive tests pass
- [ ] Error handling scenarios verified

## Test Suite Overview

This task executes 8 comprehensive end-to-end tests using Playwright MCP:

1. **Initial Page Load and Map Rendering** - Verify map loads with well markers
2. **Well Selection and Modal Display** - Verify clicking wells opens detail modal
3. **Valuation Cards Display** - Verify NPV, IRR, and Payback cards render correctly
4. **Similar Wells Feature** - Verify AI-powered similar wells functionality
5. **AI Report Generation** - Verify investment report generation works
6. **Mobile Responsiveness** - Verify UI adapts to mobile/tablet viewports
7. **Error Handling** - Verify graceful handling of backend failures
8. **Network Request Verification** - Verify all API calls succeed

## Execution Instructions

### Setup Phase

1. **Verify Environment**
```bash
# Check all containers running
docker-compose ps

# Verify backend responding
curl http://localhost:3001/health

# Verify frontend accessible
curl -I http://localhost:5173

# Verify database seeded
docker-compose exec postgres psql -U oilfield -d oilfield -c "SELECT COUNT(*) FROM wells;"
# Should return 20+
```

2. **Create Test Artifacts Directory**
```bash
mkdir -p tests/e2e/playwright-artifacts
mkdir -p tests/e2e/playwright-artifacts/screenshots
mkdir -p tests/e2e/playwright-artifacts/logs
```

3. **Install Playwright (if needed)**
Use Playwright MCP tool `mcp__playwright__browser_install` if browser not installed.

### Test Execution Phase

Execute tests using Claude Code with Playwright MCP server. For each test:

#### Test 1: Initial Page Load and Map Rendering

**Objective**: Verify the map loads correctly with well markers

**Execution Steps**:
```
1. Use mcp__playwright__browser_navigate to open http://localhost:5173
2. Use mcp__playwright__browser_wait_for to wait for map container (time: 3)
3. Use mcp__playwright__browser_snapshot to capture page structure
4. Use mcp__playwright__browser_console_messages to check for errors
5. Use mcp__playwright__browser_take_screenshot with filename "01-initial-page-load.png"
6. Use mcp__playwright__browser_network_requests to verify /api/wells called successfully
```

**Success Criteria**:
- Page snapshot shows map container element
- No console errors
- Network request to /api/wells returns 200
- Screenshot shows map with well markers

---

#### Test 2: Well Selection and Modal Display

**Objective**: Verify clicking a well marker opens the detail modal

**Execution Steps**:
```
1. Ensure on http://localhost:5173 (from Test 1)
2. Use mcp__playwright__browser_wait_for to wait for map (time: 2)
3. Use mcp__playwright__browser_snapshot to find well markers
4. Use mcp__playwright__browser_click to click first well marker
   - element: "first well marker on map"
   - ref: [from snapshot]
5. Use mcp__playwright__browser_wait_for to wait for modal (text: "API")
6. Use mcp__playwright__browser_snapshot to verify modal structure
7. Use mcp__playwright__browser_take_screenshot with filename "02-well-modal-open.png"
8. Use mcp__playwright__browser_console_messages to check for errors
```

**Success Criteria**:
- Modal appears after clicking well marker
- Modal contains well name, API number, location data
- Production chart element visible in snapshot
- No console errors

---

#### Test 3: Valuation Cards Display

**Objective**: Verify valuation data cards render correctly

**Execution Steps**:
```
1. Modal should be open from Test 2
2. Use mcp__playwright__browser_snapshot to identify valuation cards
3. Verify snapshot shows:
   - NPV card with dollar amount
   - IRR card with percentage
   - Payback Period card with months
4. Use mcp__playwright__browser_take_screenshot with filename "03-valuation-cards.png"
```

**Success Criteria**:
- All three valuation cards visible in snapshot
- Values properly formatted (currency, percentage, time)
- Screenshot clearly shows all cards

---

#### Test 4: Similar Wells Feature

**Objective**: Verify "Find Similar Wells" functionality

**Execution Steps**:
```
1. Modal should be open from previous tests
2. Use mcp__playwright__browser_snapshot to find "Find Similar" button
3. Use mcp__playwright__browser_click to click button
   - element: "Find Similar Wells button"
   - ref: [from snapshot]
4. Use mcp__playwright__browser_wait_for to wait for loading (time: 2)
5. Use mcp__playwright__browser_wait_for to wait for similar wells panel (text: "match")
6. Use mcp__playwright__browser_snapshot to verify panel structure
7. Verify snapshot shows:
   - Similar wells listed (up to 5)
   - Similarity scores (percentage)
   - AI-generated match reasons
   - Emerald color theme
8. Use mcp__playwright__browser_take_screenshot with filename "04-similar-wells-panel.png"
9. Use mcp__playwright__browser_console_messages to check for errors
```

**Success Criteria**:
- Similar wells panel appears
- Up to 5 wells listed
- Similarity percentages visible
- Match reasons displayed
- Emerald theme applied
- No console errors

---

#### Test 5: AI Report Generation

**Objective**: Verify AI investment report generation works

**Execution Steps**:
```
1. Modal should be open from previous tests
2. Use mcp__playwright__browser_snapshot to find "Generate AI Investment Report" button
3. Use mcp__playwright__browser_click to click button
   - element: "Generate AI Investment Report button"
   - ref: [from snapshot]
4. Use mcp__playwright__browser_wait_for to wait for loading indicator (time: 1)
5. Use mcp__playwright__browser_wait_for to wait for report (text: "Executive Summary", time: 12)
6. Use mcp__playwright__browser_snapshot to verify report structure
7. Verify snapshot contains report sections:
   - Executive Summary
   - Well Overview
   - Production Analysis
   - Economic Valuation
   - Investment Recommendation
   - Risk Factors
8. Use mcp__playwright__browser_take_screenshot with filename "05-ai-report.png"
9. Use mcp__playwright__browser_console_messages to check for errors
```

**Success Criteria**:
- Report generates within 10 seconds
- All required sections present
- Markdown formatting rendered correctly
- No console errors during generation

---

#### Test 6: Mobile Responsiveness

**Objective**: Verify UI adapts correctly to mobile and tablet viewports

**Execution Steps**:
```
1. Use mcp__playwright__browser_close to close current page
2. Use mcp__playwright__browser_resize to set iPhone 12 Pro dimensions
   - width: 390
   - height: 844
3. Use mcp__playwright__browser_navigate to open http://localhost:5173
4. Use mcp__playwright__browser_wait_for to wait for map (time: 3)
5. Use mcp__playwright__browser_snapshot to verify mobile layout
6. Use mcp__playwright__browser_take_screenshot with filename "06-mobile-view.png"
7. Use mcp__playwright__browser_click to click a well marker
8. Verify modal adapts to mobile screen
9. Use mcp__playwright__browser_resize to set iPad dimensions
   - width: 810
   - height: 1080
10. Use mcp__playwright__browser_take_screenshot with filename "07-tablet-view.png"
11. Use mcp__playwright__browser_snapshot to verify tablet layout
```

**Success Criteria**:
- UI adapts to mobile viewport (390x844)
- All features accessible on mobile
- Modal displays correctly on small screen
- UI adapts to tablet viewport (810x1080)
- No horizontal scrolling

---

#### Test 7: Error Handling

**Objective**: Verify application handles backend errors gracefully

**Execution Steps**:
```
1. Use mcp__playwright__browser_resize to restore desktop size
   - width: 1920
   - height: 1080
2. Use mcp__playwright__browser_navigate to open http://localhost:5173
3. Use mcp__playwright__browser_wait_for to wait for map (time: 3)
4. PAUSE TEST - Run in terminal: docker-compose stop backend
5. Use mcp__playwright__browser_click to click a well marker
6. Use mcp__playwright__browser_wait_for to wait for error message (time: 3)
7. Use mcp__playwright__browser_snapshot to verify error state
8. Use mcp__playwright__browser_take_screenshot with filename "08-error-state.png"
9. Use mcp__playwright__browser_console_messages to check errors
10. PAUSE TEST - Run in terminal: docker-compose start backend
11. Use mcp__playwright__browser_wait_for to wait for backend startup (time: 5)
12. Use mcp__playwright__browser_navigate to reload page
13. Use mcp__playwright__browser_wait_for to wait for map (time: 3)
14. Verify app recovers and works correctly
```

**Success Criteria**:
- Error message displayed when backend unavailable
- App doesn't crash completely
- App recovers after backend restarts
- No unhandled errors in console

---

#### Test 8: Network Request Verification

**Objective**: Verify all API calls succeed with correct status codes

**Execution Steps**:
```
1. Use mcp__playwright__browser_navigate to open http://localhost:5173
2. Use mcp__playwright__browser_wait_for to wait for initial load (time: 3)
3. Use mcp__playwright__browser_network_requests to capture initial requests
   - Verify GET /api/wells → 200
4. Use mcp__playwright__browser_click to click a well marker
5. Use mcp__playwright__browser_wait_for to wait for modal (time: 2)
6. Use mcp__playwright__browser_network_requests to capture well detail requests
   - Verify GET /api/wells/:id → 200
   - Verify GET /api/wells/:id/valuation → 200
7. Use mcp__playwright__browser_click to click "Find Similar Wells"
8. Use mcp__playwright__browser_wait_for to wait for similar wells (time: 2)
9. Use mcp__playwright__browser_network_requests to capture similarity requests
   - Verify GET /api/wells/:id/similar → 200
   - Verify GET /api/wells/:id/narrative → 200
10. Use mcp__playwright__browser_click to click "Generate AI Report"
11. Use mcp__playwright__browser_wait_for to wait for report (time: 10)
12. Use mcp__playwright__browser_network_requests to capture report requests
   - Verify POST /api/wells/:id/generate-report → 200
```

**Success Criteria**:
- All API endpoints return 200 status codes
- No failed network requests
- Response times are reasonable (<3s for most calls)
- All expected API calls made in correct sequence

---

### Verification Phase

After executing all tests:

1. **Review Screenshots**
```bash
ls -la tests/e2e/playwright-artifacts/screenshots/
# Should contain 8 screenshots:
# - 01-initial-page-load.png
# - 02-well-modal-open.png
# - 03-valuation-cards.png
# - 04-similar-wells-panel.png
# - 05-ai-report.png
# - 06-mobile-view.png
# - 07-tablet-view.png
# - 08-error-state.png
```

2. **Review Console Logs**
- Check all captured console messages
- Verify no critical errors
- Document any warnings

3. **Review Network Logs**
- Verify all API calls successful
- Check response times
- Confirm expected API call sequence

4. **Generate Test Report**
Create `tests/e2e/playwright-artifacts/TEST_REPORT.md`:
```markdown
# Playwright E2E Test Execution Report

**Date**: [execution date]
**Environment**: Local Docker deployment
**Frontend URL**: http://localhost:5173
**Backend URL**: http://localhost:3001

## Test Results Summary

- Total Tests: 8
- Passed: [count]
- Failed: [count]
- Skipped: [count]

## Individual Test Results

### Test 1: Initial Page Load and Map Rendering
- Status: [PASS/FAIL]
- Duration: [time]
- Issues: [none or list]
- Screenshot: 01-initial-page-load.png

### Test 2: Well Selection and Modal Display
- Status: [PASS/FAIL]
- Duration: [time]
- Issues: [none or list]
- Screenshot: 02-well-modal-open.png

[... continue for all tests ...]

## Console Errors
[list any console errors or "None"]

## Network Issues
[list any network failures or "All requests successful"]

## Recommendations
[any recommendations for improvements]
```

### Cleanup Phase

```bash
# Close browser
# Use mcp__playwright__browser_close

# Organize artifacts
cd tests/e2e/playwright-artifacts
ls -R

# Commit test results if needed
git add tests/e2e/playwright-artifacts/
git commit -m "test: Add Playwright E2E test execution results"
```

## Test Execution Checklist

### Pre-Execution
- [ ] All Docker containers running and healthy
- [ ] Database seeded with test data
- [ ] Test artifacts directory created
- [ ] Playwright browser installed

### During Execution
- [ ] Test 1: Initial Page Load - Executed
- [ ] Test 2: Well Modal - Executed
- [ ] Test 3: Valuation Cards - Executed
- [ ] Test 4: Similar Wells - Executed
- [ ] Test 5: AI Report - Executed
- [ ] Test 6: Mobile Responsive - Executed
- [ ] Test 7: Error Handling - Executed
- [ ] Test 8: Network Requests - Executed

### Post-Execution
- [ ] All screenshots captured and reviewed
- [ ] Console logs reviewed for errors
- [ ] Network logs verified
- [ ] Test report generated
- [ ] Artifacts committed to repository

## Success Criteria

- [ ] All 8 tests executed without errors
- [ ] All API calls return 200 status codes
- [ ] No critical console errors
- [ ] Screenshots show correct UI rendering
- [ ] Mobile and tablet views pass
- [ ] Error handling works as expected
- [ ] Test artifacts organized and saved
- [ ] Test report complete and accurate

## Expected Outcomes

1. **Comprehensive Verification**: All major application features tested automatically
2. **Visual Proof**: Screenshots demonstrate correct rendering across viewports
3. **Error Detection**: Console and network logs capture any issues
4. **Reproducibility**: Tests can be re-run to verify fixes
5. **Documentation**: Test report provides clear evidence of functionality

## Troubleshooting

### Playwright MCP Not Available
- Ensure Claude Code CLI is up to date
- Check MCP server configuration
- Verify Playwright MCP server is enabled

### Browser Installation Fails
- Use `mcp__playwright__browser_install` tool
- Check internet connection
- Verify sufficient disk space

### Tests Timing Out
- Increase wait times in browser_wait_for calls
- Check if containers are running slowly
- Verify network connectivity

### Screenshots Not Saving
- Verify tests/e2e/playwright-artifacts/screenshots/ directory exists
- Check file permissions
- Use relative paths from project root

### Backend Errors During Testing
- Check backend logs: `docker-compose logs backend`
- Verify database is seeded
- Restart backend: `docker-compose restart backend`

## Time Estimate
45 minutes (setup + execution + verification + reporting)

## Notes
- This task should be executed by Claude Code with access to Playwright MCP server
- All test steps are designed to be executed programmatically
- Manual intervention only needed for docker-compose commands in Test 7
- Test artifacts should be committed to repository for historical tracking
