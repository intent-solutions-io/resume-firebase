import { Page, Locator, expect } from '@playwright/test';
import { URLS } from '../fixtures/test-data';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Page Object Model: Document Upload Page
 */
export class DocumentUploadPage {
  readonly page: Page;
  readonly candidateId: string;
  readonly fileInput: Locator;
  readonly dropZone: Locator;
  readonly uploadButton: Locator;
  readonly generateButton: Locator;
  readonly uploadedFilesList: Locator;
  readonly uploadProgress: Locator;
  readonly errorMessages: Locator;
  readonly successMessages: Locator;

  constructor(page: Page, candidateId: string) {
    this.page = page;
    this.candidateId = candidateId;

    this.fileInput = page.locator('input[type="file"]').first();
    this.dropZone = page.locator('[class*="dropzone"], [class*="drop-zone"], [class*="upload-area"]').first();
    this.uploadButton = page.getByRole('button', { name: /upload|add/i }).first();
    this.generateButton = page.getByRole('button', { name: /generate|create|process|continue/i }).first();
    this.uploadedFilesList = page.locator('[class*="file-list"], [class*="uploaded"], ul li');
    this.uploadProgress = page.locator('[class*="progress"], progress');
    this.errorMessages = page.locator('[class*="error"]');
    this.successMessages = page.locator('[class*="success"]');
  }

  async goto() {
    await this.page.goto(`${URLS.BASE}/intake/${this.candidateId}/documents`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`/intake/${this.candidateId}/documents`));
    // Wait for upload area to be visible
    await expect(this.fileInput.or(this.dropZone)).toBeVisible({ timeout: 10000 });
  }

  async createTestFile(filename: string, content: string): Promise<string> {
    const testFilesDir = path.join(process.cwd(), 'test-results', 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  async uploadFile(filePath: string) {
    // Make file input visible if hidden
    await this.fileInput.evaluate((el: HTMLInputElement) => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
    });

    await this.fileInput.setInputFiles(filePath);

    // Wait for upload to complete
    await this.page.waitForTimeout(2000);
  }

  async uploadTestDocument(content: string, filename = 'test-dd214.txt') {
    const filePath = await this.createTestFile(filename, content);
    await this.uploadFile(filePath);
  }

  async getUploadedFilesCount(): Promise<number> {
    return await this.uploadedFilesList.count();
  }

  async clickGenerate() {
    await expect(this.generateButton).toBeEnabled({ timeout: 10000 });
    await this.generateButton.click();
  }

  async waitForProcessingComplete(timeout = 120000) {
    // Wait for navigation to complete page or status update
    await this.page.waitForURL(/\/intake\/.*\/complete|\/candidate\//, { timeout });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}
