import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for WellDetailModal component
 * Encapsulates all interactions with the well detail modal
 * Following Single Responsibility Principle
 */
export class WellDetailModalPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly loadingState: Locator;
  readonly errorState: Locator;
  readonly closeButton: Locator;
  readonly wellName: Locator;
  readonly wellId: Locator;
  readonly wellBadges: Locator;
  readonly valuationBadge: Locator;
  readonly productionBadge: Locator;
  readonly statusBadge: Locator;
  readonly productionHistorySection: Locator;
  readonly valuationMetrics: Locator;
  readonly aiValueCard: Locator;
  readonly marketValueCard: Locator;
  readonly discountCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId('well-detail-modal');
    this.loadingState = page.getByTestId('loading-state');
    this.errorState = page.getByTestId('error-state');
    this.closeButton = page.getByTestId('close-button');
    this.wellName = page.getByTestId('well-name');
    this.wellId = page.getByTestId('well-id');
    this.wellBadges = page.getByTestId('well-badges');
    this.valuationBadge = page.getByTestId('valuation-badge');
    this.productionBadge = page.getByTestId('production-badge');
    this.statusBadge = page.getByTestId('status-badge');
    this.productionHistorySection = page.getByTestId('production-history-section');
    this.valuationMetrics = page.getByTestId('valuation-metrics');
    this.aiValueCard = page.getByTestId('ai-value-card');
    this.marketValueCard = page.getByTestId('market-value-card');
    this.discountCard = page.getByTestId('discount-card');
  }

  /**
   * Wait for modal to be visible
   */
  async waitForModal(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if modal is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Check if loading state is showing
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Check if error state is showing
   */
  async hasError(): Promise<boolean> {
    return await this.errorState.isVisible();
  }

  /**
   * Get the well name text
   */
  async getWellName(): Promise<string> {
    return await this.wellName.textContent() || '';
  }

  /**
   * Get the well ID text
   */
  async getWellId(): Promise<string> {
    const text = await this.wellId.textContent() || '';
    return text.split('•')[0].trim();
  }

  /**
   * Close modal using the X button
   */
  async closeWithButton(): Promise<void> {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Close modal using ESC key
   */
  async closeWithEsc(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Check if all main sections are rendered
   */
  async hasAllSections(): Promise<boolean> {
    const sections = await Promise.all([
      this.wellName.isVisible(),
      this.wellId.isVisible(),
      this.wellBadges.isVisible(),
    ]);
    return sections.every(visible => visible);
  }

  /**
   * Check if valuation metrics are displayed
   */
  async hasValuationMetrics(): Promise<boolean> {
    return await this.valuationMetrics.isVisible();
  }

  /**
   * Check if production chart is displayed
   */
  async hasProductionChart(): Promise<boolean> {
    return await this.productionHistorySection.isVisible();
  }

  /**
   * Scroll within the modal
   */
  async scrollDown(): Promise<void> {
    await this.modal.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  }

  /**
   * Get valuation discount percentage
   */
  async getDiscountPercent(): Promise<string> {
    return await this.discountCard.textContent() || '';
  }
}
