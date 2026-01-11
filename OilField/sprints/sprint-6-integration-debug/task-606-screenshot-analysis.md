# Task 606: Screenshot Analysis with Claude Code -p Mode

## References
- `e2e/tests/*.spec.ts` - Playwright test files with screenshots
- Claude Code CLI documentation (`claude --help`)

## Objective
Use Claude Code vision capabilities (`claude -p`) to analyze application screenshots and validate UI rendering correctness.

## Acceptance Criteria
- [ ] Capture screenshots of all major views
- [ ] Analyze screenshots with `claude -p` command
- [ ] Validate UI element positioning
- [ ] Check color scheme consistency
- [ ] Verify text readability
- [ ] Validate chart rendering
- [ ] Check modal layouts
- [ ] Verify responsive design
- [ ] Document any visual issues found
- [ ] Create visual regression baseline

## Implementation Steps

### 1. Capture Comprehensive Screenshots

```bash
# Run Playwright tests to capture screenshots
cd frontend
npx playwright test --project=chromium

# Screenshots will be in test-results/ directory
ls -la test-results/*.png
```

### 2. Screenshot Analysis Script

```typescript
// scripts/analyze-screenshots.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface AnalysisResult {
  file: string;
  analysis: string;
  issues: string[];
  score: number;
}

async function analyzeScreenshot(filePath: string): Promise<AnalysisResult> {
  console.log(`Analyzing ${filePath}...`);

  const prompt = `
Analyze this screenshot of the OilField oil well mapping application and report:

1. UI Element Positioning: Are all elements properly aligned and positioned?
2. Color Scheme: Is the emerald/green theme consistent? Any color issues?
3. Text Readability: Is all text clear and readable?
4. Chart Rendering: If charts are visible, are they rendered correctly?
5. Layout: Is the layout clean and professional?
6. Responsive Design: Does it look appropriate for the viewport size?
7. Data Display: Are well markers, valuations, etc. displayed correctly?
8. Issues: List any visual bugs, alignment issues, or rendering problems

Provide a score from 0-10 (10 = perfect) and list specific issues if any.
Format: 
SCORE: X/10
ISSUES: [list or "None"]
ANALYSIS: [detailed feedback]
  `.trim();

  const { stdout } = await execAsync(
    `claude -p "${filePath}" "${prompt}"`
  );

  // Parse output
  const scoreMatch = stdout.match(/SCORE:\s*(\d+)/i);
  const issuesMatch = stdout.match(/ISSUES:\s*(.+?)(?=ANALYSIS:|$)/is);
  const analysisMatch = stdout.match(/ANALYSIS:\s*(.+)$/is);

  return {
    file: path.basename(filePath),
    analysis: analysisMatch?.[1]?.trim() || stdout,
    issues: issuesMatch?.[1]?.trim() !== 'None' 
      ? (issuesMatch?.[1]?.trim().split('\n') || [])
      : [],
    score: parseInt(scoreMatch?.[1] || '0'),
  };
}

async function analyzeAllScreenshots() {
  const screenshotsDir = path.join(__dirname, '../test-results');
  const files = await readdir(screenshotsDir);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  console.log(`Found ${pngFiles.length} screenshots to analyze\n`);

  const results: AnalysisResult[] = [];

  for (const file of pngFiles) {
    const filePath = path.join(screenshotsDir, file);
    const result = await analyzeScreenshot(filePath);
    results.push(result);
    console.log(`✓ ${file}: ${result.score}/10`);
  }

  // Generate report
  console.log('\n=== SCREENSHOT ANALYSIS REPORT ===\n');

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalScore / results.length;

  console.log(`Average Score: ${avgScore.toFixed(1)}/10\n`);

  results.forEach(result => {
    console.log(`\n--- ${result.file} ---`);
    console.log(`Score: ${result.score}/10`);
    if (result.issues.length > 0) {
      console.log('Issues:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log(`\nAnalysis:\n${result.analysis}`);
  });

  // Save report
  const reportPath = path.join(screenshotsDir, 'VISUAL_ANALYSIS_REPORT.md');
  const markdown = generateMarkdownReport(results, avgScore);
  await fs.writeFile(reportPath, markdown);
  console.log(`\nReport saved to: ${reportPath}`);

  return results;
}

function generateMarkdownReport(results: AnalysisResult[], avgScore: number): string {
  return `# Visual Analysis Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Screenshots Analyzed**: ${results.length}
- **Average Score**: ${avgScore.toFixed(1)}/10
- **Total Issues Found**: ${results.reduce((sum, r) => sum + r.issues.length, 0)}

## Individual Results

${results.map(r => `
### ${r.file}

**Score**: ${r.score}/10

${r.issues.length > 0 ? `
**Issues**:
${r.issues.map(i => `- ${i}`).join('\n')}
` : '**No issues found**'}

**Analysis**:
${r.analysis}

---
`).join('\n')}

## Recommendations

${avgScore < 7 ? `
⚠️ **Action Required**: Average score below 7.0 indicates visual issues that need attention.

Priority actions:
1. Review and fix all listed issues
2. Re-run screenshot analysis after fixes
3. Update baseline screenshots for visual regression testing
` : avgScore < 9 ? `
✓ Good visual quality. Minor improvements may be needed for issues listed above.
` : `
✅ Excellent visual quality. All screenshots meet high standards.
`}
`;
}

// Run analysis
analyzeAllScreenshots().catch(console.error);
```

### 3. Manual Analysis with Claude -p

```bash
# Analyze individual screenshots
claude -p test-results/map-initial-load.png "Analyze this map view. Check if wells are visible, colors are correct, and layout is clean."

claude -p test-results/modal-complete-data.png "Analyze this well detail modal. Verify all sections are present and properly formatted."

claude -p test-results/ai-report-generated.png "Analyze this AI report. Check if markdown is rendered correctly and all sections are visible."

claude -p test-results/mobile-view.png "Analyze this mobile view. Check if UI is responsive and all elements are accessible."
```

### 4. Create Visual Regression Baseline

```bash
# Create baseline directory
mkdir -p e2e/visual-baselines

# Copy current screenshots as baseline
cp test-results/*.png e2e/visual-baselines/

# Document baselines
cat > e2e/visual-baselines/README.md << 'BASELINE'
# Visual Regression Baselines

These screenshots serve as the baseline for visual regression testing.

## Baseline Images

1. `map-initial-load.png` - Initial map view with wells
2. `modal-complete-data.png` - Well detail modal with all sections
3. `valuation-cards.png` - Valuation display cards
4. `similar-wells-panel.png` - Similar wells AI feature
5. `ai-report-generated.png` - Generated AI report
6. `mobile-view.png` - Mobile responsive view
7. `tablet-view.png` - Tablet responsive view

## Updating Baselines

When intentional UI changes are made:

1. Run Playwright tests to generate new screenshots
2. Analyze with `claude -p` to verify quality
3. If approved, replace baseline images
4. Document what changed in git commit

## Analysis

Use Claude Code vision to analyze:

\`\`\`bash
claude -p e2e/visual-baselines/[screenshot].png "Describe the UI elements and verify they match the expected design"
\`\`\`
BASELINE
```

## Manual Validation Steps

### Step 1: Run Playwright Tests
```bash
cd frontend
npm run test:e2e
```

### Step 2: Analyze Each Screenshot

```bash
# Map View
claude -p test-results/01-initial-page-load.png "Analyze map: wells visible, colors correct, clean layout?"

# Modal
claude -p test-results/02-well-modal-open.png "Analyze modal: all sections present, data visible, good spacing?"

# Valuation Cards
claude -p test-results/03-valuation-cards.png "Analyze cards: NPV/IRR/Payback visible, formatting correct, aligned well?"

# Similar Wells
claude -p test-results/04-similar-wells-panel.png "Analyze similar wells: 5 wells listed, scores visible, emerald theme applied?"

# AI Report
claude -p test-results/05-ai-report.png "Analyze report: markdown rendered, sections visible, readable text?"

# Mobile
claude -p test-results/06-mobile-view.png "Analyze mobile: responsive layout, no overflow, all features accessible?"

# Tablet
claude -p test-results/07-tablet-view.png "Analyze tablet: optimal layout for viewport, good use of space?"

# Error State
claude -p test-results/08-error-state.png "Analyze error: clear message, good UX, recovery options visible?"
```

### Step 3: Run Automated Analysis

```bash
cd scripts
npm install tsx
npx tsx analyze-screenshots.ts
```

### Step 4: Review Report

```bash
cat test-results/VISUAL_ANALYSIS_REPORT.md
```

### Step 5: Fix Issues and Re-analyze

```bash
# After fixing visual issues
npm run test:e2e
npx tsx analyze-screenshots.ts

# Compare scores
```

## Success Criteria
- [ ] All screenshots captured
- [ ] Automated analysis script works
- [ ] Manual analysis with `claude -p` complete
- [ ] Average score ≥ 8.0/10
- [ ] Critical issues documented
- [ ] Visual baseline established
- [ ] Analysis report generated
- [ ] Fixes implemented for major issues

## Commit Message
```bash
git add e2e/visual-baselines/ scripts/analyze-screenshots.ts test-results/VISUAL_ANALYSIS_REPORT.md
git commit -m "test(visual): Add screenshot analysis with Claude Code vision

- Create automated screenshot analysis script
- Establish visual regression baselines
- Generate comprehensive visual analysis report
- Document any visual issues found
- Fix critical visual bugs identified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin develop
```

## Time Estimate
30 minutes
