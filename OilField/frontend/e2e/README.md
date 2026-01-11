# E2E Testing Documentation

## Overview

Comprehensive end-to-end testing infrastructure for the OilField application using Playwright.

## Test Structure

```
e2e/
├── tests/              # Test suites
│   ├── map-interaction.spec.ts
│   ├── well-details.spec.ts
│   ├── similar-wells.spec.ts
│   ├── loading-states.spec.ts
│   └── mobile-responsiveness.spec.ts
├── pages/              # Page Object Models
│   ├── MapPage.ts
│   ├── WellDetailModalPage.ts
│   └── SimilarWellsPage.ts
├── fixtures/           # Test data and fixtures
│   └── test-data.ts
└── README.md          # This file
```

## Running Tests

### All Tests (All Browsers)
```bash
npm run test:e2e
```

### Specific Browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Mobile Tests
```bash
npm run test:e2e:mobile
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (Watch Browser)
```bash
npm run test:e2e:headed
```

### View Test Report
```bash
npm run test:e2e:report
```

### Run All Tests (Unit + E2E)
```bash
npm run test:all
```

## Test Suites

### 1. Map Interaction Tests
**File:** `tests/map-interaction.spec.ts`

Tests user interactions with the map:
- Map loading and rendering
- Well markers display
- Click interactions on markers
- Map pan and zoom functionality
- Hover states
- Empty area clicks

### 2. Well Details Tests
**File:** `tests/well-details.spec.ts`

Tests the well detail modal:
- Modal opening and loading states
- All sections rendering (name, status, valuation, production)
- Closing modal (X button and ESC key)
- Valuation metrics display
- Production chart rendering
- Scrolling within modal
- Data formatting

### 3. Similar Wells Tests
**File:** `tests/similar-wells.spec.ts`

Tests AI-powered similar wells functionality:
- Similar wells panel visibility
- Loading states
- Similarity scores display
- Match reasons display
- Clickable well items
- Keyboard navigation
- AI-Powered badge

### 4. Loading States Tests
**File:** `tests/loading-states.spec.ts`

Tests data loading, error, and empty states:
- Loading indicators
- Error messages
- Empty states
- Network error handling
- Slow network simulation
- Retry functionality

### 5. Mobile Responsiveness Tests
**File:** `tests/mobile-responsiveness.spec.ts`

Tests responsive design:
- Mobile viewport (iPhone)
- Tablet viewport (iPad)
- Touch interactions
- Mobile-friendly modal
- Responsive layouts
- Pinch-to-zoom
- Swipe gestures

## Page Object Models

### MapPage
Encapsulates map view interactions:
- `goto()` - Navigate to map
- `waitForMapLoad()` - Wait for map initialization
- `isMapVisible()` - Check map visibility
- `clickMapPoint(x, y)` - Click specific coordinates
- `waitForWellMarkers()` - Wait for markers to load

### WellDetailModalPage
Encapsulates modal interactions:
- `waitForModal()` - Wait for modal to appear
- `isVisible()` - Check modal visibility
- `isLoading()` - Check loading state
- `hasError()` - Check error state
- `getWellName()` - Get well name text
- `closeWithButton()` - Close using X button
- `closeWithEsc()` - Close using ESC key

### SimilarWellsPage
Encapsulates similar wells panel:
- `waitForPanel()` - Wait for panel to load
- `isVisible()` - Check panel visibility
- `getSimilarWell(id)` - Get specific well element
- `clickSimilarWell(id)` - Click on a similar well
- `getSimilarityScore(id)` - Get similarity score
- `getMatchReasons(id)` - Get match reasons

## Test Data

Test fixtures in `fixtures/test-data.ts`:
- Mock well data
- Production history data
- Similar wells data
- API endpoint constants
- Viewport configurations
- Timeout constants

## CI/CD Integration

Tests are configured to run in CI/CD with:
- Automatic retries on failure (2 retries)
- HTML report generation
- Screenshots on failure
- Video recording on failure
- Parallel execution disabled in CI

## Best Practices

### ✅ DO
- Use Page Object Models for reusability
- Use `data-testid` attributes for reliable selectors
- Use proper waits (`waitForSelector`, not timeouts when possible)
- Test real user workflows
- Keep tests independent
- Use meaningful test descriptions
- Follow TDD principles

### ❌ DON'T
- Use hard-coded delays (minimize `waitForTimeout`)
- Test implementation details
- Create test dependencies
- Use fragile CSS selectors when possible
- Skip error states
- Ignore mobile viewports

## Architecture Principles

Following SOLID principles:
- **Single Responsibility:** Each Page Object handles one component
- **Open/Closed:** Tests extensible via Page Objects
- **Dependency Inversion:** Tests depend on Page Object abstractions

Following DRY principle:
- Shared test data in fixtures
- Reusable Page Objects
- Common utilities

Following KISS principle:
- Simple, readable tests
- Clear test descriptions
- Minimal complexity

## Troubleshooting

### Tests Failing Locally
1. Ensure dev server is running: `npm run dev`
2. Check if port 5173 is available
3. Install browsers: `npx playwright install`

### Tests Timing Out
1. Increase timeout in `playwright.config.ts`
2. Check network conditions
3. Verify dev server is responsive

### Flaky Tests
1. Use proper waits instead of timeouts
2. Ensure test independence
3. Check for race conditions
4. Verify data-testid attributes exist

### Screenshots Not Captured
1. Check `playwright-report` directory
2. Verify `screenshot` config in playwright.config.ts
3. Ensure test actually failed

## Future Enhancements

Potential improvements:
- API mocking with MSW for deterministic tests
- Visual regression testing
- Accessibility testing
- Performance testing
- Code coverage from E2E tests
- Parallel test execution optimization
- Custom reporters
- Test data generators
- Component interaction recordings

## Support

For issues or questions:
1. Check this documentation
2. Review Playwright docs: https://playwright.dev
3. Check test comments for context
4. Review Page Object implementations
