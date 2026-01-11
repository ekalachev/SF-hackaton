# Task 404: Create Investment Report Component

## References
- `docs/CLAUDE_CLI_INTEGRATION.md` - Section "Frontend Integration" lines 816-896
- `docs/MVP_SCOPE.md` - Generate bid feature lines 292-322

## Objective
Create component to generate and display AI investment reports.

## Acceptance Criteria
- [ ] `src/components/wells/InvestmentReport.tsx` per CLAUDE_CLI_INTEGRATION.md lines 818-896
- [ ] Button: "Generate AI Investment Report"
- [ ] Loading state with spinner (3-5 seconds)
- [ ] Renders markdown report using react-markdown
- [ ] Download PDF button (optional)
- [ ] Smooth animation on load

## Verification
- Button triggers report generation
- Loading spinner shows during API call
- Report displays in formatted markdown
- Scrollable if content long

## Time Estimate
20 minutes (Agent 2, Hour 3:05-3:25)
