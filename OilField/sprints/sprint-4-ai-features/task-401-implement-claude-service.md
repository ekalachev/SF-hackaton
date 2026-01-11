# Task 401: Implement Claude Service for AI Reports

## References
- `docs/CLAUDE_CLI_INTEGRATION.md` - Section "Backend Service Architecture" lines 459-695
- `docs/architecture/SYSTEM_ARCHITECTURE.md` - Section "6.3 AI Report Generation" lines 606-646

## Objective
Create service using Claude CLI to generate investment reports.

## Acceptance Criteria
- [ ] `src/services/claudeService.ts` per CLAUDE_CLI_INTEGRATION.md lines 462-695
- [ ] Method: `generateInvestmentReport()` per lines 487-509
- [ ] Method: `buildReportPrompt()` per lines 514-568
- [ ] Calls Claude CLI via exec
- [ ] Returns markdown report (2000-2500 words)
- [ ] Temp file cleanup

## Verification
```typescript
const service = new ClaudeService();
const report = await service.generateInvestmentReport(well, valuation);
assert(report.includes('# Investment Analysis'));
assert(report.length > 5000);  // ~2000 words
```

## Time Estimate
25 minutes (Agent 1, Hour 2:20-2:45)
