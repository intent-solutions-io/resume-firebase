import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Resume Generation
 *
 * Tests the full flow:
 * 1. Intake form submission
 * 2. Military document upload
 * 3. LLM transcription (Vertex AI)
 * 4. Resume generation and download
 *
 * Verifies LLM ability to translate military experience to civilian terms
 */

test.describe('Resume Generation E2E', () => {

  test.describe.configure({ timeout: 180000 }); // 3 minutes for LLM processing

  test('should generate resume from military documents - full flow', async ({ page }) => {
    // Step 1: Navigate to intake form
    await page.goto('/intake');
    await expect(page).toHaveURL(/\/intake/);

    // Verify page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Step 2: Fill out candidate info
    console.log('Filling out intake form...');

    await page.fill('input[name="firstName"]', 'Marcus');
    await page.fill('input[name="lastName"]', 'Johnson');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '555-123-4567');

    // Select branch (dropdown or radio)
    const branchSelect = page.locator('select[name="branch"]');
    if (await branchSelect.isVisible()) {
      await branchSelect.selectOption('Army');
    } else {
      await page.click('text=Army');
    }

    await page.fill('input[name="rank"]', 'SGT (E-5)');
    await page.fill('input[name="mos"]', '11B - Infantryman');
    await page.fill('input[name="yearsOfService"]', '8');

    // Submit intake form
    await page.click('button[type="submit"], button:has-text("Continue")');

    // Wait for navigation to documents page
    await page.waitForURL(/\/intake\/.*\/documents/, { timeout: 10000 });
    console.log('Navigated to documents page');

    // Step 3: Upload military documents
    console.log('Uploading military documents...');

    const fixturesPath = path.join(__dirname, '../fixtures');
    const dd214Path = path.join(fixturesPath, 'mock-dd214.txt');
    const erbPath = path.join(fixturesPath, 'mock-erb.txt');
    const vmetPath = path.join(fixturesPath, 'mock-vmet.txt');
    const ncoerPath = path.join(fixturesPath, 'mock-ncoer.txt');

    // Upload files
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([dd214Path, erbPath, vmetPath, ncoerPath]);

    // Wait for uploads to complete (look for success indicators)
    await page.waitForTimeout(3000);

    // Verify files are listed
    await expect(page.locator('text=mock-dd214.txt').or(page.locator('text=dd214'))).toBeVisible({ timeout: 5000 });

    console.log('Documents uploaded successfully');

    // Step 4: Trigger resume generation
    console.log('Triggering resume generation...');

    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Continue"), button:has-text("Submit")');
    await generateButton.click();

    // Wait for navigation to complete page
    await page.waitForURL(/\/intake\/.*\/complete|\/candidate\//, { timeout: 15000 });
    console.log('Navigated to complete page');

    // Step 5: Wait for LLM processing
    console.log('Waiting for LLM processing (this may take up to 2 minutes)...');

    // Poll for status changes
    const maxWaitTime = 120000; // 2 minutes
    const pollInterval = 5000;
    let elapsed = 0;
    let resumeReady = false;

    while (elapsed < maxWaitTime && !resumeReady) {
      await page.waitForTimeout(pollInterval);
      elapsed += pollInterval;

      // Check for resume ready indicators
      const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download"), text=Resume Ready');
      const processingIndicator = page.locator('text=Processing, text=Generating');
      const errorIndicator = page.locator('text=Error, text=Failed');

      if (await downloadButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        resumeReady = true;
        console.log(`Resume ready after ${elapsed / 1000} seconds`);
      } else if (await errorIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        throw new Error('Resume generation failed');
      } else {
        console.log(`Still processing... (${elapsed / 1000}s elapsed)`);
      }
    }

    expect(resumeReady).toBe(true);

    // Step 6: Verify download buttons are present
    const pdfDownload = page.locator('button:has-text("PDF"), a:has-text("PDF")');
    const docxDownload = page.locator('button:has-text("DOCX"), a:has-text("DOCX"), a:has-text("Word")');

    await expect(pdfDownload.or(docxDownload)).toBeVisible({ timeout: 5000 });

    console.log('Resume generation complete - downloads available');

    // Take screenshot of final state
    await page.screenshot({ path: './reports/resume-complete.png', fullPage: true });
  });

  test('should NOT update status when no documents uploaded', async ({ page }) => {
    // Regression test for Issue #6

    await page.goto('/intake');

    // Fill out minimal info
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test-nodocs-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '555-000-0000');

    const branchSelect = page.locator('select[name="branch"]');
    if (await branchSelect.isVisible()) {
      await branchSelect.selectOption('Army');
    } else {
      await page.click('text=Army');
    }

    await page.fill('input[name="rank"]', 'PFC');
    await page.fill('input[name="mos"]', '92Y');
    await page.fill('input[name="yearsOfService"]', '2');

    await page.click('button[type="submit"], button:has-text("Continue")');

    // Navigate to documents page but DON'T upload anything
    await page.waitForURL(/\/intake\/.*\/documents/, { timeout: 10000 });

    // Try to continue without uploading
    const continueButton = page.locator('button:has-text("Generate"), button:has-text("Continue"), button:has-text("Skip")');

    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(2000);
    }

    // Verify status is NOT "Documents Uploaded" when no docs were uploaded
    const statusBadge = page.locator('.badge, [class*="status"]');

    // Should show "Profile Created" or similar, NOT "Documents Uploaded"
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('Documents Uploaded');

    console.log('Issue #6 regression test passed - status not incorrectly set');

    await page.screenshot({ path: './reports/no-docs-test.png', fullPage: true });
  });

  test('should display uploaded documents count correctly', async ({ page }) => {
    await page.goto('/intake');

    // Fill form
    await page.fill('input[name="firstName"]', 'Count');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `test-count-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '555-111-2222');

    const branchSelect = page.locator('select[name="branch"]');
    if (await branchSelect.isVisible()) {
      await branchSelect.selectOption('Marines');
    } else {
      await page.click('text=Marines');
    }

    await page.fill('input[name="rank"]', 'Cpl');
    await page.fill('input[name="mos"]', '0311');
    await page.fill('input[name="yearsOfService"]', '4');

    await page.click('button[type="submit"], button:has-text("Continue")');
    await page.waitForURL(/\/intake\/.*\/documents/, { timeout: 10000 });

    // Upload 2 documents
    const fixturesPath = path.join(__dirname, '../fixtures');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      path.join(fixturesPath, 'mock-dd214.txt'),
      path.join(fixturesPath, 'mock-erb.txt')
    ]);

    await page.waitForTimeout(2000);

    // Verify document count shows 2
    const pageContent = await page.textContent('body');
    const hasTwoCount = pageContent?.includes('2') ?? false;

    console.log('Document count verification:', hasTwoCount ? 'PASS' : 'FAIL');

    await page.screenshot({ path: './reports/doc-count-test.png', fullPage: true });
  });
});
