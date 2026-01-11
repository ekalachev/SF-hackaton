# Task 302: Create Well Detail Modal

## References
- `docs/MVP_SCOPE.md` - Section "Well Detail Modal" lines 628-655
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "Components - Wells" lines 198-199

## Objective
Create modal component displaying well details.

## Acceptance Criteria
- [ ] `src/components/wells/WellDetailModal.tsx` created
- [ ] Uses shadcn/ui Dialog component
- [ ] Fetches well data via React Query
- [ ] Layout matches MVP_SCOPE.md lines 630-654
- [ ] Header with well name and ID
- [ ] Status badges (undervalued %, production, status)
- [ ] Smooth slide-up animation
- [ ] Close button functional

## Verification
- Modal opens when wellId provided
- Displays well data correctly
- Closes on X button or backdrop click
- Animation smooth

## Time Estimate
30 minutes (Agent 2, Hour 1:15-1:45)
