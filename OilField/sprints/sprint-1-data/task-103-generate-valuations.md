# Task 103: Generate DCA Valuations

## References
- `docs/TECHNICAL_EXECUTION_PLAN.md` - Section "Valuation Service (DCA Implementation)" lines 740-981
- `docs/MVP_SCOPE.md` - Section "AI/ML (5% of effort) - Simplified" lines 155-171

## Objective
Calculate NPV valuations using simple DCA for all wells.

## Acceptance Criteria
- [ ] DCA functions implemented per TECHNICAL_EXECUTION_PLAN.md lines 817-860
- [ ] NPV calculation per lines 862-898
- [ ] Valuations computed for all 20-30 wells
- [ ] Market value estimated (1.5x NPV)
- [ ] Discount % calculated
- [ ] Confidence scores assigned
- [ ] Results in `data/processed/wells.json`

## Verification
```bash
cat data/processed/wells.json | jq '.[0].valuation'
# Should show: npvUsd, marketValueUsd, discountPct, confidence fields
```

## Time Estimate
20 minutes (Agent 3, Hour 1:10-1:30)
