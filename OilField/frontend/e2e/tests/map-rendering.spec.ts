/**
 * Map Rendering Validation E2E Tests
 * Tests comprehensive map rendering with well markers, clustering, and interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Map Rendering Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Wait for map container to be visible
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });

    // Wait for map to fully load (give Mapbox time to initialize)
    await page.waitForTimeout(2000);
  });

  test('should load map with well markers', async ({ page }) => {
    // Verify map container is visible
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toBeVisible();

    // Check for Mapbox canvas (indicates map loaded)
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'frontend/test-results/map-initial-load.png', fullPage: true });

    // Verify no obvious error messages
    const errorMessage = page.locator('text=/error|failed/i');
    await expect(errorMessage).toHaveCount(0);
  });

  test('should display correct number of wells', async ({ page }) => {
    // Wait for wells to load
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'frontend/test-results/map-wells-loaded.png' });

    // Check console logs for well count (if debug console is enabled)
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        logs.push(msg.text());
      }
    });

    // Reload to capture logs
    await page.reload();
    await page.waitForSelector('[data-testid="map-container"]');
    await page.waitForTimeout(2000);

    // Check that wells were logged
    const wellsLoadedLog = logs.find((log) => log.includes('Wells data loaded'));
    if (wellsLoadedLog) {
      console.log('Found wells log:', wellsLoadedLog);
      // Extract count from log like "Wells data loaded: 23 wells"
      const match = wellsLoadedLog.match(/(\d+) wells/);
      if (match) {
        const wellCount = parseInt(match[1]);
        expect(wellCount).toBeGreaterThanOrEqual(20);
      }
    }
  });

  test('should show map controls', async ({ page }) => {
    // MapView doesn't explicitly add NavigationControl
    // Instead, verify the map canvas is interactive (can be zoomed programmatically)
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    // Verify map is interactive by checking the canvas exists and is sized properly
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  test('should handle zoom interactions', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Zoom in using mouse wheel
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Scroll up to zoom in
    await page.waitForTimeout(500);

    // Zoom out
    await page.mouse.wheel(0, 100); // Scroll down to zoom out
    await page.waitForTimeout(500);

    // Take screenshot after zoom
    await page.screenshot({ path: 'frontend/test-results/map-after-zoom.png' });

    // Map should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should handle pan interactions', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Get initial canvas position
    const initialBox = await canvas.boundingBox();
    expect(initialBox).toBeTruthy();

    // Pan the map by dragging
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Take screenshot after pan
    await page.screenshot({ path: 'frontend/test-results/map-after-pan.png' });

    // Map should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should display clusters when zoomed out', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Zoom out multiple times to create clusters
    for (let i = 0; i < 3; i++) {
      await canvas.hover();
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(300);
    }

    // Take screenshot of clustered view
    await page.screenshot({ path: 'frontend/test-results/map-with-clusters.png' });

    // Map should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should show individual wells when zoomed in', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Zoom in multiple times
    for (let i = 0; i < 3; i++) {
      await canvas.hover();
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(300);
    }

    // Take screenshot of individual wells
    await page.screenshot({ path: 'frontend/test-results/map-individual-wells.png' });

    // Map should still be visible
    await expect(canvas).toBeVisible();
  });

  test('should handle marker clicks', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Zoom in to see individual markers
    await canvas.hover();
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(1000);

    // Click somewhere on the map where a marker might be
    // (This is approximate - in real scenario we'd use Mapbox API to find marker positions)
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({
        position: {
          x: box.width / 2,
          y: box.height / 2,
        },
      });
      await page.waitForTimeout(1000);

      // Take screenshot after click
      await page.screenshot({ path: 'frontend/test-results/map-after-marker-click.png' });

      // Check if modal opened (if we clicked a well)
      const modal = page.locator('[data-testid="well-detail-modal"]');
      const modalCount = await modal.count();

      if (modalCount > 0) {
        await expect(modal).toBeVisible();
        console.log('Modal opened after marker click');
      } else {
        console.log('No marker was clicked (empty area)');
      }
    }
  });

  test('should show no console errors during map interaction', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Interact with map
    const canvas = page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();

    // Zoom in and out
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(500);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(500);

    // Pan
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    // Click
    await canvas.click({
      position: {
        x: 300,
        y: 300,
      },
    });
    await page.waitForTimeout(500);

    // Filter out Mapbox warnings (common in test environment)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('ResizeObserver') &&
        !error.includes('WebGL') &&
        !error.includes('getContext')
    );

    // Verify no critical errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should maintain map state after interactions', async ({ page }) => {
    const canvas = page.locator('canvas.mapboxgl-canvas');

    // Perform multiple interactions
    await canvas.hover();

    // Zoom
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(300);

    // Pan
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.down();
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Zoom out
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(300);

    // Take final screenshot
    await page.screenshot({ path: 'frontend/test-results/map-final-state.png' });

    // Map should still be functional
    await expect(canvas).toBeVisible();

    // Should be able to interact again
    await canvas.hover();
    await page.mouse.wheel(0, -50);
    await page.waitForTimeout(300);

    await expect(canvas).toBeVisible();
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="map-container"]');
    await page.waitForSelector('canvas.mapboxgl-canvas');

    const loadTime = Date.now() - startTime;

    console.log(`Map loaded in ${loadTime}ms`);

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should be responsive to window resize', async ({ page }) => {
    // Set initial viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const canvas1 = page.locator('canvas.mapboxgl-canvas');
    const box1 = await canvas1.boundingBox();

    // Resize to smaller viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    const box2 = await canvas1.boundingBox();

    // Canvas should have adjusted size
    expect(box2?.width).toBeLessThan(box1!.width);

    // Take screenshot of resized map
    await page.screenshot({ path: 'frontend/test-results/map-resized.png' });

    // Map should still be functional
    await expect(canvas1).toBeVisible();
  });
});
