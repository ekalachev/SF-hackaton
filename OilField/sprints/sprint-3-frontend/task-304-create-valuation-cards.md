# Task 304: Create Valuation Display Cards

## References
- `docs/MVP_SCOPE.md` - Section "Well Detail Modal" lines 283-290
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Valuation card lines 197

## Objective
Create cards displaying AI valuation, market value, and discount %.

## Acceptance Criteria
- [ ] `src/components/wells/ValuationCard.tsx` created
- [ ] Three cards: AI Value, Market Value, Discount %
- [ ] Number formatting with commas (e.g., $1,850,000)
- [ ] Discount % color-coded (green if undervalued)
- [ ] Numbers animate on load (react-countup)
- [ ] Responsive grid layout

## Verification
- Three cards display side-by-side
- Values formatted correctly
- Numbers count up on first render
- Discount % shows correct color

## Time Estimate
15 minutes (Agent 2, Hour 2:05-2:20)
