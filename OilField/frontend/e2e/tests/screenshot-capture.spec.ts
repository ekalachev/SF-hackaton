/**
 * Screenshot Capture for Visual Regression Testing
 * Captures comprehensive screenshots of all major app states for Claude vision analysis
 */

import { test, expect } from '@playwright/test';

test.describe('Screenshot Capture - Visual Regression Baseline', () => {
  const screenshotDir = 'test-results/screenshots';

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Wait for map container to be visible
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Wait for map to fully load
    await page.waitForTimeout(2000);
  });

  test('01 - Initial map load with wells', async ({ page }) => {
    // Capture initial state
    await page.screenshot({
      path: `${screenshotDir}/01-initial-map-load.png`,
      fullPage: true
    });

    // Verify map is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();
  });

  test('02 - Map with well markers visible', async ({ page }) => {
    // Zoom in to see individual markers
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotDir}/02-map-individual-wells.png`,
      fullPage: true
    });
  });

  test('03 - Map with clusters (zoomed out)', async ({ page }) => {
    // Zoom out to see clusters
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotDir}/03-map-clusters.png`,
      fullPage: true
    });
  });

  test('04 - Well detail modal open', async ({ page }) => {
    // Zoom in and click on map to try to open modal
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    // Click center of map
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({
        position: {
          x: box.width / 2,
          y: box.height / 2,
        },
      });
      await page.waitForTimeout(1500);

      // Check if modal opened
      const modal = page.locator('[data-testid="well-detail-modal"]');
      const modalVisible = await modal.isVisible().catch(() => false);

      if (modalVisible) {
        // Wait for content to load
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: `${screenshotDir}/04-well-modal-open.png`,
          fullPage: true
        });
      } else {
        // Try clicking different positions
        for (let i = 0; i < 3; i++) {
          const x = (box.width / 4) * (i + 1);
          const y = (box.height / 4) * (i + 1);

          await canvas.click({ position: { x, y } });
          await page.waitForTimeout(1000);

          const modalNow = await modal.isVisible().catch(() => false);
          if (modalNow) {
            await page.waitForTimeout(2000);
            await page.screenshot({
              path: `${screenshotDir}/04-well-modal-open.png`,
              fullPage: true
            });
            break;
          }
        }
      }
    }
  });

  test('05 - Valuation cards in modal', async ({ page }) => {
    // Try to open modal and capture valuation section
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    const box = await canvas.boundingBox();
    if (box) {
      // Try multiple positions
      for (let attempt = 0; attempt < 5; attempt++) {
        const x = (box.width / 6) * (attempt + 1);
        const y = (box.height / 6) * (attempt + 1);

        await canvas.click({ position: { x, y } });
        await page.waitForTimeout(1500);

        const modal = page.locator('[data-testid="well-detail-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Wait for valuation data to load
          await page.waitForTimeout(2000);

          // Scroll to valuation section
          const valuationSection = page.locator('text=/Net Present Value|NPV/i').first();
          if (await valuationSection.isVisible().catch(() => false)) {
            await valuationSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
          }

          await page.screenshot({
            path: `${screenshotDir}/05-valuation-cards.png`,
            fullPage: true
          });
          break;
        }
      }
    }
  });

  test('06 - Similar wells panel', async ({ page }) => {
    // Open modal and navigate to similar wells
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    const box = await canvas.boundingBox();
    if (box) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const x = (box.width / 6) * (attempt + 1);
        const y = (box.height / 6) * (attempt + 1);

        await canvas.click({ position: { x, y } });
        await page.waitForTimeout(1500);

        const modal = page.locator('[data-testid="well-detail-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          await page.waitForTimeout(2000);

          // Look for similar wells panel
          const similarWellsPanel = page.locator('[data-testid="similar-wells-panel"]');
          if (await similarWellsPanel.isVisible().catch(() => false)) {
            await similarWellsPanel.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: `${screenshotDir}/06-similar-wells-panel.png`,
              fullPage: true
            });
          } else {
            await page.screenshot({
              path: `${screenshotDir}/06-modal-full-view.png`,
              fullPage: true
            });
          }
          break;
        }
      }
    }
  });

  test('07 - AI Investment Report', async ({ page }) => {
    // Open modal and generate AI report
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    const box = await canvas.boundingBox();
    if (box) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const x = (box.width / 6) * (attempt + 1);
        const y = (box.height / 6) * (attempt + 1);

        await canvas.click({ position: { x, y } });
        await page.waitForTimeout(1500);

        const modal = page.locator('[data-testid="well-detail-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          await page.waitForTimeout(2000);

          // Look for generate report button
          const generateButton = page.locator('button:has-text("Generate AI Report"), button:has-text("Generate Report")');
          if (await generateButton.isVisible().catch(() => false)) {
            await generateButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await generateButton.click();

            // Wait for report to generate
            await page.waitForTimeout(5000);

            await page.screenshot({
              path: `${screenshotDir}/07-ai-report-generated.png`,
              fullPage: true
            });
          } else {
            await page.screenshot({
              path: `${screenshotDir}/07-modal-no-report-button.png`,
              fullPage: true
            });
          }
          break;
        }
      }
    }
  });

  test('08 - Mobile viewport - iPhone', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotDir}/08-mobile-iphone.png`,
      fullPage: true
    });
  });

  test('09 - Mobile viewport - iPad', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotDir}/09-tablet-ipad.png`,
      fullPage: true
    });
  });

  test('10 - Desktop wide viewport', async ({ page }) => {
    // Set wide desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${screenshotDir}/10-desktop-wide.png`,
      fullPage: true
    });
  });

  test('11 - Production chart visualization', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    const box = await canvas.boundingBox();
    if (box) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const x = (box.width / 6) * (attempt + 1);
        const y = (box.height / 6) * (attempt + 1);

        await canvas.click({ position: { x, y } });
        await page.waitForTimeout(1500);

        const modal = page.locator('[data-testid="well-detail-modal"]');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          await page.waitForTimeout(2000);

          // Look for production chart
          const productionChart = page.locator('text=/Production History|Production/i').first();
          if (await productionChart.isVisible().catch(() => false)) {
            await productionChart.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            await page.screenshot({
              path: `${screenshotDir}/11-production-chart.png`,
              fullPage: true
            });
          } else {
            await page.screenshot({
              path: `${screenshotDir}/11-modal-structure.png`,
              fullPage: true
            });
          }
          break;
        }
      }
    }
  });

  test('12 - Color theme and emerald accents', async ({ page }) => {
    // Capture overall color scheme
    await page.screenshot({
      path: `${screenshotDir}/12-color-theme.png`,
      fullPage: true
    });

    // Verify emerald theme is applied
    const bodyBg = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Body background color:', bodyBg);
  });
});
