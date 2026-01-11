# Task 605: Validate Similar Wells and AI Features

## References
- `frontend/src/components/wells/SimilarWellsPanel.tsx`
- `frontend/src/components/wells/InvestmentReport.tsx`
- `backend/src/services/claudeService.ts`
- `backend/src/services/similarityService.ts`

## Objective
Ensure AI-powered features (semantic similarity, narrative generation, investment reports) work end-to-end without errors.

## Acceptance Criteria
- [ ] "Find Similar Wells" button triggers search
- [ ] Semantic similarity returns 5 similar wells
- [ ] Similarity scores accurate (0-100%)
- [ ] AI-generated match reasons display
- [ ] Match reasons are contextual and relevant
- [ ] "Generate AI Report" creates comprehensive report
- [ ] Report contains all required sections
- [ ] Markdown formatting renders correctly
- [ ] Caching works for narratives
- [ ] Error handling for AI service failures
- [ ] Loading states work properly
- [ ] Comprehensive logging throughout
- [ ] Unit + integration + E2E tests

## Implementation Steps

### 1. Add Logging to Similar Wells

```typescript
// frontend/src/components/wells/SimilarWellsPanel.tsx
import logger from '../../utils/logger';

export function SimilarWellsPanel({ wellId }: Props) {
  const { data, isLoading, error } = useSimilarWells(wellId);

  useEffect(() => {
    if (isLoading) {
      logger.info('api', `Fetching similar wells for: ${wellId}`);
    }
  }, [isLoading, wellId]);

  useEffect(() => {
    if (data) {
      logger.info('state', `Similar wells loaded: ${data.similarWells.length}`, {
        wellId,
        count: data.similarWells.length,
        scores: data.similarWells.map(w => w.similarity_score),
      });
    }
  }, [data, wellId]);

  useEffect(() => {
    if (error) {
      logger.error('api', 'Failed to load similar wells', { wellId, error: error.message });
    }
  }, [error, wellId]);

  // ...
}
```

### 2. Validate AI Report Generation

```typescript
// frontend/src/components/wells/InvestmentReport.tsx
export function InvestmentReport({ wellId }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleGenerate = async () => {
    logger.info('ui', `Generating AI report for well: ${wellId}`);
    const startTime = performance.now();
    setIsGenerating(true);

    try {
      const response = await api.generateReport(wellId);
      const duration = performance.now() - startTime;

      logger.logPerformance('AI report generation', duration, 'ms');
      logger.info('state', 'AI report generated', {
        wellId,
        reportLength: response.report.length,
        sections: extractSections(response.report),
      });

      setReport(response.report);
    } catch (error) {
      logger.error('api', 'AI report generation failed', {
        wellId,
        error: (error as Error).message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ...
}

function extractSections(markdown: string): string[] {
  const sections = markdown.match(/^## .+$/gm) || [];
  return sections.map(s => s.replace('## ', ''));
}
```

### 3. Backend Logging

```typescript
// backend/src/services/claudeService.ts
import { logInfo, logError, logDebug } from '../utils/logger';

export async function generateInvestmentReport(well: Well, valuation: Valuation) {
  logInfo('ai', 'Generating investment report', { wellId: well.id });

  try {
    const prompt = buildReportPrompt(well, valuation);
    logDebug('ai', 'Report prompt built', { promptLength: prompt.length });

    const report = await callClaudeCLI(prompt);
    logInfo('ai', 'Investment report generated', { 
      wellId: well.id, 
      reportLength: report.length 
    });

    return report;
  } catch (error) {
    logError('AI report generation failed', error as Error, { wellId: well.id });
    throw error;
  }
}
```

### 4. Integration Tests

```typescript
// frontend/src/components/wells/SimilarWellsPanel.test.tsx
describe('Similar Wells Integration', () => {
  it('should fetch and display similar wells', async () => {
    render(<SimilarWellsPanel wellId="well-123" />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/similar-well-/)).toHaveLength(5);
    });

    // Verify similarity scores
    const scores = screen.getAllByTestId('similarity-score');
    scores.forEach(score => {
      const value = parseInt(score.textContent || '0');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });

    // Verify match reasons present
    expect(screen.getAllByTestId('match-reasons')).toHaveLength(5);
  });

  it('should handle AI service failures gracefully', async () => {
    server.use(
      http.get('/api/wells/:id/similar', () => {
        return HttpResponse.error();
      })
    );

    render(<SimilarWellsPanel wellId="well-123" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 5. Playwright E2E Tests

```typescript
// e2e/tests/ai-features.spec.ts
test('should generate AI investment report', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Open well modal
  const canvas = page.locator('canvas.mapboxgl-canvas');
  await canvas.click({ position: { x: 400, y: 300 } });

  // Click Generate Report button
  await page.click('button:has-text("Generate AI Investment Report")');

  // Wait for report (up to 15 seconds)
  await page.waitForSelector('text=/Executive Summary/i', { timeout: 15000 });

  // Verify report sections
  await expect(page.locator('text=/Executive Summary/i')).toBeVisible();
  await expect(page.locator('text=/Well Overview/i')).toBeVisible();
  await expect(page.locator('text=/Production Analysis/i')).toBeVisible();
  await expect(page.locator('text=/Economic Valuation/i')).toBeVisible();

  // Check debug console
  await page.keyboard.press('Control+`');
  await expect(page.locator('text=/AI report generated/i')).toBeVisible();

  await page.screenshot({ path: 'test-results/ai-report-generated.png' });
});
```

## Manual Validation Steps

1. Open application with debug console
2. Click well marker to open modal
3. Click "Find Similar Wells"
4. Observe logs:
   - "Fetching similar wells"
   - "Similar wells loaded: 5"
5. Verify 5 similar wells display
6. Check similarity scores (0-100%)
7. Verify match reasons are contextual
8. Click "Generate AI Investment Report"
9. Observe logs:
   - "Generating AI report"
   - Performance timing
   - "AI report generated"
10. Verify all report sections present
11. Check markdown rendering
12. Test caching by regenerating

## Success Criteria
- [ ] Similar wells feature works
- [ ] Similarity scores accurate
- [ ] Match reasons contextual
- [ ] AI report generates successfully
- [ ] All report sections present
- [ ] Markdown renders correctly
- [ ] Caching works
- [ ] Error handling works
- [ ] All tests pass
- [ ] Comprehensive logging

## Commit Message
```bash
git add frontend/src/components/wells/SimilarWellsPanel.tsx frontend/src/components/wells/InvestmentReport.tsx backend/src/services/claudeService.ts
git commit -m "feat(ai): Validate AI features with comprehensive tests and logging

- Add logging to similar wells and AI report generation
- Validate semantic similarity accuracy
- Validate AI report completeness
- Add integration and E2E tests
- Fix any AI service issues

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
45 minutes
