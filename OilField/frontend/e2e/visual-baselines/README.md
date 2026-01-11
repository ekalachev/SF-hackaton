# Visual Regression Baselines

This directory contains baseline screenshots for visual regression testing of the OilField oil well mapping application.

## Purpose

These screenshots serve as the reference point for detecting visual regressions in the application's UI. When changes are made to the codebase, new screenshots can be captured and compared against these baselines to identify unintended visual changes.

## Current Status

**⚠️ IMPORTANT**: The current baseline screenshots captured on 2025-11-01 reveal a **critical rendering issue**. Well markers are not visible in any of the screenshots, despite the backend successfully loading well data. These baselines should **NOT** be used for regression testing until the rendering issue is resolved.

## Baseline Images

Current baselines (captured with rendering issue):

1. `01-initial-map-load.png` - Initial map view on page load
2. `02-map-individual-wells.png` - Map view after zoom in (should show individual wells)
3. `03-map-clusters.png` - Map view after zoom out (should show well clusters)
4. `08-mobile-iphone.png` - Mobile responsive view (iPhone 375x667)
5. `09-tablet-ipad.png` - Tablet responsive view (iPad 768x1024)
6. `10-desktop-wide.png` - Wide desktop view (1920x1080)
7. `12-color-theme.png` - Overall color scheme and theme verification

## Known Issues

### Critical Issue: Well Markers Not Rendering

**Status**: OPEN
**Severity**: Blocker
**Date Identified**: 2025-11-01

All current baseline screenshots show blank Mapbox maps without well markers, despite:
- Backend successfully loading 25 wells (confirmed in test logs)
- Mapbox map container initializing correctly
- Map interactions (zoom, pan) working without errors

**Impact**: These baselines cannot be used for meaningful visual regression testing until well markers are rendering correctly.

**See**: `test-results/screenshots/VISUAL_ANALYSIS_REPORT.md` for detailed analysis and recommendations.

## Updating Baselines

Once the rendering issue is resolved and well markers are visible:

### Step 1: Capture New Screenshots

```bash
cd frontend
npm run test:e2e -- screenshot-capture.spec.ts --project=chromium
```

### Step 2: Analyze with Claude Code Vision

Review all screenshots manually or use the analysis script:

```bash
# Manual review using Read tool in Claude Code
# Or automated analysis (once claude CLI is available)
cd ..
npx tsx scripts/analyze-screenshots.ts
```

### Step 3: Verify Quality

Check the analysis report:

```bash
cat frontend/test-results/screenshots/VISUAL_ANALYSIS_REPORT.md
```

Ensure:
- Average visual quality score ≥ 8.0/10
- Well markers visible at appropriate zoom levels
- Clusters visible when zoomed out
- UI elements render correctly
- Emerald theme applied consistently
- No critical visual bugs

### Step 4: Update Baselines

If screenshots pass quality checks:

```bash
# Copy new screenshots to baselines
cp frontend/test-results/screenshots/*.png frontend/e2e/visual-baselines/

# Update this README with new baseline date
# Document what changed from previous baselines
```

### Step 5: Commit with Documentation

```bash
git add frontend/e2e/visual-baselines/
git commit -m "test(visual): Update visual regression baselines

- New baselines captured on [DATE]
- Changes: [describe what changed]
- Quality score: [X.X/10]
- All critical issues resolved

🤖 Generated with Claude Code"
```

## Visual Analysis with Claude Code

### Using Read Tool (Current Method)

Claude Code can directly analyze screenshots using the Read tool with vision capabilities:

```typescript
// In Claude Code session
Read: /path/to/screenshot.png
// Claude will display and analyze the image
```

### Using Claude CLI (Future Method)

Once the `claude` CLI command is available in PATH:

```bash
# Analyze a single screenshot
claude -p frontend/test-results/screenshots/01-initial-map-load.png \
  "Analyze this map view. Check if wells are visible, colors are correct, and layout is clean."

# Run automated analysis script
npx tsx scripts/analyze-screenshots.ts
```

## Baseline Versioning

### Version History

**v0.1.0** - 2025-11-01 (INVALID)
- Initial baselines captured
- **Status**: Invalid due to well marker rendering issue
- **Issues**: Wells not visible, cannot use for regression testing
- **Action Required**: Re-capture after fixing rendering bug

**Future versions will be documented here after valid baselines are established**

## Test Scenarios Covered

When valid baselines are established, they will cover:

### Desktop Views
- ✓ Initial map load with well markers
- ✓ Individual wells visible when zoomed in
- ✓ Well clusters when zoomed out
- ✓ Wide desktop viewport (1920x1080)

### Responsive Views
- ✓ Mobile viewport (iPhone 375x667)
- ✓ Tablet viewport (iPad 768x1024)

### UI Components (to be added when rendering is fixed)
- ⏳ Well detail modal open
- ⏳ Valuation cards display
- ⏳ Similar wells panel with AI scores
- ⏳ AI investment report generated
- ⏳ Production chart visualization

### Theme Verification
- ⏳ Emerald color theme consistency
- ⏳ Text readability
- ⏳ Component styling

## Integration with CI/CD

Once valid baselines are established, visual regression testing can be integrated into the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run visual regression tests
  run: |
    npm run test:e2e -- screenshot-capture.spec.ts
    npx tsx scripts/analyze-screenshots.ts

- name: Upload screenshots as artifacts
  uses: actions/upload-artifact@v3
  with:
    name: visual-regression-results
    path: frontend/test-results/screenshots/

- name: Comment on PR with results
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('frontend/test-results/screenshots/VISUAL_ANALYSIS_REPORT.md', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: report
      });
```

## Tools and Technologies

- **Playwright**: Browser automation for screenshot capture
- **Mapbox GL JS**: Interactive map rendering
- **Claude Code Vision**: AI-powered visual analysis
- **TypeScript**: Type-safe screenshot analysis scripts

## Best Practices

1. **Always analyze before committing**: Never commit new baselines without visual analysis
2. **Document changes**: Clearly describe what changed and why in commit messages
3. **Review diffs**: When baselines change, manually review the visual differences
4. **Track scores**: Monitor visual quality scores over time
5. **Incremental updates**: Update baselines incrementally as features are added
6. **Version control**: Keep old baselines in git history for comparison

## Troubleshooting

### Baselines Don't Match Current Screenshots

If visual regression tests fail:

1. Review the differences carefully
2. Determine if changes are intentional (new features) or bugs
3. If intentional, update baselines following the process above
4. If bugs, fix the code and re-test

### Screenshots Show Blank Maps

This is the current known issue. See:
- `test-results/screenshots/VISUAL_ANALYSIS_REPORT.md` for detailed analysis
- `frontend/src/components/map/MapView.tsx` for map rendering code
- Test logs for data loading confirmation

### Baselines Become Outdated

Baselines should be updated when:
- Intentional UI changes are made
- New features are added
- Design system is updated
- Theme colors change
- Layout improvements are implemented

## Contact

For questions about visual regression testing, see:
- Sprint 6 documentation: `sprints/sprint-6-integration-debug/`
- Task 606 specification: `sprints/sprint-6-integration-debug/task-606-screenshot-analysis.md`
- Analysis report: `frontend/test-results/screenshots/VISUAL_ANALYSIS_REPORT.md`

---

*Last Updated*: 2025-11-01
*Status*: Baselines invalid, pending rendering fix
*Next Action*: Fix well marker rendering issue, then re-capture baselines
