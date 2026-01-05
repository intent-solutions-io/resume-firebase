import { Page, Locator, expect } from '@playwright/test';
import { URLS, TEST_CANDIDATE } from '../fixtures/test-data';

/**
 * Page Object Model: Candidate Intake Form
 */
export class IntakePage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly branchSelect: Locator;
  readonly rankInput: Locator;
  readonly mosInput: Locator;
  readonly targetJobTextarea: Locator;
  readonly submitButton: Locator;
  readonly formErrors: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form fields - multiple selectors for robustness
    this.nameInput = page.locator('input[name="name"], input[id*="name"], input[placeholder*="name" i]').first();
    this.emailInput = page.locator('input[name="email"], input[type="email"], input[id*="email"]').first();
    this.phoneInput = page.locator('input[name="phone"], input[type="tel"], input[id*="phone"]').first();
    this.cityInput = page.locator('input[name="city"], input[id*="city"]').first();
    this.stateInput = page.locator('input[name="state"], select[name="state"], input[id*="state"]').first();
    this.branchSelect = page.locator('select[name="branch"], select[id*="branch"]').first();
    this.rankInput = page.locator('input[name="rank"], input[id*="rank"]').first();
    this.mosInput = page.locator('input[name="mos"], input[id*="mos"]').first();
    this.targetJobTextarea = page.locator('textarea[name*="job"], textarea[name*="target"], textarea[id*="job"]').first();

    this.submitButton = page.getByRole('button', { name: /continue|next|submit|create/i }).first();
    this.formErrors = page.locator('.error, .error-message, [class*="error"]');
    this.progressIndicator = page.locator('.progress, .step, [class*="progress"]');
  }

  async goto() {
    await this.page.goto(`${URLS.BASE}/intake`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/intake/);
    // Wait for form to be visible
    await expect(this.nameInput.or(this.emailInput)).toBeVisible({ timeout: 10000 });
  }

  async fillForm(data: Partial<typeof TEST_CANDIDATE> = TEST_CANDIDATE) {
    // Fill required fields
    if (data.name && await this.nameInput.isVisible()) {
      await this.nameInput.fill(data.name);
    }

    if (data.email && await this.emailInput.isVisible()) {
      await this.emailInput.fill(data.email);
    }

    // Fill optional fields if visible
    if (data.phone && await this.phoneInput.isVisible().catch(() => false)) {
      await this.phoneInput.fill(data.phone);
    }

    if (data.city && await this.cityInput.isVisible().catch(() => false)) {
      await this.cityInput.fill(data.city);
    }

    if (data.state && await this.stateInput.isVisible().catch(() => false)) {
      const isSelect = await this.stateInput.evaluate(el => el.tagName === 'SELECT');
      if (isSelect) {
        await this.stateInput.selectOption(data.state);
      } else {
        await this.stateInput.fill(data.state);
      }
    }

    if (data.branch && await this.branchSelect.isVisible().catch(() => false)) {
      await this.branchSelect.selectOption({ label: new RegExp(data.branch, 'i') });
    }

    if (data.rank && await this.rankInput.isVisible().catch(() => false)) {
      await this.rankInput.fill(data.rank);
    }

    if (data.mos && await this.mosInput.isVisible().catch(() => false)) {
      await this.mosInput.fill(data.mos);
    }
  }

  async fillTargetJob(jobDescription: string) {
    if (await this.targetJobTextarea.isVisible().catch(() => false)) {
      await this.targetJobTextarea.fill(jobDescription);
    }
  }

  async submit(): Promise<string> {
    await this.submitButton.click();

    // Wait for navigation to documents page
    await this.page.waitForURL(/\/intake\/([^/]+)\/documents/, { timeout: 15000 });

    // Extract candidate ID from URL
    const url = this.page.url();
    const match = url.match(/\/intake\/([^/]+)\/documents/);
    if (!match) {
      throw new Error(`Failed to extract candidate ID from URL: ${url}`);
    }

    return match[1];
  }

  async expectNoErrors() {
    const errorCount = await this.formErrors.count();
    expect(errorCount).toBe(0);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
