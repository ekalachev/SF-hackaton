# Task 305: Setup API Client with React Query

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Frontend tech stack lines 1001-1006
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "8. State Management Flow" lines 729-769

## Objective
Setup Axios client and React Query hooks for data fetching.

## Acceptance Criteria
- [ ] `src/lib/api.ts` with Axios instance configured
- [ ] Base URL from env variable
- [ ] `src/hooks/useWells.ts` hook using React Query
- [ ] `src/hooks/useWellDetail.ts` hook
- [ ] `src/hooks/useSimilarWells.ts` hook
- [ ] Proper loading and error states
- [ ] Caching configured

## Verification
```typescript
const { data, isLoading } = useWells({ limit: 10 });
// Should fetch from API, cache result, handle loading state
```

## Time Estimate
20 minutes (Agent 2, Hour 2:20-2:40)
