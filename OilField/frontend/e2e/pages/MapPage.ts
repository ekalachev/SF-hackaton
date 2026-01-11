import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for MapView component
 * Encapsulates all interactions with the map page
 * Following Single Responsibility Principle
 */
export class MapPage {
  readonly page: Page;
  readonly mapContainer: Locator;
  readonly wellMarkers: Locator;
  readonly clusterMarkers: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mapContainer = page.getByTestId('map-container');
    // MapBox markers don't have data-testid, we'll use canvas interaction
    this.wellMarkers = page.locator('.mapboxgl-marker');
    this.clusterMarkers = page.locator('[class*="cluster"]');
  }

  /**
   * Navigate to the map page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Wait for the map to be fully loaded
   */
  async waitForMapLoad(): Promise<void> {
    await this.mapContainer.waitFor({ state: 'visible' });
    // Wait for MapBox to initialize
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if map container is visible
   */
  async isMapVisible(): Promise<boolean> {
    return await this.mapContainer.isVisible();
  }

  /**
   * Click on a specific point on the map (well marker)
   * Uses coordinates relative to the map container
   */
  async clickMapPoint(x: number, y: number): Promise<void> {
    const box = await this.mapContainer.boundingBox();
    if (!box) throw new Error('Map container not found');

    await this.page.mouse.click(box.x + x, box.y + y);
  }

  /**
   * Click on the map center (should have wells)
   */
  async clickMapCenter(): Promise<void> {
    const box = await this.mapContainer.boundingBox();
    if (!box) throw new Error('Map container not found');

    await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  /**
   * Wait for well markers to be loaded
   * This checks if the canvas has been drawn with markers
   */
  async waitForWellMarkers(): Promise<void> {
    // Wait for the MapBox map to render layers
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('.mapboxgl-canvas') as HTMLCanvasElement;
      return canvas && canvas.width > 0 && canvas.height > 0;
    }, { timeout: 10000 });
  }
}
