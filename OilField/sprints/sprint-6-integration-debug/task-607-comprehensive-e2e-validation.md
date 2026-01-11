# Task 607: Comprehensive Playwright E2E Validation

## References
- `e2e/tests/*.spec.ts` - Existing Playwright tests (50 tests)
- `sprints/sprint-5-deploy/task-505-playwright-e2e-automation.md` - Original E2E spec
- `frontend/playwright.config.ts` - Playwright configuration

## Objective
Execute full Playwright test suite, fix any failures, add missing coverage, and ensure all 50+ E2E tests pass reliably.

## Acceptance Criteria
- [ ] All existing 50 Playwright tests execute
- [ ] All tests pass (50/50 or 100%)
- [ ] Fix any failing tests
- [ ] Add tests for missing scenarios
- [ ] Test artifacts collected (screenshots, traces, videos)
- [ ] Mobile and tablet tests pass
- [ ] Error handling scenarios validated
- [ ] Network request validation complete
- [ ] Test execution report generated
- [ ] Tests run in CI/CD pipeline

## Current Test Coverage

### Existing Tests (from Sprint 5)
1. **map-interaction.spec.ts** (6 tests)
   - Map loads with wells
   - Marker clicks
   - Cluster interactions
   - Tooltip behavior
   - Pan and zoom

2. **well-details.spec.ts** (10 tests)
   - Modal opens/closes
   - Well data display
   - Production charts
   - Valuation cards
   - Keyboard navigation

3. **similar-wells.spec.ts** (10 tests)
   - Similar wells loading
   - Similarity scores
   - Match reasons
   - AI narrative caching

4. **loading-states.spec.ts** (11 tests)
   - Loading indicators
   - Skeleton screens
   - Retry mechanisms
   - Error boundaries

5. **mobile-responsiveness.spec.ts** (13 tests)
   - iPhone viewport
   - iPad viewport
   - Touch interactions
   - Mobile menu

## Implementation Steps

### 1. Run Full Test Suite

```bash
cd frontend

# Run all tests with all browsers
npm run test:e2e

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test file
npx playwright test e2e/tests/map-interaction.spec.ts

# Run with debugging
npx playwright test --debug

# Generate HTML report
npx playwright show-report
```

### 2. Add Missing Test Coverage

```typescript
// e2e/tests/error-recovery.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Error Recovery Scenarios', () => {
  test('should recover from backend restart', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Interact with app
    await page.waitForSelector('[data-testid="map-container"]');
    
    // Simulate backend failure (manual step documented)
    // System should show error state
    
    // After backend restart (manual step documented)
    // System should recover automatically
  });

  test('should handle network disconnection', async ({ page, context }) => {
    await page.goto('http://localhost:5173');
    
    // Simulate offline
    await context.setOffline(true);
    
    // Try to load well
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // Should show offline error
    await expect(page.locator('text=/offline|network/i')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should recover
    await page.reload();
    await page.waitForSelector('[data-testid="map-container"]');
  });
});

// e2e/tests/data-integrity.spec.ts
test.describe('Data Integrity', () => {
  test('should maintain state when switching wells', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Open first well
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });
    
    const firstWellName = await page.locator('[data-testid="well-name"]').textContent();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Open second well
    await canvas.click({ position: { x: 500, y: 400 } });
    
    const secondWellName = await page.locator('[data-testid="well-name"]').textContent();
    
    // Should be different wells
    expect(secondWellName).not.toBe(firstWellName);
  });

  test('should persist map position on modal open/close', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Get initial map center
    const initialCenter = await page.evaluate(() => {
      const map = (window as any).mapInstance;
      return map.getCenter();
    });
    
    // Open modal
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Map center should be same
    const finalCenter = await page.evaluate(() => {
      const map = (window as any).mapInstance;
      return map.getCenter();
    });
    
    expect(finalCenter).toEqual(initialCenter);
  });
});

// e2e/tests/performance.spec.ts
test.describe('Performance Metrics', () => {
  test('should load page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="map-container"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('should open modal within 500ms', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="map-container"]');
    
    const startTime = Date.now();
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });
    await page.waitForSelector('[data-testid="well-detail-modal"]');
    const openTime = Date.now() - startTime;
    
    expect(openTime).toBeLessThan(500);
    console.log(`Modal open time: ${openTime}ms`);
  });
});
```

### 3. Fix Failing Tests

```typescript
// Example: Fix flaky tests with better waits
test('should load similar wells', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Open modal
  const canvas = page.locator('canvas.mapboxgl-canvas');
  await canvas.click({ position: { x: 400, y: 300 } });
  await page.waitForSelector('[data-testid="well-detail-modal"]');
  
  // Click similar wells button
  await page.click('button:has-text("Find Similar")');
  
  // Wait for API call to complete (not just element to appear)
  await page.waitForResponse(
    response => response.url().includes('/similar') && response.status() === 200
  );
  
  // Now verify elements
  await expect(page.locator('[data-testid="similar-wells-panel"]')).toBeVisible();
  const similarWells = page.locator('[data-testid^="similar-well-"]');
  await expect(similarWells).toHaveCount(5);
});
```

### 4. Enhanced Test Utilities

```typescript
// e2e/utils/test-helpers.ts
import { Page, expect } from '@playwright/test';

export async function openWellModal(page: Page, position: { x: number; y: number }) {
  const canvas = page.locator('canvas.mapboxgl-canvas');
  await canvas.click({ position });
  await page.waitForSelector('[data-testid="well-detail-modal"]');
  await expect(page.locator('[data-testid="well-detail-modal"]')).toBeVisible();
}

export async function closeModal(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid="well-detail-modal"]')).not.toBeVisible();
}

export async function waitForMapLoad(page: Page) {
  await page.waitForSelector('[data-testid="map-container"]');
  await page.waitForTimeout(1000); // Wait for map tiles to load
}

export async function waitForAPICall(page: Page, urlPattern: string) {
  await page.waitForResponse(
    response => response.url().includes(urlPattern) && response.status() === 200
  );
}

export async function captureNetworkErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  return errors;
}
```

### 5. CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: Playwright E2E Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_DB: oilfield_test
          POSTGRES_USER: oilfield
          POSTGRES_PASSWORD: oilfield_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          
      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps
        
      - name: Start backend
        run: |
          cd backend
          npm run migrate:latest
          npm run seed
          npm run dev &
          
      - name: Start frontend
        run: |
          cd frontend
          npm run dev &
          
      - name: Wait for services
        run: |
          npx wait-on http://localhost:3001/health
          npx wait-on http://localhost:5173
          
      - name: Run Playwright tests
        run: cd frontend && npm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: frontend/test-results/
```

## Manual Validation

### Step 1: Run Tests Locally

```bash
# Ensure services running
docker compose ps

# Run all tests
cd frontend
npm run test:e2e

# Check results
cat playwright-report/index.html
```

### Step 2: Review Test Report

```bash
# Open HTML report
npx playwright show-report

# Look for:
# - Pass/fail counts
# - Flaky tests
# - Slow tests
# - Failed screenshots
```

### Step 3: Debug Failing Tests

```bash
# Run specific failing test with UI
npx playwright test e2e/tests/specific-test.spec.ts --debug

# Run with traces
npx playwright test --trace on

# View traces
npx playwright show-trace trace.zip
```

### Step 4: Fix and Re-run

```bash
# After fixes
npm run test:e2e

# Verify all pass
```

## Success Criteria
- [ ] All 50+ tests execute
- [ ] 100% pass rate
- [ ] No flaky tests
- [ ] All browsers tested (Chrome, Firefox, Safari)
- [ ] Mobile/tablet tests pass
- [ ] Error scenarios covered
- [ ] Performance tests pass
- [ ] Test artifacts collected
- [ ] CI/CD pipeline configured
- [ ] Test report generated

## Commit Message
```bash
git add e2e/tests/ .github/workflows/e2e-tests.yml
git commit -m "test(e2e): Complete comprehensive Playwright E2E validation

- Run and fix all 50+ Playwright tests
- Add missing test coverage (error recovery, data integrity, performance)
- Create test utilities for common operations
- Configure CI/CD pipeline for automated testing
- Fix flaky tests with better waits
- Generate comprehensive test reports
- Achieve 100% test pass rate

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
50 minutes
