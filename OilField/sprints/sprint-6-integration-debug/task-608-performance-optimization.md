# Task 608: Performance Profiling and Optimization

## References
- `frontend/vite.config.ts` - Build configuration
- `backend/src/server.ts` - Server configuration
- `docs/MVP_SCOPE.md` - Performance requirements

## Objective
Profile application performance, identify bottlenecks, and optimize for production deployment.

## Acceptance Criteria

### Performance Targets
- [ ] Page load: <3 seconds (target: <2s)
- [ ] Well modal open: <500ms (target: <300ms)
- [ ] API response: <1 second (target: <500ms)
- [ ] AI report generation: <10 seconds (target: <5s)
- [ ] Map interaction: <100ms (target: <50ms)
- [ ] Bundle size: <2MB (target: <1.5MB)

### Optimizations
- [ ] Frontend bundle optimization
- [ ] API response caching
- [ ] Database query optimization
- [ ] Image/asset optimization
- [ ] Code splitting implementation
- [ ] Lazy loading non-critical components
- [ ] Memoization of expensive computations

## Implementation Steps

### 1. Frontend Performance Profiling

```typescript
// frontend/src/utils/performance.ts
import logger from './logger';

export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(name: string) {
    this.marks.set(name, performance.now());
    performance.mark(`${name}-start`);
  }

  end(name: string) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn('performance', `No start mark for ${name}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    logger.logPerformance(name, duration, 'ms');

    this.marks.delete(name);
    return duration;
  }

  measure(name: string, fn: () => void) {
    this.start(name);
    fn();
    return this.end(name);
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

// Web Vitals monitoring
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => logger.logPerformance('CLS', metric.value, ''));
    onFID((metric) => logger.logPerformance('FID', metric.value, 'ms'));
    onFCP((metric) => logger.logPerformance('FCP', metric.value, 'ms'));
    onLCP((metric) => logger.logPerformance('LCP', metric.value, 'ms'));
    onTTFB((metric) => logger.logPerformance('TTFB', metric.value, 'ms'));
  });
}
```

### 2. Bundle Size Optimization

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'map-vendor': ['mapbox-gl', 'react-map-gl'],
          'chart-vendor': ['recharts'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
        },
      },
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Tree shaking
    modulePreload: { polyfill: false },
    // Source maps
    sourcemap: false, // Disable in production
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'mapbox-gl',
      'react-map-gl',
    ],
  },
});
```

### 3. Code Splitting and Lazy Loading

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { MapView } from './components/map/MapView';

// Lazy load heavy components
const WellDetailModal = lazy(() => import('./components/wells/WellDetailModal'));
const InvestmentReport = lazy(() => import('./components/wells/InvestmentReport'));
const DebugConsole = lazy(() => import('./components/debug/DebugConsole'));

function App() {
  return (
    <>
      <MapView />
      
      <Suspense fallback={<LoadingSpinner />}>
        {selectedWell && (
          <WellDetailModal wellId={selectedWell} onClose={() => setSelectedWell(null)} />
        )}
      </Suspense>

      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <DebugConsole />
        </Suspense>
      )}
    </>
  );
}
```

### 4. React Query Optimization

```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 2,
      // Refetch on window focus (only in dev)
      refetchOnWindowFocus: import.meta.env.DEV,
      // Refetch on mount (only if stale)
      refetchOnMount: 'always',
    },
  },
});
```

### 5. Component Memoization

```typescript
// frontend/src/components/wells/ValuationCard.tsx
import { memo } from 'react';

export const ValuationCard = memo(function ValuationCard({
  title,
  value,
  format,
}: Props) {
  // Component only re-renders if props change
  return (
    <div className="...">
      <h3>{title}</h3>
      <p>{formatValue(value, format)}</p>
    </div>
  );
});

// Expensive calculations with useMemo
import { useMemo } from 'react';

function ProductionChart({ data }: Props) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: formatDate(point.date),
      oil: point.oil_volume,
      gas: point.gas_volume,
    }));
  }, [data]); // Only recalculate when data changes

  return <LineChart data={chartData} />;
}
```

### 6. Backend Query Optimization

```typescript
// backend/src/services/wellService.ts
import { logInfo } from '../utils/logger';

export async function getWells(filters: WellFilters) {
  const startTime = Date.now();

  // Optimized query with indexes
  const query = db('wells')
    .select(
      'wells.*',
      'operators.name as operator_name',
      'valuations.npv_usd',
      'valuations.irr_percent'
    )
    .leftJoin('operators', 'wells.operator_id', 'operators.id')
    .leftJoin('valuations', 'wells.id', 'valuations.well_id')
    .where('wells.status', 'active');

  if (filters.county) {
    query.where('wells.county', filters.county);
  }

  query.limit(filters.limit || 100);
  query.offset(filters.offset || 0);

  const wells = await query;

  const duration = Date.now() - startTime;
  logInfo('database', 'Wells query executed', { duration: `${duration}ms`, count: wells.length });

  return wells;
}

// Add database indexes (migration)
export async function up(knex: Knex) {
  await knex.schema.table('wells', (table) => {
    table.index(['county'], 'idx_wells_county');
    table.index(['operator_id'], 'idx_wells_operator');
    table.index(['status'], 'idx_wells_status');
  });

  await knex.schema.table('valuations', (table) => {
    table.index(['well_id'], 'idx_valuations_well');
  });
}
```

### 7. Caching Strategy

```typescript
// backend/src/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import { logDebug } from '../utils/logger';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.url;
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    logDebug('cache', `Cache hit: ${key}`);
    return res.json(cached.data);
  }

  // Override res.json to cache response
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    cache.set(key, { data, timestamp: Date.now() });
    logDebug('cache', `Cache set: ${key}`);
    return originalJson(data);
  };

  next();
}
```

## Performance Testing

### 1. Lighthouse Audit

```bash
# Install Lighthouse
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:5173

# Generate report
lighthouse http://localhost:5173 --output html --output-path ./lighthouse-report.html
```

### 2. Bundle Analysis

```bash
# Build and analyze
cd frontend
npm run build
npm run analyze

# Review bundle sizes in browser
```

### 3. Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Create load test script
cat > load-test.js << 'JS'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3001/api/wells');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
JS

# Run load test
k6 run load-test.js
```

## Success Criteria
- [ ] Page load < 2 seconds
- [ ] Modal open < 300ms
- [ ] API response < 500ms
- [ ] Bundle size < 1.5MB
- [ ] Lighthouse score > 90
- [ ] No performance regressions
- [ ] Database queries optimized
- [ ] React Query caching configured
- [ ] Code splitting implemented
- [ ] All performance tests pass

## Commit Message
```bash
git add frontend/vite.config.ts frontend/src/utils/performance.ts backend/src/middleware/cache.ts
git commit -m "perf: Optimize application performance across frontend and backend

- Implement bundle size optimization with code splitting
- Add lazy loading for heavy components
- Configure React Query caching strategy
- Optimize database queries with indexes
- Add API response caching
- Implement component memoization
- Add performance monitoring utilities
- Achieve <2s page load, <300ms interactions
- Reduce bundle size to <1.5MB

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
35 minutes
