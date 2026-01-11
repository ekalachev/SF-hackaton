# Sprint 6: Integration Testing & Debugging

## Overview
This sprint focuses on comprehensive validation of frontend-backend integration, debugging, and ensuring all features work flawlessly with extensive testing, logging, and screenshot analysis.

## Goal
Get the application fully working with zero exceptions, comprehensive test coverage, and thorough debugging infrastructure.

## Duration
~3 hours 30 minutes

## Agents
- **Backend Agent**: Logging infrastructure, API validation
- **Frontend Agent**: Debug console, logging, component validation
- **QA Agent**: Playwright automation, screenshot analysis
- **System Architect**: Performance analysis, optimization

## Sprint Scope

### Core Objectives
1. ✅ Implement comprehensive logging (frontend + backend)
2. ✅ Add visual debug console to UI
3. ✅ Validate all map rendering and interactions
4. ✅ Validate well detail modal and complete data flow
5. ✅ Validate AI features (similar wells, reports)
6. ✅ Screenshot analysis with `claude -p` mode
7. ✅ Comprehensive Playwright E2E validation
8. ✅ Performance profiling and optimization

### Success Criteria
- [ ] Zero console errors in any user journey
- [ ] All API endpoints return correct data
- [ ] All map entities render correctly
- [ ] Visual debug console shows comprehensive logs
- [ ] 100% test coverage for critical paths
- [ ] All Playwright tests pass
- [ ] Screenshot analysis confirms correct rendering
- [ ] Performance meets targets (<3s page load, <500ms interactions)
- [ ] All code committed and pushed after each success

## Tasks

### Task 601: Implement Comprehensive Logging Infrastructure (30 minutes)
**Objective**: Add structured logging to frontend and backend for debugging
- Backend: Winston logger with request/response logging
- Frontend: Console logger with categories and log levels
- Log rotation and file storage
- API request/response tracing

### Task 602: Add Visual Debug Console to Frontend (25 minutes)
**Objective**: Create on-screen debug console for real-time log viewing
- Collapsible debug panel in UI
- Log filtering by level and category
- Real-time API call monitoring
- State inspection tools

### Task 603: Validate Map Rendering and Well Markers (35 minutes)
**Objective**: Ensure all wells render correctly on map with proper data
- Validate 20+ wells load and display
- Verify color coding (green/yellow/red) based on valuation
- Test cluster behavior
- Validate marker click interactions
- Unit tests + Playwright tests

### Task 604: Validate Well Detail Modal and Data Flow (40 minutes)
**Objective**: Ensure complete data flow from backend to modal display
- Validate API → State → UI pipeline
- Test all modal sections (details, production, valuation)
- Verify charts render with correct data
- Error handling for missing/invalid data
- Unit tests + integration tests

### Task 605: Validate Similar Wells and AI Features (45 minutes)
**Objective**: Ensure AI features work end-to-end without errors
- Test semantic similarity search
- Validate AI narrative generation
- Test investment report generation
- Verify caching behavior
- Error handling for AI service failures

### Task 606: Screenshot Analysis with Claude Code -p Mode (30 minutes)
**Objective**: Use `claude -p` for visual regression testing
- Capture screenshots of all major views
- Analyze with Claude vision capabilities
- Validate UI rendering correctness
- Compare against expected designs
- Document any visual issues

### Task 607: Comprehensive Playwright E2E Validation (50 minutes)
**Objective**: Execute full Playwright test suite and fix any issues
- Run all 50 existing E2E tests
- Fix any failing tests
- Add missing test coverage
- Validate mobile/tablet responsive
- Collect and analyze test artifacts

### Task 608: Performance Profiling and Optimization (35 minutes)
**Objective**: Profile application and optimize bottlenecks
- Measure page load times
- Profile API response times
- Optimize bundle size
- Database query optimization
- Caching strategy validation

## Commit Strategy

After each task completion:
```bash
git add .
git commit -m "feat/fix(sprint-6): [task description]

[Detailed changes]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Testing Requirements

### Unit Tests
- All new logging functions
- Debug console components
- Data transformation logic
- Error handling paths

### Integration Tests
- Frontend → Backend API flows
- State management integration
- Chart rendering with data
- Modal lifecycle

### E2E Tests (Playwright)
- Complete user journeys
- Error scenarios
- Mobile responsive
- Performance tests

### Visual Tests
- Screenshot analysis with `claude -p`
- UI component rendering
- Chart visualizations
- Modal layouts

## Success Metrics

- **Test Coverage**: 100% for critical paths
- **Playwright Tests**: 50/50 passing
- **Console Errors**: 0 in production flows
- **Performance**:
  - Page load: <3s
  - API calls: <1s
  - AI report: <10s
- **Logging**: Comprehensive traces for debugging
- **Commits**: 8+ commits (one per task)

## Notes

- Focus on **fixing issues**, not just testing
- Use **visual debug console** extensively during development
- Leverage **`claude -p` screenshot analysis** for visual validation
- **Commit early and often** - after each successful fix
- Goal: **Fully working application** - spend tokens liberally to achieve perfection

## Total Tasks: 8

## References
- `sprints/sprint-5-deploy/task-503-test-production.md` - Testing procedures
- `sprints/sprint-5-deploy/task-505-playwright-e2e-automation.md` - Playwright tests
- `docs/MVP_SCOPE.md` - Success criteria
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Architecture details
