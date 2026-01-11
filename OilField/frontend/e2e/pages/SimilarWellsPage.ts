import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for SimilarWellsPanel component
 * Encapsulates all interactions with the similar wells panel
 * Following Single Responsibility Principle
 */
export class SimilarWellsPage {
  readonly page: Page;
  readonly panel: Locator;
  readonly loadingState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.panel = page.getByTestId('similar-wells-panel');
    this.loadingState = page.getByTestId('similar-wells-loading');
  }

  /**
   * Wait for panel to be visible
   */
  async waitForPanel(): Promise<void> {
    await this.panel.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if panel is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.panel.isVisible();
  }

  /**
   * Check if loading state is showing
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Get a specific similar well by well ID
   */
  getSimilarWell(wellId: string): Locator {
    return this.page.getByTestId(`similar-well-${wellId}`);
  }

  /**
   * Get all similar wells
   */
  getAllSimilarWells(): Locator {
    return this.page.locator('[data-testid^="similar-well-"]');
  }

  /**
   * Click on a similar well
   */
  async clickSimilarWell(wellId: string): Promise<void> {
    await this.getSimilarWell(wellId).click();
  }

  /**
   * Get the count of similar wells displayed
   */
  async getSimilarWellsCount(): Promise<number> {
    return await this.getAllSimilarWells().count();
  }

  /**
   * Get similarity score for a well
   */
  async getSimilarityScore(wellId: string): Promise<string> {
    const well = this.getSimilarWell(wellId);
    const scoreElement = well.getByTestId('similarity-score');
    return await scoreElement.textContent() || '';
  }

  /**
   * Get match reasons for a well
   */
  async getMatchReasons(wellId: string): Promise<string[]> {
    const well = this.getSimilarWell(wellId);
    const reasonsContainer = well.getByTestId('match-reasons');
    const reasons = reasonsContainer.getByTestId('match-reason');
    const count = await reasons.count();

    const reasonTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await reasons.nth(i).textContent();
      if (text) reasonTexts.push(text.trim());
    }

    return reasonTexts;
  }

  /**
   * Check if any similar well has match reasons
   */
  async hasMatchReasons(): Promise<boolean> {
    const matchReasons = this.page.getByTestId('match-reasons');
    return await matchReasons.first().isVisible().catch(() => false);
  }
}
