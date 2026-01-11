# Task 303: Create Production Chart Component

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "ProductionChart.tsx" lines 1230-1285
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Chart component lines 196

## Objective
Create time-series chart showing 24-month production history.

## Acceptance Criteria
- [ ] `src/components/wells/ProductionChart.tsx` per TECHNICAL_EXECUTION_PLAN.md lines 1232-1285
- [ ] Uses Recharts LineChart
- [ ] X-axis: months (formatted as "MMM yyyy")
- [ ] Y-axis: bbl/day
- [ ] Dark theme matching design system
- [ ] Smooth animation on load
- [ ] Responsive container

## Verification
- Chart renders with production data
- Line shows 24 months of history
- Hover shows tooltip with values
- Animates on first render

## Time Estimate
20 minutes (Agent 2, Hour 1:45-2:05)
