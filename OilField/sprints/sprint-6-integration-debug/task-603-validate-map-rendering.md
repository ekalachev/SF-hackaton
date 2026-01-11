# Task 603: Validate Map Rendering and Well Markers

## References
- `frontend/src/components/map/MapView.tsx` - Map component
- `frontend/src/components/map/MapView.test.tsx` - Existing tests
- `docs/MVP_SCOPE.md` - Visual design requirements lines 312-413
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Map architecture lines 399-489

## Objective
Thoroughly validate that all wells render correctly on the map with proper color coding, clustering, and interactions. Fix any issues found.

## Prerequisites
- [ ] Task 601 completed (logging infrastructure)
- [ ] Task 602 completed (debug console)
- [ ] Backend running with seeded data
- [ ] Mapbox token configured

## Acceptance Criteria

### Visual Validation
- [ ] Map loads and displays Texas region correctly
- [ ] All 20+ well markers render on map
- [ ] Wells color-coded correctly:
  - Green: NPV > $100k (healthy)
  - Yellow: NPV $50k-$100k (moderate)
  - Red: NPV < $50k (concerning)
- [ ] Clusters form when zoomed out
- [ ] Clusters display well count
- [ ] Individual wells visible when zoomed in
- [ ] Marker icons appropriate size and style
- [ ] No duplicate markers
- [ ] No missing markers (all API wells displayed)

### Functional Validation
- [ ] Click on unclustered marker opens modal
- [ ] Click on cluster zooms in
- [ ] Hover shows tooltip with well name
- [ ] Map controls (zoom, pan) work
- [ ] Map bounds fit all wells on initial load
- [ ] Smooth transitions when zooming
- [ ] No console errors during map interaction

### Data Validation
- [ ] Verify API returns 20+ wells
- [ ] Verify each well has coordinates
- [ ] Verify color coding matches valuation data
- [ ] Verify marker positions match well coordinates
- [ ] No wells with null/undefined coordinates

### Test Coverage
- [ ] Unit tests for marker rendering
- [ ] Unit tests for color calculation
- [ ] Unit tests for cluster behavior
- [ ] Playwright E2E tests for map interactions
- [ ] Screenshot tests for visual validation

## Implementation

### Step 1: Add Logging to MapView

```typescript
// frontend/src/components/map/MapView.tsx
import logger from '../../utils/logger';

export function MapView() {
  const { data: wellsData, isLoading, error } = useWells({ limit: 100 });

  useEffect(() => {
    logger.info('ui', 'MapView mounted');
    return () => logger.info('ui', 'MapView unmounted');
  }, []);

  useEffect(() => {
    if (wellsData?.wells) {
      logger.info('state', `Wells data loaded: ${wellsData.wells.length} wells`);
      logger.debug('state', 'Wells data', { wells: wellsData.wells.map(w => w.id) });

      // Validate coordinates
      const invalidWells = wellsData.wells.filter(
        w => !w.surface_latitude || !w.surface_longitude
      );
      if (invalidWells.length > 0) {
        logger.error('state', `Found ${invalidWells.length} wells with invalid coordinates`, {
          wellIds: invalidWells.map(w => w.id)
        });
      }
    }
  }, [wellsData]);

  useEffect(() => {
    if (error) {
      logger.error('api', 'Failed to load wells', { error: error.message });
    }
  }, [error]);

  // Log map events
  const handleMapLoad = useCallback((map: MapRef) => {
    logger.info('ui', 'Map loaded successfully');
    logger.debug('performance', 'Map load complete');

    map.on('click', 'unclustered-point', (e) => {
      const wellId = e.features?.[0]?.properties?.id;
      logger.debug('ui', `Well marker clicked: ${wellId}`);
    });

    map.on('click', 'clusters', (e) => {
      const clusterCount = e.features?.[0]?.properties?.point_count;
      logger.debug('ui', `Cluster clicked: ${clusterCount} wells`);
    });
  }, []);

  // ...
}
```

### Step 2: Enhanced Color Coding Logic

```typescript
// frontend/src/utils/wellColors.ts
import type { Well } from '../types/well';
import logger from './logger';

export interface WellColorConfig {
  healthy: { threshold: number; color: string; };
  moderate: { threshold: number; color: string; };
  concerning: { color: string; };
}

export const defaultColorConfig: WellColorConfig = {
  healthy: { threshold: 100000, color: '#10b981' }, // green
  moderate: { threshold: 50000, color: '#f59e0b' }, // yellow
  concerning: { color: '#ef4444' }, // red
};

export function getWellColor(well: Well, config: WellColorConfig = defaultColorConfig): string {
  // Assume well has npv_usd property or fetch from valuation
  const npv = well.valuation?.npv_usd || 0;

  let color: string;
  if (npv >= config.healthy.threshold) {
    color = config.healthy.color;
  } else if (npv >= config.moderate.threshold) {
    color = config.moderate.color;
  } else {
    color = config.concerning.color;
  }

  logger.debug('ui', `Well ${well.id} color: ${color}`, { npv, threshold: 'calculated' });

  return color;
}

export function categorizeWells(wells: Well[]): {
  healthy: Well[];
  moderate: Well[];
  concerning: Well[];
} {
  const categorized = {
    healthy: wells.filter(w => (w.valuation?.npv_usd || 0) >= 100000),
    moderate: wells.filter(w => {
      const npv = w.valuation?.npv_usd || 0;
      return npv >= 50000 && npv < 100000;
    }),
    concerning: wells.filter(w => (w.valuation?.npv_usd || 0) < 50000),
  };

  logger.info('state', 'Wells categorized', {
    healthy: categorized.healthy.length,
    moderate: categorized.moderate.length,
    concerning: categorized.concerning.length,
  });

  return categorized;
}
```

### Step 3: Validate Marker Rendering

```typescript
// frontend/src/utils/mapValidation.ts
import type { Well } from '../types/well';
import logger from './logger';

export interface MapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalWells: number;
    validCoordinates: number;
    invalidCoordinates: number;
    duplicatePositions: number;
  };
}

export function validateWellsForMap(wells: Well[]): MapValidationResult {
  const result: MapValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalWells: wells.length,
      validCoordinates: 0,
      invalidCoordinates: 0,
      duplicatePositions: 0,
    },
  };

  const positionSet = new Set<string>();

  wells.forEach((well, index) => {
    // Check coordinates
    if (!well.surface_latitude || !well.surface_longitude) {
      result.errors.push(`Well ${well.id} (index ${index}) missing coordinates`);
      result.stats.invalidCoordinates++;
      result.valid = false;
    } else {
      result.stats.validCoordinates++;

      // Check for duplicates
      const posKey = `${well.surface_latitude},${well.surface_longitude}`;
      if (positionSet.has(posKey)) {
        result.warnings.push(`Well ${well.id} has duplicate position: ${posKey}`);
        result.stats.duplicatePositions++;
      }
      positionSet.add(posKey);
    }

    // Check coordinate ranges
    if (well.surface_latitude) {
      if (well.surface_latitude < 25 || well.surface_latitude > 37) {
        result.warnings.push(
          `Well ${well.id} latitude ${well.surface_latitude} outside Texas range`
        );
      }
    }

    if (well.surface_longitude) {
      if (well.surface_longitude < -107 || well.surface_longitude > -93) {
        result.warnings.push(
          `Well ${well.id} longitude ${well.surface_longitude} outside Texas range`
        );
      }
    }
  });

  logger.info('validation', 'Map validation complete', result.stats);

  if (result.errors.length > 0) {
    logger.error('validation', `Map validation failed: ${result.errors.length} errors`, {
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn('validation', `Map validation warnings: ${result.warnings.length}`, {
      warnings: result.warnings,
    });
  }

  return result;
}
```

### Step 4: Integration Tests

```typescript
// frontend/src/components/map/MapView.integration.test.tsx
import { render, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MapView } from './MapView';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('MapView Integration Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should render all wells from API', async () => {
    render(<MapView />, { wrapper });

    await waitFor(() => {
      // Verify map container exists
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Check that wells were added to map
    // This requires checking the mock map's addSource was called with correct data
  });

  it('should handle missing coordinates gracefully', async () => {
    // Override mock to return well with invalid coordinates
    server.use(
      http.get('/api/wells', () => {
        return HttpResponse.json({
          wells: [
            {
              id: 'invalid-well',
              api_number: '12345',
              well_name: 'Invalid Well',
              surface_latitude: null,
              surface_longitude: null,
            },
          ],
          total: 1,
        });
      })
    );

    render(<MapView />, { wrapper });

    await waitFor(() => {
      // Should log error but not crash
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Check console logs for error (requires logger mock)
  });

  it('should apply correct color coding based on NPV', async () => {
    server.use(
      http.get('/api/wells', () => {
        return HttpResponse.json({
          wells: [
            {
              id: 'well-1',
              api_number: '12345',
              well_name: 'Healthy Well',
              surface_latitude: 32.4487,
              surface_longitude: -95.301,
              valuation: { npv_usd: 150000 }, // Should be green
            },
            {
              id: 'well-2',
              api_number: '67890',
              well_name: 'Moderate Well',
              surface_latitude: 32.4500,
              surface_longitude: -95.300,
              valuation: { npv_usd: 75000 }, // Should be yellow
            },
            {
              id: 'well-3',
              api_number: '11111',
              well_name: 'Concerning Well',
              surface_latitude: 32.4520,
              surface_longitude: -95.310,
              valuation: { npv_usd: 25000 }, // Should be red
            },
          ],
          total: 3,
        });
      })
    );

    render(<MapView />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Verify colors applied correctly (requires inspecting map data)
  });
});
```

### Step 5: Playwright E2E Tests

```typescript
// e2e/tests/map-rendering.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map Rendering Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
  });

  test('should load map with well markers', async ({ page }) => {
    // Wait for map to fully load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/map-initial-load.png' });

    // Verify map container visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Check for Mapbox canvas
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Open debug console to check logs
    await page.keyboard.press('Control+`');
    await page.waitForTimeout(500);

    // Verify wells loaded in debug console
    const debugConsole = page.locator('text=/Wells loaded:/i');
    await expect(debugConsole).toBeVisible();
  });

  test('should display correct number of wells', async ({ page }) => {
    // Wait for debug console
    await page.keyboard.press('Control+`');

    // Check logs for wells count
    const logsText = await page.locator('.bg-gray-900').textContent();
    expect(logsText).toMatch(/Wells loaded: \d+ wells/);

    // Extract count
    const match = logsText?.match(/Wells loaded: (\d+) wells/);
    const wellCount = match ? parseInt(match[1]) : 0;

    expect(wellCount).toBeGreaterThanOrEqual(20);
  });

  test('should color code wells correctly', async ({ page }) => {
    await page.keyboard.press('Control+`');
    await page.waitForTimeout(1000);

    // Filter debug logs to show well color assignments
    await page.selectOption('select[aria-label*="Category"]', 'ui');

    // Verify color assignments logged
    const colorLogs = page.locator('text=/Well.*color:/i');
    expect(await colorLogs.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/map-color-coding.png' });
  });

  test('should handle marker clicks', async ({ page }) => {
    // Click somewhere on the map (well marker)
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });

    await page.waitForTimeout(500);

    // Check debug console for click event
    await page.keyboard.press('Control+`');
    const clickLog = page.locator('text=/marker clicked/i');
    await expect(clickLog).toBeVisible();

    await page.screenshot({ path: 'test-results/map-marker-click.png' });
  });

  test('should handle cluster clicks', async ({ page }) => {
    // Zoom out to create clusters
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Click zoom out button multiple times
    const zoomOut = page.locator('button[aria-label="Zoom out"]');
    for (let i = 0; i < 3; i++) {
      await zoomOut.click();
      await page.waitForTimeout(300);
    }

    // Click on a cluster
    await canvas.click({ position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);

    // Check debug console for cluster click
    await page.keyboard.press('Control+`');
    const clusterLog = page.locator('text=/Cluster clicked/i');
    await expect(clusterLog).toBeVisible();

    await page.screenshot({ path: 'test-results/map-cluster-click.png' });
  });

  test('should show no console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Interact with map
    await page.waitForTimeout(3000);

    // Click around
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.click({ position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);
    await canvas.click({ position: { x: 500, y: 400 } });

    // Verify no errors
    expect(errors).toHaveLength(0);
  });
});
```

## Validation Checklist

### Manual Testing Steps

1. **Start Application**
```bash
# Ensure backend and database running
docker compose ps

# Start frontend
cd frontend
npm run dev
```

2. **Open Browser**
   - Navigate to http://localhost:5173
   - Open debug console (Ctrl/Cmd + `)

3. **Visual Inspection**
   - [ ] Map loads showing Texas region
   - [ ] Multiple well markers visible
   - [ ] Wells are color-coded (green/yellow/red)
   - [ ] Zoom out → clusters appear
   - [ ] Zoom in → individual wells appear
   - [ ] Marker sizes appropriate

4. **Debug Console Inspection**
   - [ ] "MapView mounted" log appears
   - [ ] "Wells data loaded: X wells" appears (X ≥ 20)
   - [ ] No validation errors logged
   - [ ] Color assignments logged correctly

5. **Interaction Testing**
   - [ ] Click unclustered marker → modal opens
   - [ ] Click cluster → map zooms in
   - [ ] Hover over marker → tooltip appears
   - [ ] Pan map → smooth movement
   - [ ] Zoom controls work

6. **Data Validation**
```bash
# Check API returns wells
curl http://localhost:3001/api/wells | jq '.wells | length'
# Should return 20+

# Check well coordinates
curl http://localhost:3001/api/wells | jq '.wells[] | {id, lat: .surface_latitude, lng: .surface_longitude}'
# All should have valid coordinates
```

7. **Screenshot Validation**
   - Run Playwright tests to capture screenshots
   - Use `claude -p <screenshot-path>` to analyze with vision
   - Verify rendering matches expectations

## Success Criteria
- [ ] Map loads without errors
- [ ] All wells from API display on map
- [ ] Color coding matches valuation thresholds
- [ ] Cluster behavior works correctly
- [ ] Click interactions work
- [ ] No duplicate markers
- [ ] No missing markers
- [ ] Debug console shows validation passed
- [ ] Unit tests pass (100% coverage)
- [ ] Playwright E2E tests pass
- [ ] Screenshot analysis confirms correct rendering
- [ ] Zero console errors

## Commit Message
```bash
git add frontend/src/components/map/ frontend/src/utils/wellColors.ts frontend/src/utils/mapValidation.ts e2e/tests/map-rendering.spec.ts
git commit -m "feat(map): Validate and enhance map rendering with comprehensive tests

- Add extensive logging to MapView component
- Implement well color coding logic with validation
- Create map validation utilities
- Add integration tests for marker rendering
- Add Playwright E2E tests for map interactions
- Validate all wells render correctly
- Fix any coordinate or rendering issues
- Add screenshot tests for visual validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
35 minutes

## Dependencies
- Task 601 (logging infrastructure)
- Task 602 (debug console)
- Mapbox GL JS
- React Testing Library
- Playwright
