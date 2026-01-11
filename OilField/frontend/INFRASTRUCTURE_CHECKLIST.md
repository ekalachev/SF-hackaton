# Test Infrastructure Checklist

## Current Status
```
Frontend Tests:     111/111 PASSING ✓
Test Files:         13 CONFIGURED ✓
Test Framework:     VITEST 2.1.9 ✓
Testing Library:    INSTALLED ✓
Setup Files:        CONFIGURED ✓
```

---

## Critical Issues (MUST DO)

### 1. Coverage Tool Installation
- [ ] Install @vitest/coverage-v8
- [ ] Update vitest.config.ts with coverage config
- [ ] Run: `npm run test:coverage`
- [ ] Establish baseline coverage percentage
- **Time**: 5 minutes
- **Impact**: CRITICAL - Cannot measure test quality without this

### 2. API Mocking Implementation
- [ ] Install MSW (Mock Service Worker)
- [ ] Create src/test/mocks/handlers.ts
- [ ] Define mocks for all API endpoints
- [ ] Update setup.ts with MSW integration
- [ ] Update all API tests to use MSW
- **Time**: 2 hours
- **Impact**: HIGH - Enables realistic API testing

### 3. Test Utilities Creation
- [ ] Create src/test/test-utils.tsx
- [ ] Add renderWithProviders() function
- [ ] Export testing utilities
- [ ] Update all tests to use utilities
- **Time**: 1 hour
- **Impact**: HIGH - Reduces test duplication

### 4. Accessibility Fixes
- [ ] Review WellDetailModal component
- [ ] Add missing DialogTitle
- [ ] Fix @aria-describedby warnings
- [ ] Run tests and verify warnings gone
- **Time**: 30 minutes
- **Impact**: MEDIUM - Test quality and compliance

---

## Important Issues (SHOULD DO)

### 5. CI/CD Pipeline Setup
- [ ] Create .github/workflows/test.yml
- [ ] Configure test runs on push/PR
- [ ] Set up coverage reporting
- [ ] Add test artifacts storage
- **Time**: 45 minutes
- **Impact**: MEDIUM - Automates quality verification

### 6. Mock Data Factories
- [ ] Create factory for Well objects
- [ ] Create factory for WellDetail objects
- [ ] Create factory for API responses
- [ ] Use factories in tests
- **Time**: 1.5 hours
- **Impact**: MEDIUM - Test maintainability

### 7. localStorage Mock
- [ ] Add to src/test/setup.ts
- [ ] Mock session storage
- [ ] Mock window.matchMedia
- **Time**: 30 minutes
- **Impact**: MEDIUM - Enable session tests

---

## Nice to Have (COULD DO)

### 8. Additional DOM Mocks
- [ ] IntersectionObserver
- [ ] requestAnimationFrame
- [ ] Performance API
- **Time**: 1 hour
- **Impact**: LOW - Improve test reliability

### 9. Visual Regression Testing
- [ ] Integrate Chromatic or Percy
- [ ] Capture baseline screenshots
- [ ] Set up automated comparison
- **Time**: 2 hours
- **Impact**: LOW - Long-term maintenance

### 10. Performance Testing
- [ ] Add component render benchmarks
- [ ] Profile critical paths
- [ ] Set performance thresholds
- **Time**: 2 hours
- **Impact**: LOW - Monitor regressions

---

## Implementation Order

### Phase 1: Measurement (5 min)
1. Install coverage tool
2. Run baseline coverage
3. Identify coverage gaps

### Phase 2: Foundation (3 hours)
4. Create test utilities
5. Implement API mocking
6. Update tests to use new infrastructure

### Phase 3: Quality (1.5 hours)
7. Fix accessibility warnings
8. Create mock data factories
9. Add localStorage mock

### Phase 4: Automation (45 min)
10. Set up CI/CD pipeline

### Phase 5: Polish (Optional, 2-4 hours)
11. Add visual regression testing
12. Implement performance testing
13. Create additional DOM mocks

---

## Dependencies to Install

```bash
# Critical
npm install --save-dev @vitest/coverage-v8

# Important
npm install --save-dev msw

# Optional
npm install --save-dev @vitest/ui
npm install --save-dev chromatic
```

---

## Configuration Updates Needed

### vitest.config.ts
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/'],
  },
}
```

### src/test/setup.ts
```typescript
// Add to existing file:
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
global.localStorage = localStorageMock as any
```

### package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest --run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage --run",
    "test:watch": "vitest --watch"
  }
}
```

### .github/workflows/test.yml
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Success Metrics

### Phase 1 Completion
- [ ] Coverage tool installed and working
- [ ] Coverage baseline measured
- [ ] Commit: "chore: Install coverage tool"

### Phase 2 Completion
- [ ] Test utilities module created
- [ ] API mocking working with MSW
- [ ] All tests still passing
- [ ] Commit: "refactor: Add test utilities and API mocking"

### Phase 3 Completion
- [ ] No accessibility warnings
- [ ] Mock data factories available
- [ ] localStorage mock working
- [ ] Commit: "fix: Resolve accessibility and add utilities"

### Phase 4 Completion
- [ ] CI/CD workflow running
- [ ] Tests automated on push
- [ ] Coverage reports generated
- [ ] Commit: "ci: Add GitHub Actions workflow"

### Final State
- Coverage tool: INSTALLED
- API mocking: ENABLED
- Test utilities: CENTRALIZED
- Accessibility: COMPLIANT
- CI/CD: AUTOMATED
- Coverage: 70%+ target
- All tests: PASSING

---

## Quick Reference

### Install Coverage
```bash
npm install --save-dev @vitest/coverage-v8
npm run test:coverage
```

### Run Tests
```bash
npm test              # Watch mode
npm run test:run      # One-time run
npm run test:coverage # With coverage
npm run test:ui       # Visual dashboard
```

### Key Files to Create/Modify
```
src/test/test-utils.tsx        # CREATE
src/test/mocks/handlers.ts      # CREATE
src/test/mocks/factories.ts     # CREATE
src/test/setup.ts               # MODIFY
vitest.config.ts                # MODIFY
package.json                    # MODIFY
.github/workflows/test.yml      # CREATE
```

---

## Tracking Progress

- [ ] Phase 1: Measurement (5 min)
- [ ] Phase 2: Foundation (3 hours)
- [ ] Phase 3: Quality (1.5 hours)
- [ ] Phase 4: Automation (45 min)
- [ ] Phase 5: Polish (Optional)

**Total Time: 4.5 - 6.5 hours**

---

## Notes

- All 111 existing tests are passing and should remain green
- No test rewrites needed, only infrastructure additions
- Phase 1 can be done in < 10 minutes
- Can be parallelized if resources available
- Success = better test quality and faster iteration
