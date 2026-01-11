# Task 203: Implement Well Service

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "API Endpoints - Wells" lines 461-578
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "3.2 Backend Architecture" lines 248-314

## Objective
Create WellService with business logic for well queries.

## Acceptance Criteria
- [ ] `src/services/wellService.ts` created
- [ ] Method: `getWells(filters)` per TECHNICAL_EXECUTION_PLAN.md lines 462-516
- [ ] Method: `getWellById(id)` per lines 518-578
- [ ] Returns well with production history and valuation
- [ ] Proper error handling
- [ ] TypeScript types defined

## Verification
```typescript
// Test in Node REPL
const service = new WellService(db);
const wells = await service.getWells({ limit: 10 });
assert(wells.length <= 10);
const well = await service.getWellById(wells[0].id);
assert(well.productionHistory.length > 0);
```

## Time Estimate
30 minutes (Agent 1, Hour 0:40-1:10)
