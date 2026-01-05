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

    // Form fields - use actual placeholder text from IntakePage.tsx
    this.nameInput = page.getByPlaceholder('John Smith');
    this.emailInput = page.getByPlaceholder('john.smith@email.com');
    this.phoneInput = page.locator('input[type="tel"]').first();
    this.cityInput = page.locator('input[placeholder*="city" i]').first();
    this.stateInput = page.locator('select[name="state"], input[placeholder*="state" i]').first();
    this.branchSelect = page.getByRole('combobox').first(); // Branch is the first select
    this.rankInput = page.getByPlaceholder('SSG, CPT, etc.');
    this.mosInput = page.getByPlaceholder('11B, IT, 3D1X1');
    this.targetJobTextarea = page.getByPlaceholder(/paste the job posting/i);

    this.submitButton = page.getByRole('button', { name: /continue to document upload/i });
    this.formErrors = page.locator('.alert-error, .error, [class*="error"]');
    this.progressIndicator = page.locator('.step-indicator, .step, [class*="progress"]');
  }

  async goto() {
    await this.page.goto(`${URLS.BASE}/intake`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/intake/);
    // Wait for form to be visible - check for the submit button which is always present
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  async fillForm(data: Partial<typeof TEST_CANDIDATE> = TEST_CANDIDATE) {
    // Fill required fields - these must be filled
    if (data.name) {
      await this.nameInput.waitFor({ state: 'visible', timeout: 5000 });
      await this.nameInput.clear();
      await this.nameInput.fill(data.name);
    }

    if (data.email) {
      await this.emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await this.emailInput.clear();
      await this.emailInput.fill(data.email);
    }

    // Select branch (required field)
    if (data.branch) {
      await this.branchSelect.selectOption(data.branch);
    }

    // Fill optional fields if visible
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
