# Task 604: Validate Well Detail Modal and Data Flow

## References
- `frontend/src/components/wells/WellDetailModal.tsx` - Modal component
- `frontend/src/hooks/useWellDetail.tsx` - Data fetching hook
- `backend/src/routes/wells.routes.ts` - API endpoints

## Objective
Validate complete data flow from backend API through React Query state to modal UI display. Ensure all sections render correctly with proper data.

## Acceptance Criteria
- [ ] API endpoints return complete well data
- [ ] React Query caches data correctly
- [ ] Modal displays all sections:
  - Well header (name, API number, location)
  - Production chart with historical data
  - Valuation cards (NPV, IRR, Payback)
  - Operator information
  - Similar wells section
  - AI report section
- [ ] Loading states work correctly
- [ ] Error states handled gracefully
- [ ] Modal opens/closes smoothly
- [ ] Data updates when switching wells
- [ ] No stale data displayed
- [ ] Comprehensive logging at each step
- [ ] Unit + integration + E2E tests

## Implementation Steps

### 1. Add Logging to Data Flow

```typescript
// frontend/src/hooks/useWellDetail.tsx
import logger from '../utils/logger';

export function useWellDetail(wellId: string | null) {
  return useQuery({
    queryKey: ['well', wellId],
    queryFn: async () => {
      logger.info('api', `Fetching well details: ${wellId}`);
      const startTime = performance.now();
      
      const data = await api.getWellDetail(wellId!);
      
      const duration = performance.now() - startTime;
      logger.logPerformance('Well detail fetch', duration, 'ms');
      logger.debug('state', 'Well detail loaded', { wellId, data });
      
      return data;
    },
    enabled: !!wellId,
  });
}
```

### 2. Validate Modal Rendering

```typescript
// frontend/src/components/wells/WellDetailModal.tsx
import logger from '../../utils/logger';

export function WellDetailModal({ wellId, onClose }: Props) {
  const { data, isLoading, error } = useWellDetail(wellId);

  useEffect(() => {
    if (wellId) {
      logger.info('ui', `WellDetailModal opened for well: ${wellId}`);
    }
  }, [wellId]);

  useEffect(() => {
    if (data) {
      logger.debug('state', 'Modal data updated', {
        wellId,
        hasProduction: !!data.production_history,
        hasValuation: !!data.valuation,
      });
    }
  }, [data, wellId]);

  if (error) {
    logger.error('ui', 'Error in WellDetailModal', { wellId, error: error.message });
  }

  // Validate data completeness
  useEffect(() => {
    if (data && !isLoading) {
      const validation = validateWellData(data);
      if (!validation.valid) {
        logger.warn('validation', 'Incomplete well data', {
          wellId,
          missing: validation.missing,
        });
      }
    }
  }, [data, isLoading, wellId]);

  // ...
}
```

### 3. Data Validation Utility

```typescript
// frontend/src/utils/dataValidation.ts
export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

export function validateWellData(well: Well): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
  };

  // Required fields
  if (!well.api_number) result.missing.push('api_number');
  if (!well.well_name) result.missing.push('well_name');
  if (!well.surface_latitude) result.missing.push('surface_latitude');
  if (!well.surface_longitude) result.missing.push('surface_longitude');

  // Optional but expected fields
  if (!well.production_history || well.production_history.length === 0) {
    result.warnings.push('No production history');
  }
  if (!well.valuation) {
    result.warnings.push('No valuation data');
  }

  result.valid = result.missing.length === 0;
  return result;
}
```

### 4. Integration Tests

```typescript
// frontend/src/components/wells/WellDetailModal.integration.test.tsx
describe('WellDetailModal Data Flow', () => {
  it('should fetch and display complete well data', async () => {
    render(<WellDetailModal wellId="well-123" onClose={vi.fn()} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify all sections rendered
    expect(screen.getByText(/well-123/i)).toBeInTheDocument();
    expect(screen.getByTestId('production-chart')).toBeInTheDocument();
    expect(screen.getByTestId('valuation-npv')).toBeInTheDocument();
    expect(screen.getByTestId('valuation-irr')).toBeInTheDocument();
  });

  it('should handle missing data gracefully', async () => {
    server.use(
      http.get('/api/wells/:id', () => {
        return HttpResponse.json({
          well: { id: 'well-123', api_number: '12345' },
          // Missing other fields
        });
      })
    );

    render(<WellDetailModal wellId="well-123" onClose={vi.fn()} />);

    await waitFor(() => {
      // Should display available data
      expect(screen.getByText('12345')).toBeInTheDocument();
      // Should show placeholder for missing sections
      expect(screen.queryByTestId('production-chart')).not.toBeInTheDocument();
    });
  });
});
```

### 5. Playwright E2E Tests

```typescript
// e2e/tests/modal-dataflow.spec.ts
test('should display complete well data in modal', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Click a well marker
  const canvas = page.locator('canvas.mapboxgl-canvas');
  await canvas.click({ position: { x: 400, y: 300 } });

  // Wait for modal
  await page.waitForSelector('[data-testid="well-detail-modal"]');

  // Check debug console for data flow
  await page.keyboard.press('Control+`');
  await expect(page.locator('text=/Well detail loaded/i')).toBeVisible();

  // Verify all sections present
  await expect(page.locator('[data-testid="well-header"]')).toBeVisible();
  await expect(page.locator('[data-testid="production-chart"]')).toBeVisible();
  await expect(page.locator('[data-testid="valuation-cards"]')).toBeVisible();

  await page.screenshot({ path: 'test-results/modal-complete-data.png' });
});
```

## Manual Validation Steps

1. Open application with debug console
2. Click on well marker
3. Observe logs:
   - "Fetching well details: [well-id]"
   - "Well detail loaded"
   - "Modal data updated"
4. Verify all modal sections display
5. Check for validation warnings
6. Switch to another well
7. Verify data updates correctly
8. Close modal and reopen
9. Verify cached data loads faster

## Success Criteria
- [ ] Complete data flow logged
- [ ] All modal sections render
- [ ] No missing required data
- [ ] Validation warnings logged
- [ ] React Query caching works
- [ ] Error states handled
- [ ] All tests pass
- [ ] Zero console errors

## Commit Message
```bash
git add frontend/src/components/wells/WellDetailModal.tsx frontend/src/hooks/useWellDetail.tsx frontend/src/utils/dataValidation.ts
git commit -m "feat(modal): Validate well detail modal data flow with comprehensive tests

- Add extensive logging to modal and hooks
- Implement data validation utilities
- Add integration tests for data flow
- Add Playwright E2E tests
- Fix any data display issues

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
40 minutes
