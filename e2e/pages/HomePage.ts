import { Page, Locator, expect } from '@playwright/test';
import { URLS } from '../fixtures/test-data';

/**
 * Page Object Model: Homepage
 */
export class HomePage {
  readonly page: Page;
  readonly heroHeading: Locator;
  readonly heroSubheading: Locator;
  readonly ctaButton: Locator;
  readonly navLinks: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.locator('h1').first();
    this.heroSubheading = page.locator('h1 + p, .hero p, .subtitle').first();
    // CTA is a button inside a Link - target the button directly
    this.ctaButton = page.getByRole('button', { name: /get started/i }).first();
    this.navLinks = page.locator('nav a, header a');
    this.footer = page.locator('footer');
  }

  async goto() {
    await this.page.goto(URLS.BASE);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(URLS.BASE);
    await expect(this.heroHeading).toBeVisible({ timeout: 10000 });
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async clickGetStarted() {
    // Click the CTA button and wait for navigation
    // Flow: click -> /create -> redirect -> /intake
    await this.ctaButton.click();
    // Wait for the final URL after redirect, with extended timeout
    await this.page.waitForURL(/\/intake/, { timeout: 15000 });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
