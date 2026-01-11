/**
 * Screenshot Analysis with Claude Vision API
 * Analyzes application screenshots for visual quality, UI consistency, and issues
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, writeFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface AnalysisResult {
  file: string;
  analysis: string;
  issues: string[];
  score: number;
  timestamp: string;
}

interface AnalysisReport {
  results: AnalysisResult[];
  averageScore: number;
  totalIssues: number;
  timestamp: string;
}

/**
 * Analyzes a single screenshot using Claude vision API
 */
async function analyzeScreenshot(filePath: string): Promise<AnalysisResult> {
  console.log(`\nAnalyzing: ${path.basename(filePath)}...`);

  const prompt = `Analyze this screenshot of the OilField oil well mapping application and provide a detailed assessment:

1. **UI Element Positioning**: Are all elements properly aligned and positioned? Check for overlaps, gaps, or misalignments.

2. **Color Scheme**: Is the emerald/green theme consistent throughout? Check for color inconsistencies or theme violations.

3. **Text Readability**: Is all text clear, readable, and properly sized? Check for truncation, overflow, or font issues.

4. **Chart Rendering**: If charts are visible, are they rendered correctly with proper scales, labels, and data?

5. **Layout Quality**: Is the layout clean, professional, and follows modern UI/UX principles?

6. **Responsive Design**: Does the layout appear appropriate for the viewport size shown?

7. **Data Display**: Are well markers, valuations, modal content, and other data displayed correctly?

8. **Visual Bugs**: List any visual bugs, rendering issues, alignment problems, or UX concerns.

Provide your response in this exact format:
SCORE: X/10
ISSUES: [comma-separated list of specific issues, or "None" if no issues found]
ANALYSIS: [2-3 sentences of detailed feedback about the overall visual quality]

Be specific about any issues found. A perfect score (10/10) should only be given if there are absolutely no visual issues.`;

  try {
    const { stdout, stderr } = await execAsync(
      `claude -p "${filePath}" "${prompt.replace(/"/g, '\\"')}"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer for large responses
    );

    if (stderr) {
      console.warn(`Warning during analysis: ${stderr}`);
    }

    // Parse the output
    const scoreMatch = stdout.match(/SCORE:\s*(\d+)(?:\/10)?/i);
    const issuesMatch = stdout.match(/ISSUES:\s*([\s\S]+?)(?=ANALYSIS:|$)/i);
    const analysisMatch = stdout.match(/ANALYSIS:\s*([\s\S]+)$/i);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const issuesText = issuesMatch?.[1]?.trim() || '';
    const issues = issuesText.toLowerCase() === 'none' || issuesText === ''
      ? []
      : issuesText.split(/[,\n]/)
          .map(i => i.trim())
          .filter(i => i.length > 0);

    const analysis = analysisMatch?.[1]?.trim() || stdout.trim();

    console.log(`✓ Score: ${score}/10, Issues: ${issues.length}`);

    return {
      file: path.basename(filePath),
      analysis,
      issues,
      score,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);

    return {
      file: path.basename(filePath),
      analysis: `Error during analysis: ${error instanceof Error ? error.message : String(error)}`,
      issues: ['Analysis failed - could not process screenshot'],
      score: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Analyzes all screenshots in the directory
 */
async function analyzeAllScreenshots(screenshotsDir: string): Promise<AnalysisReport> {
  console.log(`\n${'='.repeat(60)}`);
  console.log('SCREENSHOT ANALYSIS - Claude Vision');
  console.log(`${'='.repeat(60)}\n`);

  const files = await readdir(screenshotsDir);
  const pngFiles = files.filter(f => f.endsWith('.png')).sort();

  console.log(`Found ${pngFiles.length} screenshots to analyze\n`);

  if (pngFiles.length === 0) {
    throw new Error(`No screenshots found in ${screenshotsDir}`);
  }

  const results: AnalysisResult[] = [];

  // Analyze each screenshot sequentially (to avoid overwhelming the API)
  for (const file of pngFiles) {
    const filePath = path.join(screenshotsDir, file);
    const result = await analyzeScreenshot(filePath);
    results.push(result);

    // Small delay between requests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalScore / results.length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return {
    results,
    averageScore: avgScore,
    totalIssues,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates a comprehensive markdown report
 */
function generateMarkdownReport(report: AnalysisReport): string {
  const { results, averageScore, totalIssues, timestamp } = report;

  let qualityLevel = '⚠️ Needs Improvement';
  if (averageScore >= 9) qualityLevel = '✅ Excellent';
  else if (averageScore >= 7) qualityLevel = '✓ Good';

  return `# Visual Analysis Report

**Generated**: ${new Date(timestamp).toLocaleString()}
**Tool**: Claude Code Vision API
**Status**: ${qualityLevel}

## Summary

| Metric | Value |
|--------|-------|
| Screenshots Analyzed | ${results.length} |
| Average Score | **${averageScore.toFixed(1)}/10** |
| Total Issues Found | ${totalIssues} |
| Screenshots with Issues | ${results.filter(r => r.issues.length > 0).length} |
| Perfect Scores (10/10) | ${results.filter(r => r.score === 10).length} |

## Score Distribution

${results.map(r => `- ${r.file}: **${r.score}/10** ${r.score >= 9 ? '🌟' : r.score >= 7 ? '✓' : '⚠️'}`).join('\n')}

## Detailed Results

${results.map(r => `
### ${r.file}

**Score**: ${r.score}/10 ${r.score >= 9 ? '🌟 Excellent' : r.score >= 7 ? '✓ Good' : r.score >= 5 ? '⚠️ Fair' : '❌ Poor'}

${r.issues.length > 0 ? `
**Issues Found** (${r.issues.length}):
${r.issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}
` : '**✓ No issues found**'}

**Analysis**:
${r.analysis}

---
`).join('\n')}

## Recommendations

${averageScore < 7 ? `
### ⚠️ Action Required

Average score below 7.0 indicates visual issues that need immediate attention.

**Priority Actions**:
1. Review and fix all listed issues above
2. Focus on screenshots with scores below 7/10
3. Re-run screenshot analysis after fixes
4. Update visual regression baseline once issues are resolved

**Critical Issues** (${results.filter(r => r.score < 7).length} screenshots):
${results.filter(r => r.score < 7).map(r => `- \`${r.file}\` (${r.score}/10): ${r.issues.join(', ')}`).join('\n')}
` : averageScore < 9 ? `
### ✓ Good Visual Quality

Visual quality is good with some minor improvements needed.

**Suggested Improvements**:
${results.filter(r => r.issues.length > 0).map(r => `- \`${r.file}\`: ${r.issues.join(', ')}`).join('\n') || 'None'}

**Next Steps**:
1. Address minor issues listed above
2. Consider establishing these as visual regression baselines
3. Set up automated visual regression testing
` : `
### ✅ Excellent Visual Quality

All screenshots meet high quality standards!

**Next Steps**:
1. Establish these as visual regression baselines
2. Set up automated visual regression testing in CI/CD
3. Document the baseline establishment date
4. Consider adding more test scenarios
`}

## Test Coverage

Screenshots captured:
${results.map((r, idx) => `${idx + 1}. ${r.file}`).join('\n')}

## Notes

- Analysis performed using Claude Code vision capabilities
- Scores are based on UI/UX best practices, visual consistency, and data presentation
- Issues are identified through AI-powered visual analysis
- This report should be reviewed by a human for final validation

---

*Generated by OilField Screenshot Analysis Script*
*Timestamp: ${timestamp}*
`;
}

/**
 * Prints a console summary of the analysis
 */
function printConsoleSummary(report: AnalysisReport): void {
  const { results, averageScore, totalIssues } = report;

  console.log(`\n${'='.repeat(60)}`);
  console.log('ANALYSIS SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  console.log(`Total Screenshots: ${results.length}`);
  console.log(`Average Score: ${averageScore.toFixed(1)}/10`);
  console.log(`Total Issues: ${totalIssues}\n`);

  console.log('Individual Results:');
  results.forEach(result => {
    const emoji = result.score >= 9 ? '🌟' : result.score >= 7 ? '✓' : '⚠️';
    console.log(`  ${emoji} ${result.file.padEnd(40)} ${result.score}/10`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }
  });

  console.log(`\n${'='.repeat(60)}`);

  if (averageScore >= 9) {
    console.log('✅ Excellent! All screenshots are high quality.');
  } else if (averageScore >= 7) {
    console.log('✓ Good quality with some minor improvements needed.');
  } else {
    console.log('⚠️ Action required - visual issues detected.');
  }

  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const screenshotsDir = path.join(__dirname, '../frontend/test-results/screenshots');

    console.log(`Screenshots directory: ${screenshotsDir}`);

    // Run analysis
    const report = await analyzeAllScreenshots(screenshotsDir);

    // Print console summary
    printConsoleSummary(report);

    // Generate and save markdown report
    const reportPath = path.join(screenshotsDir, 'VISUAL_ANALYSIS_REPORT.md');
    const markdown = generateMarkdownReport(report);
    await writeFile(reportPath, markdown, 'utf-8');

    console.log(`\n✓ Report saved to: ${reportPath}\n`);

    // Also save JSON for programmatic access
    const jsonPath = path.join(screenshotsDir, 'analysis-results.json');
    await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`✓ JSON data saved to: ${jsonPath}\n`);

    // Exit with error code if quality is poor
    if (report.averageScore < 7) {
      console.error('⚠️  Analysis failed: Average score below 7.0');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run the analysis
main();
