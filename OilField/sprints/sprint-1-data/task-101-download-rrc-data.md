# Task 101: Download Texas RRC Data

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Data Sources" lines 1299-1321
- `docs/MVP_SCOPE.md` - Section "Data Strategy" lines 176-223

## Objective
Download comprehensive well and production data from Texas RRC (up to 500 MB).

## Acceptance Criteria
- [ ] Downloaded production CSV (2023-2024) from Texas RRC
- [ ] Downloaded wells directory CSV (full or filtered to major counties)
- [ ] Downloaded operators list CSV
- [ ] Files saved to `data/raw/` directory
- [ ] Total download size ≤ 500 MB
- [ ] Data contains at least 200-500 wells from major producing counties
- [ ] Production data includes last 24 months

## Download Strategy
**Primary Counties** (for geographic diversity):
- Smith County (East Texas)
- Midland County (Permian Basin)
- Webb County (Eagle Ford)
- Karnes County (Eagle Ford)
- Reeves County (Permian Basin)

**Data Sources:**
- Production: https://www.rrc.state.tx.us/resource-center/research/data-sets-available-for-download/
- Wells Directory: Texas RRC public datasets
- Operators: Texas RRC operator registry

## Verification
```bash
ls -lh data/raw/
# Should show files with total size < 500 MB
wc -l data/raw/*.csv
# Expected: 200-500 wells, 5000-12000 production records
du -sh data/raw/
# Should show total size ≤ 500 MB
```

## Time Estimate
30-45 minutes (Agent 3, Hour 0:10-0:40)
