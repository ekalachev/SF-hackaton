# TO-DOS

## Enlarge Radius Tool Report - 2025-11-19 21:09

- **Increase radius report panel size** - Make the radius selection statistics display larger and more prominent. **Problem:** Current radius report in MapControls is small and hard to read, showing radius, well count, total production, and avg discount in a compact format. **Files:** `frontend/src/components/map/MapControls.tsx:274-316`. **Solution:** Increase panel dimensions, font sizes, and spacing for better readability.

## Implement Realistic Market Value Estimation - 2025-11-19 21:25

- **Replace synthetic market value with realistic estimation** - Current market value is randomly generated from NPV (NPV × 0.95-1.65x multiplier). Need realistic industry-standard estimation. **Problem:** Market values don't reflect real-world valuation methodologies, making discount percentages meaningless. **Files:** `scripts/generate_valuations.py:404-414`, `data/README.md:106-128`. **Solution:** Options: (1) Industry multiples - $/flowing barrel ($30K-$80K/bbl/day by basin) or $/proved reserves ($8-$15/bbl), (2) Enhanced DCF with basin premiums and operator factors, (3) Combine NPV with production multiple: `market_value = (npv * 0.6) + (production_bbl_day * basin_multiple * 0.4)`. Consider using Enverus/DrillingInfo/EnergyNet for real comparable sales data.

## Fix Report Table Formatting - 2025-11-20 11:51

- **Add empty lines before tables in AI report** - Tables in the generated investment report are not rendering properly in markdown. **Problem:** Tables in the AI-generated report are missing empty lines before them, causing markdown rendering issues in ReactMarkdown. **Files:** `backend/src/services/claudeService.ts` (prompt template). **Solution:** Update the Claude prompt to ensure tables have an empty line before them for proper markdown formatting.

## Validate SMT Verification Message Format - 2025-11-21 03:27

- **Verify SMT service request/response format** - Thoroughly validate that we use correct message format for SMT verification service. **Problem:** SMT verification shows "Error" badge after clicking "Verify Claims" - the service may expect different request format or response fields may not match our types. **Files:** `backend/src/routes/smt.routes.ts:14,55-91`, `frontend/src/lib/smtService.ts:171-203`, `frontend/src/types/smt.ts`. **Solution:** Check SMT service API docs at `/pipeline/examples` endpoint, compare actual response fields with our `SMTVerificationResult` type, ensure `generateVerificationText` produces valid input format for the service.

