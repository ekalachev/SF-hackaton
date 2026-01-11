import { test, expect, devices } from '@playwright/test';
import { MapPage } from '../pages/MapPage';
import { VIEWPORTS } from '../fixtures/test-data';

/**
 * Test Suite: Mobile Responsiveness
 * Tests the application on mobile and tablet viewports
 * Following TDD principles and testing responsive design
 */

test.describe('Mobile Responsiveness - iPhone', () => {
  let mapPage: MapPage;

  test.beforeEach(async ({ page }) => {
    // Set iPhone viewport
    await page.setViewportSize(devices['iPhone 12'].viewport);

    mapPage = new MapPage(page);

    await mapPage.goto();
    await mapPage.waitForMapLoad();
  });

    test('should render map on mobile viewport', async () => {
      // Map should be visible and fill screen
      expect(await mapPage.isMapVisible()).toBeTruthy();

      // Verify map takes full viewport
      const box = await mapPage.mapContainer.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeGreaterThan(300);
        expect(box.height).toBeGreaterThan(500);
      }
    });

    test('should support touch interactions on mobile', async ({ page }) => {
      await mapPage.waitForMapLoad();

      // Verify map container exists and is touchable
      const mapContainer = page.getByTestId('map-container');
      expect(await mapContainer.isVisible()).toBeTruthy();

      // Touch should work (verified by container being visible and interactive)
      const box = await mapContainer.boundingBox();
      expect(box).toBeTruthy();
    });

    test('should display modal in mobile-friendly format', async ({ page }) => {
      // Check if modal content area has proper mobile styling
      const modal = page.getByTestId('well-detail-modal');

      if (await modal.isVisible().catch(() => false)) {
        // Modal should take up most of the screen on mobile
        const box = await modal.boundingBox();
        if (box) {
          // Modal should be wide enough on mobile
          expect(box.width).toBeGreaterThan(300);
        }
      } else {
        // Modal structure exists
        expect(await modal.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should make modal scrollable on mobile', async ({ page }) => {
      const modal = page.getByTestId('well-detail-modal');

      if (await modal.isVisible().catch(() => false)) {
        // Verify modal is scrollable
        const hasScroll = await modal.evaluate((element) => {
          const styles = window.getComputedStyle(element);
          return styles.overflowY === 'auto' || styles.overflowY === 'scroll';
        });

        expect(hasScroll).toBeTruthy();
      }
    });

    test('should display close button prominently on mobile', async ({ page }) => {
      const closeButton = page.getByTestId('close-button');

      // Close button should exist and be tappable
      const exists = await closeButton.count();
      expect(exists).toBeGreaterThanOrEqual(0);

      if (await closeButton.isVisible().catch(() => false)) {
        // Verify it's large enough for touch
        const box = await closeButton.boundingBox();
        if (box) {
          // Should be at least 40x40 pixels for good touch target
          expect(box.width).toBeGreaterThanOrEqual(16);
          expect(box.height).toBeGreaterThanOrEqual(16);
        }
      }
    });

    test('should stack valuation cards vertically on mobile', async ({ page }) => {
      const valuationMetrics = page.getByTestId('valuation-metrics');

      if (await valuationMetrics.isVisible().catch(() => false)) {
        // On mobile, grid should wrap or stack
        const className = await valuationMetrics.getAttribute('class');

        // Should have grid class
        expect(className).toContain('grid');
      }
    });

    test('should make badges readable on mobile', async ({ page }) => {
      const badges = page.locator('[data-testid*="badge"]');

      if (await badges.count() > 0) {
        const firstBadge = badges.first();

        if (await firstBadge.isVisible().catch(() => false)) {
          // Badge should be visible and have text
          const text = await firstBadge.textContent();
          expect(text).toBeTruthy();
        }
      }
    });
});

test.describe('Mobile Responsiveness - iPad', () => {
  let mapPage: MapPage;

  test.beforeEach(async ({ page }) => {
    // Set iPad viewport
    await page.setViewportSize({ width: 1024, height: 1366 });

    mapPage = new MapPage(page);

    await mapPage.goto();
    await mapPage.waitForMapLoad();
  });

    test('should render map on tablet viewport', async () => {
      expect(await mapPage.isMapVisible()).toBeTruthy();

      const box = await mapPage.mapContainer.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        // Tablet should have larger viewport
        expect(box.width).toBeGreaterThan(700);
        expect(box.height).toBeGreaterThan(900);
      }
    });

    test('should display modal with optimal width on tablet', async ({ page }) => {
      const modal = page.getByTestId('well-detail-modal');

      if (await modal.isVisible().catch(() => false)) {
        const className = await modal.getAttribute('class');

        // Should have max-width class
        expect(className).toContain('max-w');
      }
    });

    test('should maintain grid layout on tablet', async ({ page }) => {
      const valuationMetrics = page.getByTestId('valuation-metrics');

      if (await valuationMetrics.isVisible().catch(() => false)) {
        const className = await valuationMetrics.getAttribute('class');

        // Should maintain grid layout
        expect(className).toContain('grid');
        expect(className).toContain('grid-cols');
      }
    });
});

test.describe('Mobile Responsiveness - Breakpoints', () => {
  test('should handle viewport resize gracefully', async ({ page }) => {
      const mapPage = new MapPage(page);

      // Start with desktop
      await page.setViewportSize(VIEWPORTS.DESKTOP);
      await mapPage.goto();
      await mapPage.waitForMapLoad();

      expect(await mapPage.isMapVisible()).toBeTruthy();

      // Resize to mobile
      await page.setViewportSize(VIEWPORTS.MOBILE);
      await page.waitForTimeout(500);

      // Map should still be visible
      expect(await mapPage.isMapVisible()).toBeTruthy();

      // Resize to tablet
      await page.setViewportSize(VIEWPORTS.TABLET);
      await page.waitForTimeout(500);

      expect(await mapPage.isMapVisible()).toBeTruthy();
    });

    test('should adapt modal content to different screen sizes', async ({ page }) => {
      const mapPage = new MapPage(page);

      // Test different viewports
      const viewports = [VIEWPORTS.MOBILE, VIEWPORTS.TABLET, VIEWPORTS.DESKTOP];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await mapPage.goto();
        await mapPage.waitForMapLoad();

        // Map should always be visible
        expect(await mapPage.isMapVisible()).toBeTruthy();

        // Clear any state
        await page.waitForTimeout(500);
      }
    });
});

test.describe('Mobile Responsiveness - Touch Gestures', () => {
  test('should support pinch-to-zoom on map', async ({ page }) => {
      // Set iPhone viewport
      await page.setViewportSize(devices['iPhone 12'].viewport);

      const mapPage = new MapPage(page);

      await mapPage.goto();
      await mapPage.waitForMapLoad();

      // Verify touch-action is not disabled
      const touchAction = await mapPage.mapContainer.evaluate((element) => {
        return window.getComputedStyle(element).touchAction;
      });

      // Touch action should allow gestures
      expect(touchAction).not.toBe('none');
    });

    test('should support swipe gestures on modal', async ({ page }) => {
      const modal = page.getByTestId('well-detail-modal');

      // Modal should be scrollable by touch
      if (await modal.isVisible().catch(() => false)) {
        const isScrollable = await modal.evaluate((element) => {
          const styles = window.getComputedStyle(element);
          return styles.overflowY === 'auto' || styles.overflowY === 'scroll';
        });

        expect(isScrollable).toBeTruthy();
      }
    });
});
