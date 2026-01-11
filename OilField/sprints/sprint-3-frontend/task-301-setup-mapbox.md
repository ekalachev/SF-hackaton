# Task 301: Setup Mapbox Map Component

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "MapView.tsx" lines 1070-1227
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "7. Frontend Component Hierarchy" lines 650-725
- `docs/MVP_SCOPE.md` - Section "Map View" lines 611-626

## Objective
Create interactive Mapbox map showing Texas oil fields.

## Acceptance Criteria
- [ ] `src/components/map/MapView.tsx` per TECHNICAL_EXECUTION_PLAN.md lines 1072-1227
- [ ] Mapbox GL JS initialized, centered on Texas
- [ ] Dark map style configured
- [ ] GeoJSON source for wells
- [ ] Cluster layer for groups
- [ ] Individual well markers color-coded by valuation
- [ ] Click handler opens well detail

## Verification
- Map loads showing Texas
- Wells appear as colored markers
- Clicking marker triggers callback with wellId
- Clusters show for zoomed out view

## Time Estimate
45 minutes (Agent 2, Hour 0:30-1:15)
