import { Page, Locator, expect } from '@playwright/test';
import { URLS } from '../fixtures/test-data';

/**
 * Page Object Model: Resume Complete/Download Page
 */
export class CompletePage {
  readonly page: Page;
  readonly candidateId: string;
  readonly successMessage: Locator;
  readonly statusIndicator: Locator;
  readonly downloadPdfButton: Locator;
  readonly downloadDocxButton: Locator;
  readonly downloadMilitaryPdf: Locator;
  readonly downloadCivilianPdf: Locator;
  readonly downloadCrosswalkPdf: Locator;
  readonly resumePreview: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page, candidateId: string) {
    this.page = page;
    this.candidateId = candidateId;

    this.successMessage = page.locator('[class*="success"], .success-message, h1:has-text("Ready"), h1:has-text("Complete")').first();
    this.statusIndicator = page.locator('[class*="status"], .status, [data-status]').first();

    // Download buttons - multiple selectors for robustness
    this.downloadPdfButton = page.getByRole('link', { name: /download.*pdf/i }).first();
    this.downloadDocxButton = page.getByRole('link', { name: /download.*docx|download.*word/i }).first();
    this.downloadMilitaryPdf = page.getByRole('link', { name: /military.*pdf|download.*military/i }).first();
    this.downloadCivilianPdf = page.getByRole('link', { name: /civilian.*pdf|download.*civilian/i }).first();
    this.downloadCrosswalkPdf = page.getByRole('link', { name: /crosswalk.*pdf|download.*crosswalk/i }).first();

    this.resumePreview = page.locator('[class*="preview"], iframe, .resume-preview');
    this.errorMessage = page.locator('[class*="error"], .error-message');
    this.retryButton = page.getByRole('button', { name: /retry|try again/i }).first();
  }

  async goto() {
    await this.page.goto(`${URLS.BASE}/intake/${this.candidateId}/complete`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`/intake/${this.candidateId}/complete|/candidate/${this.candidateId}`));
  }

  async waitForResumeReady(timeout = 120000) {
    // Poll for resume ready status
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await this.page.reload();
      await this.page.waitForLoadState('domcontentloaded');

      // Check if download buttons are visible
      const pdfVisible = await this.downloadPdfButton.isVisible().catch(() => false);
      const militaryVisible = await this.downloadMilitaryPdf.isVisible().catch(() => false);

      if (pdfVisible || militaryVisible) {
        return true;
      }

      // Check for error
      const errorVisible = await this.errorMessage.isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await this.errorMessage.textContent();
        throw new Error(`Resume generation failed: ${errorText}`);
      }

      await this.page.waitForTimeout(5000); // Poll every 5 seconds
    }

    throw new Error(`Resume not ready after ${timeout}ms`);
  }

  async downloadPdf(): Promise<string> {
    const downloadButton = this.downloadPdfButton.or(this.downloadMilitaryPdf).or(this.downloadCivilianPdf);
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    // Get the download URL
    const href = await downloadButton.getAttribute('href');
    if (!href) {
      throw new Error('Download button has no href');
    }

    // If it's a relative URL, make it absolute
    if (href.startsWith('/')) {
      return `${URLS.BASE}${href}`;
    }

    return href;
  }

  async verifyDownloadLinks() {
    // Check that at least one download option exists
    const pdfVisible = await this.downloadPdfButton.isVisible().catch(() => false);
    const docxVisible = await this.downloadDocxButton.isVisible().catch(() => false);
    const militaryVisible = await this.downloadMilitaryPdf.isVisible().catch(() => false);
    const civilianVisible = await this.downloadCivilianPdf.isVisible().catch(() => false);

    expect(pdfVisible || militaryVisible || civilianVisible).toBeTruthy();
  }

  async getStatus(): Promise<string> {
    if (await this.statusIndicator.isVisible().catch(() => false)) {
      return await this.statusIndicator.textContent() || 'unknown';
    }

    // Try to infer from page content
    const pageContent = await this.page.content();
    if (pageContent.includes('Ready') || pageContent.includes('Complete')) {
      return 'ready';
    }
    if (pageContent.includes('Processing') || pageContent.includes('Generating')) {
      return 'processing';
    }
    if (pageContent.includes('Error') || pageContent.includes('Failed')) {
      return 'error';
    }

    return 'unknown';
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
