# Test Infrastructure - Quick Fix Guide

## What Works Now ✓
- Vitest configured correctly
- 111 tests passing across 13 files
- React Testing Library integrated
- Mapbox GL and ResizeObserver mocked
- QueryClient properly set up in tests
- Type-safe tests with TypeScript

## What's Missing ✗ (Priority Order)

### 1. Coverage Tool (5 minutes) - DO THIS FIRST
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

### 2. Test Utilities (1 hour) - Reduces Test Duplication
Create file: `src/test/test-utils.tsx`
- `renderWithProviders()` for components
- `createTestQueryClient()` helper
- `userEvent` export
- Mock data factories

### 3. API Mocking with MSW (2 hours) - Enables Real API Testing
```bash
npm install --save-dev msw
```
- Create handlers for all API endpoints
- Mock success and error responses
- Set up in test setup file

### 4. Fix A11y Warnings (30 min) - Test Quality
- WellDetailModal missing DialogTitle
- Affects 10 tests with warnings

### 5. CI/CD Pipeline (45 min) - Automation
- Create `.github/workflows/test.yml`
- Run tests on every push/PR
- Track coverage over time

## Quick Commands

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Watch mode
npm test -- --watch

# Coverage (once package installed)
npm run test:coverage

# UI dashboard
npm test:ui
```

## Key Files

| Path | Purpose | Status |
|------|---------|--------|
| vitest.config.ts | Config | Ready (add coverage section) |
| src/test/setup.ts | Global setup | Ready (add utilities) |
| src/test/test-utils.tsx | **CREATE THIS** | Missing |
| src/test/mocks/ | **CREATE THIS** | Missing |

## Test Distribution

```
Unit Tests:        65 (types, utils)
Component Tests:   35 (UI components)
Hook Tests:        8 (custom hooks)
Integration Tests: 3 (App level)
```

## Known Issues

1. **Coverage missing**: Can't measure test quality
2. **No API mocking**: API tests incomplete
3. **A11y warnings**: 10 tests in WellDetailModal
4. **Duplicate code**: No test utilities/factories
5. **No CI/CD**: Manual test runs only

## Next Steps (In Order)

1. [ ] Install @vitest/coverage-v8
2. [ ] Update vitest.config.ts with coverage config
3. [ ] Create src/test/test-utils.tsx
4. [ ] Install MSW and create API mocks
5. [ ] Set up CI/CD workflow
6. [ ] Fix WellDetailModal a11y warning
7. [ ] Establish coverage threshold (70%+)

## Time Investment

- Coverage tool: 5 minutes
- Test utilities: 1 hour
- API mocking: 2 hours
- CI/CD: 45 minutes
- A11y fixes: 30 minutes
- **Total: ~4.5 hours**

## Success Metrics

- [ ] Coverage reporting working
- [ ] Test utilities in use across all tests
- [ ] API tests verifying actual HTTP interactions
- [ ] CI/CD running on every push
- [ ] Zero accessibility warnings
- [ ] 70%+ code coverage
