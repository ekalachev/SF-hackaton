# Task 102: Process and Clean Well Data

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Data Processing Pipeline" lines 1323-1640
- `docs/MVP_SCOPE.md` - Section "Seed Data Approach" lines 176-223

## Objective
Clean RRC data and select 20-30 wells for demo.

## Acceptance Criteria
- [ ] Python script `scripts/process_rrc_data.py` created per TECHNICAL_EXECUTION_PLAN.md lines 1325-1640
- [ ] Wells filtered to target counties (Smith, Midland, Webb)
- [ ] Active oil wells only
- [ ] Coordinates validated (Texas bounds)
- [ ] 20-30 wells selected with variety (8-10 undervalued, rest mixed)
- [ ] Production history joined (last 24 months)

## Verification
```bash
python scripts/process_rrc_data.py
# Should output: "Saved X wells to data/processed/wells.json"
cat data/processed/wells.json | jq 'length'  # Should be 20-30
```

## Time Estimate
30 minutes (Agent 3, Hour 0:40-1:10)
