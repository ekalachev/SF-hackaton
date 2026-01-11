# SMT-Based Verification for Well Investment Reports

## Overview
Add formal verification to the InvestmentReport component using the SMT (Satisfiability Modulo Theories) verification service. This will validate investment claims and constraints mathematically, providing users with verified confidence in the AI-generated analysis.

## SMT Service API

**Base URL**: `https://verticalslice-smt-service-d5hf3.ondigitalocean.app`

### Endpoints

1. **POST /pipeline/process** - Submit informal text for formal verification
   - Request body: `{ "informal_text": string }`
   - Response: `{ "status": string, "formal_code": string, "solver_output": string, "is_satisfiable": boolean }`

2. **GET /pipeline/examples** - Get example inputs

3. **GET /health** - Check service health

## Implementation Tasks

### 1. Create SMT Verification Service (frontend/src/lib/smtService.ts)
- Create typed API client for SMT service
- Handle CORS if needed (may need backend proxy)
- Implement error handling and timeouts
- Export `verifyClaims(informalText: string): Promise<SMTVerificationResult>`

### 2. Create SMT Types (frontend/src/types/smt.ts)
```typescript
export interface SMTVerificationRequest {
  informal_text: string;
}

export interface SMTVerificationResult {
  status: string;
  formal_code: string;
  solver_output: string;
  is_satisfiable: boolean;
}

export interface VerificationState {
  isVerifying: boolean;
  result: SMTVerificationResult | null;
  error: string | null;
}
```

### 3. Create useSMTVerification Hook (frontend/src/hooks/useSMTVerification.ts)
- React Query hook for verification requests
- Handle loading, error, and success states
- Cache verification results
- Support manual refetch

### 4. Create VerificationBadge Component (frontend/src/components/reports/VerificationBadge.tsx)
- Display verification status (Verified/Unverified/Checking)
- Show tooltip with formal code and solver output on hover
- Color-coded: green (satisfiable), red (unsatisfiable), yellow (checking)

### 5. Update InvestmentReport Component
- Add "Verify with SMT" button
- Generate informal text from investment analysis:
  ```
  "The well {wellName} has NPV of ${npvUsd} which is greater than market value ${marketValueUsd}.
   The discount is {discountPct}% which is positive.
   Production forecast shows {remainingReservesBbl} barrels remaining.
   Confidence score is {confidence} which is at least 0.75."
  ```
- Display VerificationBadge with results
- Show expandable section with formal SMT-LIB code

### 6. Backend Proxy (optional - if CORS issues)
- Add route `POST /api/verify/smt`
- Proxy requests to SMT service
- Add to backend routes

### 7. Tests
- Unit tests for smtService
- Hook tests with mocked responses
- Component tests for VerificationBadge
- Integration test for InvestmentReport with verification

## Technical Considerations

### CORS Handling
The SMT service may not allow cross-origin requests. Options:
1. Backend proxy (recommended)
2. Configure SMT service CORS headers
3. Use server-side rendering

### Error States
- Service unavailable
- Timeout (suggest 30s)
- Invalid response format
- Rate limiting

### UX Considerations
- Verification is optional (button click)
- Show loading spinner during verification
- Cache results for same well data
- Allow re-verification after data refresh

## Acceptance Criteria

1. User can click "Verify Claims" button on InvestmentReport
2. SMT service receives properly formatted informal text
3. Verification result displays with appropriate badge color
4. Formal SMT-LIB code is viewable in expandable section
5. Errors are handled gracefully with user-friendly messages
6. Tests cover happy path and error scenarios
7. TypeScript types are strict throughout

## Example Informal Text Generation

**Note**: The markdown report is sent as-is to the SMT service. The service will interpret the natural language constraints and convert them to formal SMT-LIB code.

```typescript
function generateVerificationText(
  wellName: string,
  valuation: Valuation,
  markdownReport: string
): string {
  return `
Investment Analysis for ${wellName}

=== Valuation Data ===
- Net Present Value (NPV): $${valuation.npvUsd}
- Market Value: $${valuation.marketValueUsd}
- Discount: ${valuation.discountPct}%
- Confidence Score: ${valuation.confidence}
- Remaining Reserves: ${valuation.remainingReservesBbl} barrels

=== AI Investment Report ===
${markdownReport}

=== Verification Constraints ===
Verify that:
1. All monetary values (NPV, market value) are non-negative
2. Confidence score is between 0.75 and 0.95
3. Remaining reserves are positive
4. If discount > 0, then NPV > market value (asset is undervalued)
5. The report recommendations are consistent with the valuation metrics
  `.trim();
}
```

## Files to Create/Modify

### New Files
- `frontend/src/lib/smtService.ts`
- `frontend/src/types/smt.ts`
- `frontend/src/hooks/useSMTVerification.ts`
- `frontend/src/components/reports/VerificationBadge.tsx`
- `frontend/src/lib/__tests__/smtService.test.ts`
- `frontend/src/hooks/__tests__/useSMTVerification.test.ts`
- `frontend/src/components/reports/__tests__/VerificationBadge.test.tsx`

### Modified Files
- `frontend/src/components/wells/InvestmentReport.tsx`
- `frontend/src/components/wells/__tests__/InvestmentReport.test.tsx`
- `backend/src/routes/index.ts` (if proxy needed)
- `backend/src/routes/verify.routes.ts` (if proxy needed)

## Priority
Medium-High - Adds unique differentiator through formal verification
